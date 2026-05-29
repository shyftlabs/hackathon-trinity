"""
Diagnostic endpoints — student route.
OWNER: Student developer
"""
from __future__ import annotations
import json
from fastapi import APIRouter, HTTPException
from synapse.models import DiagnoseRequest, DiagnoseEvaluateRequest, DiagnosticQuiz, KnowledgeMap
from synapse.db.student.queries import save_quiz_session, load_quiz_session, save_knowledge_map

router = APIRouter(prefix="/student/diagnose", tags=["student-diagnose"])


@router.post("/quiz", response_model=DiagnosticQuiz)
async def start_diagnostic(request: DiagnoseRequest) -> DiagnosticQuiz:
    """Generate a diagnostic quiz and persist it so evaluate can access correct answers."""
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.diagnostic import generate_quiz
    app = get_synapse_app()
    try:
        quiz = await generate_quiz(app, request.student_id, request.topics)
        # Persist to Supabase so correct answers survive to evaluate step
        await save_quiz_session(request.student_id, request.topics, quiz.model_dump())
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate", response_model=KnowledgeMap)
async def evaluate_diagnostic(request: DiagnoseEvaluateRequest) -> KnowledgeMap:
    """Evaluate quiz answers using stored correct answers → return KnowledgeMap."""
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.diagnostic import QUIZ_EVAL_INSTRUCTIONS, _extract_json
    app = get_synapse_app()
    try:
        # Load quiz from Supabase to get correct_label per question
        session = await load_quiz_session(request.student_id)
        correct_map: dict[str, str] = {}
        topic_map: dict[str, str] = {}
        if session and session.get("quiz"):
            for q in session["quiz"].get("questions", []):
                correct_map[q["id"]] = q["correct_label"]
                topic_map[q["id"]] = q["topic"]

        qa_pairs = [
            {
                "question_id": a.question_id,
                "student_label": a.selected_label,
                "correct_label": correct_map.get(a.question_id, "unknown"),
                "topic": topic_map.get(a.question_id, request.topics[0] if request.topics else "unknown"),
            }
            for a in request.answers
        ]

        agent = app.make_agent(
            name="synapse-quiz-evaluator",
            instructions=QUIZ_EVAL_INSTRUCTIONS,
            gateway_mode="strict",
            output_schema=None,
            max_turns=5,
            memory=False,
        )
        prompt = (
            f"Student ID: {request.student_id}\n"
            f"Topics assessed: {', '.join(request.topics)}\n\n"
            f"Quiz results:\n{json.dumps(qa_pairs, indent=2)}\n\n"
            "Produce the KnowledgeMap JSON."
        )
        response = await app.runner.run(agent=agent, input=prompt, user_id=request.student_id)
        content = response.content or ""
        if not content.strip():
            raise ValueError(f"Empty evaluator response (status={response.status})")
        data = json.loads(_extract_json(content))
        km = KnowledgeMap(**data)

        # Persist to Supabase
        await save_knowledge_map(km)
        return km
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
