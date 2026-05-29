"""DiagnosticAgent — generate quiz and evaluate answers."""
from __future__ import annotations
import json
from orchestrator import AgentMemoryScope, get_logger
from synapse.agents.lifecycle import SynapseApp
from synapse.models import DiagnosticQuiz, KnowledgeMap

logger = get_logger(__name__)

QUIZ_GEN_INSTRUCTIONS = """You are Synapse AI's Diagnostic Quiz Generator.
Given a list of topics, generate exactly 2 multiple-choice questions (A-D) per topic.
Use get_topic_sources for each topic before writing questions. Base questions on the retrieved source material.

Return ONLY this JSON (no markdown, no preamble):
{
  "student_id": "<student_id>",
  "topics": ["<topic>"],
  "questions": [
    {
      "id": "q1",
      "topic": "<topic>",
      "prompt": "<question>",
      "choices": [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
      "correct_label": "B",
      "rationale": "<explanation with source citation>"
    }
  ]
}"""

QUIZ_EVAL_INSTRUCTIONS = """You are Synapse AI's Knowledge Evaluator.
Given quiz results with student_label and correct_label per question, evaluate understanding.

For each topic determine level:
- "strong" if all correct
- "moderate" if >=50% correct
- "needs_improvement" if <50% correct

Return ONLY this JSON:
{
  "student_id": "<student_id>",
  "topics": [{"topic":"<topic>","level":"strong|moderate|needs_improvement","evidence":"<one sentence>"}],
  "overall_mastery": 0.75
}"""


def _extract_json(content: str) -> str:
    c = content.strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_quiz(app: SynapseApp, student_id: str, topics: list[str]) -> DiagnosticQuiz:
    agent = app.make_agent(name="synapse-quiz-generator", instructions=QUIZ_GEN_INSTRUCTIONS,
                           gateway_mode="strict", output_schema=None, max_turns=10, memory=False)
    prompt = f"Generate diagnostic quiz for student '{student_id}' covering: {', '.join(topics)}. Use get_topic_sources for each topic first."
    response = await app.runner.run(agent=agent, input=prompt, user_id=student_id)
    if response.structured_output:
        return response.structured_output
    try:
        return DiagnosticQuiz(**json.loads(_extract_json(response.content)))
    except Exception as e:
        logger.error("Quiz parse error: %s | content: %s", e, (response.content or "")[:300])
        raise


async def evaluate_quiz(app: SynapseApp, student_id: str, topics: list[str], qa_pairs: list[dict]) -> KnowledgeMap:
    agent = app.make_agent(name="synapse-quiz-evaluator", instructions=QUIZ_EVAL_INSTRUCTIONS,
                           gateway_mode="strict", output_schema=None, max_turns=5, memory=False)
    prompt = (f"Student ID: {student_id}\nTopics: {', '.join(topics)}\n\n"
              f"Quiz results:\n{json.dumps(qa_pairs, indent=2)}\n\nProduce the KnowledgeMap JSON.")
    response = await app.runner.run(agent=agent, input=prompt, user_id=student_id)
    if response.structured_output:
        return response.structured_output
    content = response.content or ""
    if not content.strip():
        raise ValueError(f"Empty evaluator response (status={response.status})")
    try:
        return KnowledgeMap(**json.loads(_extract_json(content)))
    except Exception as e:
        logger.error("Eval parse error: %s | content: %s", e, content[:300])
        raise
