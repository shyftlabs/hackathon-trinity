"""Diagnostic endpoints: generate quiz and evaluate answers."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from synapse.agents.diagnostic import evaluate_quiz, generate_quiz
from synapse.agents.lifecycle import get_synapse_app
from synapse.models import (
    DiagnoseEvaluateRequest,
    DiagnoseRequest,
    DiagnosticQuiz,
    KnowledgeMap,
    QuizAnswer,
)

router = APIRouter(prefix="/diagnose", tags=["diagnose"])

# Cache generated quizzes keyed by student_id so evaluate can look up correct answers
_quiz_cache: dict[str, DiagnosticQuiz] = {}


@router.post("/quiz", response_model=DiagnosticQuiz)
async def start_diagnostic(request: DiagnoseRequest) -> DiagnosticQuiz:
    """Phase 1: Generate a diagnostic quiz for the given topics."""
    app = get_synapse_app()
    try:
        quiz = await generate_quiz(app, request.student_id, request.topics)
        _quiz_cache[request.student_id] = quiz  # store for evaluation step
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate", response_model=KnowledgeMap)
async def evaluate_diagnostic(request: DiagnoseEvaluateRequest) -> KnowledgeMap:
    """Phase 2: Evaluate quiz answers and return a KnowledgeMap."""
    from orchestrator import get_logger
    log = get_logger("synapse.diagnose")
    app = get_synapse_app()
    try:
        # Build QA pairs including correct_label from cached quiz
        cached_quiz = _quiz_cache.get(request.student_id)
        correct_map = {}
        if cached_quiz:
            correct_map = {q.id: q.correct_label for q in cached_quiz.questions}

        qa_pairs = [
            {
                "question_id": a.question_id,
                "student_label": a.selected_label,
                "correct_label": correct_map.get(a.question_id, "unknown"),
                "topic": next(
                    (q.topic for q in cached_quiz.questions if q.id == a.question_id), "unknown"
                ) if cached_quiz else "unknown",
            }
            for a in request.answers
        ]
        # Run the evaluation agent directly so we can log the raw response
        from synapse.agents.diagnostic import QUIZ_EVAL_INSTRUCTIONS, _extract_json
        import json as _json
        from orchestrator import AgentMemoryScope

        agent = app.make_agent(
            name="synapse-quiz-evaluator",
            instructions=QUIZ_EVAL_INSTRUCTIONS,
            gateway_mode="strict",
            output_schema=None,
            max_turns=5,
            memory=False,  # keep simple in FastAPI context
        )
        import json
        qa_text = json.dumps(qa_pairs, indent=2)
        prompt = (
            f"Student ID: {request.student_id}\n"
            f"Topics assessed: {', '.join(request.topics)}\n\n"
            f"Quiz results:\n{qa_text}\n\n"
            f"Produce the KnowledgeMap JSON."
        )
        response = await app.runner.run(agent=agent, input=prompt, user_id=request.student_id)
        content_raw = response.content or ""
        log.info("Evaluate response: status=%s, content_len=%d, content=%r, error=%s",
                 response.status, len(content_raw), content_raw[:300], response.error)

        if response.structured_output:
            return response.structured_output
        if not content_raw.strip():
            raise ValueError(f"Empty response from evaluator (status={response.status}, error={response.error})")
        try:
            data = _json.loads(_extract_json(content_raw))
        except _json.JSONDecodeError as je:
            raise ValueError(f"JSON parse failed: {je} | raw={content_raw[:300]}")
        try:
            return KnowledgeMap(**data)
        except Exception as ve:
            raise ValueError(f"KnowledgeMap validation failed: {ve} | data={data}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
