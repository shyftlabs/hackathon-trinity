"""
AssessmentAgent — generates and grades topic assessments.

Uses the KB MCP server for grounded question generation.
Grading updates the student's KnowledgeMap in USER-scope memory.
"""

from __future__ import annotations

import json
import uuid

from orchestrator import AgentMemoryScope, get_logger

from synapse.agents.lifecycle import SynapseApp
from synapse.models import Assessment, GradeReport, KnowledgeMap, TopicStatus

logger = get_logger(__name__)

ASSESSMENT_GEN_INSTRUCTIONS = """
You are Synapse AI's Assessment Generator.

Generate a comprehensive assessment for the given topic. The assessment must include:
- 4 multiple-choice questions (A-D) that test both recall and application
- 2 short-answer questions that require explanation

Use `get_topic_sources` and `search_source_material` to ground all questions in source material.
Every question's rationale must include a source citation (title + locator).

OUTPUT FORMAT — return ONLY this JSON:
{
  "id": "<uuid>",
  "topic": "<topic>",
  "student_id": "<student_id>",
  "questions": [
    {
      "id": "q1",
      "topic": "<topic>",
      "type": "mcq",
      "prompt": "<question>",
      "choices": [{"label":"A","text":"..."},{"label":"B","text":"..."},
                  {"label":"C","text":"..."},{"label":"D","text":"..."}],
      "correct_label": "B",
      "model_answer": null,
      "rationale": "<explanation with source citation>"
    },
    {
      "id": "q5",
      "topic": "<topic>",
      "type": "short_answer",
      "prompt": "<question>",
      "choices": null,
      "correct_label": null,
      "model_answer": "<ideal answer>",
      "rationale": "<grading criteria + source citation>"
    }
  ]
}
Return ONLY the JSON.
"""

GRADING_INSTRUCTIONS = """
You are Synapse AI's Assessment Grader.

Grade the student's assessment answers and produce a GradeReport.
For MCQ: correct iff student's selected label matches correct_label.
For short_answer: compare student's response to the model_answer — award credit if they
demonstrate understanding of the core concept even if wording differs.

Compute score = (correct answers) / (total questions).
Determine updated topic level:
  - score >= 0.85 → "strong"
  - score >= 0.60 → "moderate"
  - score < 0.60  → "needs_improvement"

OUTPUT FORMAT — return ONLY this JSON:
{
  "assessment_id": "<id>",
  "topic": "<topic>",
  "student_id": "<student_id>",
  "score": 0.75,
  "per_question": [
    {
      "question_id": "q1",
      "correct": true,
      "student_response": "B",
      "correct_answer": "B",
      "rationale": "<brief explanation>"
    }
  ],
  "updated_status": {
    "topic": "<topic>",
    "level": "moderate",
    "evidence": "<one sentence>"
  }
}
Return ONLY the JSON.
"""


def _extract_json(content: str) -> str:
    c = content.strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_assessment(
    app: SynapseApp, student_id: str, topic: str
) -> Assessment:
    agent = app.make_agent(
        name="synapse-assessment-generator",
        instructions=ASSESSMENT_GEN_INSTRUCTIONS,
        gateway_mode="strict",
        output_schema=None,
        max_turns=10,
        memory=False,
    )
    prompt = (
        f"Generate an assessment for student '{student_id}' on topic: {topic}. "
        f"Use get_topic_sources('{topic}') first to ground the questions. "
        f"Use assessment ID: {uuid.uuid4()}"
    )
    response = await app.runner.run(agent=agent, input=prompt, user_id=student_id)
    if response.structured_output:
        return response.structured_output
    try:
        data = json.loads(_extract_json(response.content))
        return Assessment(**data)
    except Exception as e:
        logger.error(f"Assessment gen parse error: {e}\nContent: {response.content[:500]}")
        raise


async def grade_assessment(
    app: SynapseApp,
    student_id: str,
    topic: str,
    assessment: Assessment,
    answers: list[dict],  # [{question_id, response}]
) -> GradeReport:
    agent = app.make_agent(
        name="synapse-grader",
        instructions=GRADING_INSTRUCTIONS,
        gateway_mode="strict",
        output_schema=None,
        max_turns=5,
        memory=True,
        memory_scope=AgentMemoryScope.USER,
    )
    prompt = (
        f"Student ID: {student_id}\n"
        f"Topic: {topic}\n"
        f"Assessment ID: {assessment.id}\n\n"
        f"Questions:\n{json.dumps([q.model_dump() for q in assessment.questions], indent=2)}\n\n"
        f"Student answers:\n{json.dumps(answers, indent=2)}\n\n"
        f"Grade this assessment and return the GradeReport JSON."
    )
    response = await app.runner.run(agent=agent, input=prompt, user_id=student_id)
    if response.structured_output:
        return response.structured_output
    try:
        data = json.loads(_extract_json(response.content))
        return GradeReport(**data)
    except Exception as e:
        logger.error(f"Grading parse error: {e}\nContent: {response.content[:500]}")
        raise
