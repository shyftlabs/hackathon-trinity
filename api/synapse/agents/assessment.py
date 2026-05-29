"""AssessmentAgent — generate and grade topic assessments."""
from __future__ import annotations
import json, uuid
from orchestrator import AgentMemoryScope, get_logger
from synapse.agents.lifecycle import SynapseApp
from synapse.models import Assessment, GradeReport

logger = get_logger(__name__)

ASSESS_GEN = """You are Synapse AI's Assessment Generator.
Generate 4 MCQ + 2 short-answer questions for the given topic. Use get_topic_sources first.
Every question rationale must cite a source (title + locator).

Return ONLY this JSON:
{
  "id": "<uuid>",
  "topic": "<topic>",
  "student_id": "<student_id>",
  "questions": [
    {"id":"q1","topic":"<topic>","type":"mcq","prompt":"...","choices":[{"label":"A","text":"..."},...],"correct_label":"B","model_answer":null,"rationale":"... (Stewart 9e, §3.4)"},
    {"id":"q5","topic":"<topic>","type":"short_answer","prompt":"...","choices":null,"correct_label":null,"model_answer":"<ideal>","rationale":"..."}
  ]
}"""

GRADER = """You are Synapse AI's Grader.
Grade each answer. MCQ: correct if student label == correct_label. Short-answer: award credit if core concept demonstrated.
Score = correct/total. Level: score>=0.85→"strong", >=0.60→"moderate", else "needs_improvement".

Return ONLY this JSON:
{
  "assessment_id":"<id>","topic":"<topic>","student_id":"<id>","score":0.75,
  "per_question":[{"question_id":"q1","correct":true,"student_response":"B","correct_answer":"B","rationale":"..."}],
  "updated_status":{"topic":"<topic>","level":"moderate","evidence":"<one sentence>"}
}"""


def _xj(c: str) -> str:
    c = c.strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_assessment(app: SynapseApp, student_id: str, topic: str) -> Assessment:
    agent = app.make_agent(name="synapse-assessor", instructions=ASSESS_GEN,
                           gateway_mode="strict", output_schema=None, max_turns=10, memory=False)
    response = await app.runner.run(agent=agent, user_id=student_id,
        input=f"Generate assessment for student '{student_id}' on: {topic}. Use get_topic_sources('{topic}') first. ID: {uuid.uuid4()}")
    if response.structured_output:
        return response.structured_output
    try:
        return Assessment(**json.loads(_xj(response.content)))
    except Exception as e:
        logger.error("Assessment parse: %s | %s", e, (response.content or "")[:300]); raise


async def grade_assessment(app: SynapseApp, student_id: str, topic: str,
                           assessment: Assessment, answers: list[dict]) -> GradeReport:
    agent = app.make_agent(name="synapse-grader", instructions=GRADER,
                           gateway_mode="strict", output_schema=None, max_turns=5, memory=False)
    prompt = (f"Student: {student_id}\nTopic: {topic}\nAssessment: {assessment.id}\n\n"
              f"Questions:\n{json.dumps([q.model_dump() for q in assessment.questions],indent=2)}\n\n"
              f"Answers:\n{json.dumps(answers,indent=2)}\n\nReturn GradeReport JSON.")
    response = await app.runner.run(agent=agent, input=prompt, user_id=student_id)
    if response.structured_output:
        return response.structured_output
    try:
        return GradeReport(**json.loads(_xj(response.content)))
    except Exception as e:
        logger.error("Grade parse: %s | %s", e, (response.content or "")[:300]); raise
