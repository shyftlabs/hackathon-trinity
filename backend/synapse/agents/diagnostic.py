"""
DiagnosticAgent — generates adaptive quiz questions and evaluates answers.

Two-phase flow:
  Phase 1 (generate_quiz): topics → DiagnosticQuiz   [gateway_mode=strict]
  Phase 2 (evaluate_quiz): QA pairs → KnowledgeMap   [gateway_mode=strict]

Both phases use the KB MCP server for grounded question generation.
"""

from __future__ import annotations

import json

from orchestrator import AgentMemoryScope, get_logger

from synapse.agents.lifecycle import SynapseApp
from synapse.models import DiagnosticQuiz, KnowledgeMap

logger = get_logger(__name__)

QUIZ_GEN_INSTRUCTIONS = """
You are Synapse AI's Diagnostic Quiz Generator for undergraduate students.

Your task: given a list of topics, generate a short adaptive quiz to assess the student's
current knowledge level. For each topic generate exactly 2 multiple-choice questions (A-D).

PROCESS:
1. Use the `get_topic_sources` tool to retrieve source material for each topic.
2. Base each question directly on the retrieved source material.
3. Make questions diagnostic — they should distinguish between surface-level and deep understanding.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact schema:
{
  "student_id": "<student_id>",
  "topics": ["<topic1>", ...],
  "questions": [
    {
      "id": "q1",
      "topic": "<topic>",
      "prompt": "<question text>",
      "choices": [
        {"label": "A", "text": "<choice>"},
        {"label": "B", "text": "<choice>"},
        {"label": "C", "text": "<choice>"},
        {"label": "D", "text": "<choice>"}
      ],
      "correct_label": "B",
      "rationale": "<why this answer is correct, with source citation>"
    }
  ]
}

Include source citations (title + locator) in each rationale.
Return ONLY the JSON object — no markdown, no preamble.
"""

QUIZ_EVAL_INSTRUCTIONS = """
You are Synapse AI's Knowledge Evaluator.

Your task: given a student's quiz answers (topic, question, correct_label, student_label),
evaluate their understanding and produce a KnowledgeMap.

For each topic:
- Determine level: "strong" (all correct), "moderate" (≥50% correct), "needs_improvement" (<50% correct)
- Write 1 sentence of evidence grounded in what the student did/didn't know

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact schema:
{
  "student_id": "<student_id>",
  "topics": [
    {
      "topic": "<topic>",
      "level": "strong|moderate|needs_improvement",
      "evidence": "<one sentence>"
    }
  ],
  "overall_mastery": 0.72
}

overall_mastery: fraction of questions answered correctly (0.0–1.0).
Return ONLY the JSON object.
"""


def _extract_json(content: str) -> str:
    """Strip markdown code fences if present and return raw JSON."""
    c = content.strip()
    if c.startswith("```"):
        lines = c.splitlines()
        # drop first and last fence lines
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_quiz(app: SynapseApp, student_id: str, topics: list[str]) -> DiagnosticQuiz:
    agent = app.make_agent(
        name="synapse-quiz-generator",
        instructions=QUIZ_GEN_INSTRUCTIONS,
        gateway_mode="strict",
        output_schema=None,   # instruction-based JSON — avoids structured-output mode issues
        max_turns=10,
        memory=False,
    )
    prompt = (
        f"Generate a diagnostic quiz for student '{student_id}' covering these topics: "
        f"{', '.join(topics)}. "
        f"Use get_topic_sources for each topic before writing questions."
    )
    response = await app.runner.run(
        agent=agent,
        input=prompt,
        user_id=student_id,
    )
    if response.structured_output:
        return response.structured_output
    try:
        data = json.loads(_extract_json(response.content))
        return DiagnosticQuiz(**data)
    except Exception as e:
        logger.error(f"Quiz generation parse error: {e}\nContent: {response.content[:500]}")
        raise


async def evaluate_quiz(
    app: SynapseApp,
    student_id: str,
    topics: list[str],
    qa_pairs: list[dict],  # [{topic, question_id, prompt, correct_label, student_label}]
) -> KnowledgeMap:
    agent = app.make_agent(
        name="synapse-quiz-evaluator",
        instructions=QUIZ_EVAL_INSTRUCTIONS,
        gateway_mode="strict",
        output_schema=None,   # instruction-based JSON
        max_turns=5,
        memory=True,
        memory_scope=AgentMemoryScope.USER,
    )
    qa_text = json.dumps(qa_pairs, indent=2)
    prompt = (
        f"Student ID: {student_id}\n"
        f"Topics assessed: {', '.join(topics)}\n\n"
        f"Quiz results:\n{qa_text}\n\n"
        f"Produce the KnowledgeMap JSON."
    )
    response = await app.runner.run(
        agent=agent,
        input=prompt,
        user_id=student_id,
    )
    if response.structured_output:
        return response.structured_output
    try:
        data = json.loads(_extract_json(response.content))
        return KnowledgeMap(**data)
    except Exception as e:
        logger.error(f"Evaluation parse error: {e}\nContent: {response.content[:500]}")
        raise
