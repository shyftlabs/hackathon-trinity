"""FlashcardsAgent — generate study flashcards grounded in course material."""
from __future__ import annotations
import json
from orchestrator import AgentMemoryScope, get_logger
from synapse.agents.lifecycle import SynapseApp
from synapse.models import FlashcardsResponse, Flashcard

logger = get_logger(__name__)

FLASHCARDS_INSTRUCTIONS = """You are Synapse AI's Flashcard Generator.
1. Call get_topic_sources to retrieve all source material for the topic.
2. Call search_source_material for any additional relevant content.
3. Generate 10-15 high-quality flashcards that test key concepts from the material.

Rules:
- Front: a concise question, term, or concept prompt (max 20 words)
- Back: a clear, complete answer with a source citation e.g. "(CLRS 4e, §3.2)"
- Cover definitions, mechanisms, comparisons, and application — not just recall
- Order from foundational to advanced

Return ONLY this JSON (no markdown, no preamble):
{
  "student_id": "<student_id>",
  "topic": "<topic>",
  "flashcards": [
    {"front": "<question or term>", "back": "<answer with source>"}
  ]
}"""


def _xj(c: str) -> str:
    c = c.strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_flashcards(
    app: SynapseApp,
    student_id: str,
    topic: str,
    content: str = "",
) -> FlashcardsResponse:
    agent = app.make_agent(
        name="synapse-flashcards",
        instructions=FLASHCARDS_INSTRUCTIONS,
        gateway_mode="quality",
        output_schema=None,
        max_turns=10,
        memory=True,
        memory_scope=AgentMemoryScope.USER,
        tool_attention_k=4,
    )
    extra = f"\n\nAdditional content:\n{content}" if content else ""
    response = await app.runner.run(
        agent=agent,
        user_id=student_id,
        input=f"Generate flashcards for student '{student_id}' on topic: {topic}.{extra}",
    )
    if response.structured_output:
        return response.structured_output
    try:
        data = json.loads(_xj(response.content))
        return FlashcardsResponse(
            student_id=data.get("student_id", student_id),
            topic=data.get("topic", topic),
            flashcards=[Flashcard(**f) for f in data.get("flashcards", [])],
        )
    except Exception as e:
        logger.error("Flashcards parse error: %s | content: %s", e, (response.content or "")[:300])
        raise
