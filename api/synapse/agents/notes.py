"""SmartNotesAgent — hierarchical AI notes with RAG + splitter for complex topics."""
from __future__ import annotations
import json
from orchestrator import AgentMemoryScope, get_logger
from synapse.agents.lifecycle import SynapseApp
from synapse.models import SmartNotes

logger = get_logger(__name__)

NOTES_INSTRUCTIONS = """You are Synapse AI's Smart Notes Generator.
1. Call get_topic_sources to retrieve all source material.
2. Call search_source_material for additional relevant content.
3. Synthesize into hierarchical study notes.

Return ONLY this JSON:
{
  "topic": "<topic>", "student_id": "<id>",
  "summary": "<2-3 sentence overview>",
  "sections": [
    {"heading":"<title>","content":"<markdown>","subsections":[{"heading":"...","content":"...","subsections":[]}]}
  ],
  "key_concepts": ["<concept>"],
  "sources": [{"title":"<book>","locator":"<chapter>","text":"<excerpt>"}]
}"""

SPLITTER = """Identify 2-4 distinct sub-topics for this complex topic. Return ONLY a JSON array of strings.
Example: ["Derivatives", "Integrals", "Fundamental Theorem"]"""

SYNTHESIZER = """Merge these sub-topic SmartNotes JSON objects into ONE unified SmartNotes document.
Combine sections in logical order, deduplicate key_concepts, write a unified summary.
Return ONLY the merged SmartNotes JSON."""


def _xj(c: str) -> str:
    c = c.strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_notes(app: SynapseApp, student_id: str, topic: str,
                         content: str = "", complex_topic: bool = False) -> SmartNotes:
    if complex_topic:
        return await _pipeline(app, student_id, topic, content)
    return await _simple(app, student_id, topic, content)


async def _simple(app, student_id, topic, content):
    agent = app.make_agent(name="synapse-notes", instructions=NOTES_INSTRUCTIONS,
                           gateway_mode="quality", output_schema=None, max_turns=10,
                           memory=True, memory_scope=AgentMemoryScope.USER, tool_attention_k=4)
    extra = f"\n\nAdditional content:\n{content}" if content else ""
    response = await app.runner.run(agent=agent, user_id=student_id,
                                    input=f"Generate smart notes for '{student_id}' on: {topic}.{extra}")
    if response.structured_output:
        return response.structured_output
    try:
        return SmartNotes(**json.loads(_xj(response.content)))
    except Exception as e:
        logger.error("Notes parse: %s | %s", e, (response.content or "")[:300]); raise


async def _pipeline(app, student_id, topic, content):
    """Splitter → parallel sub-notes → synthesize."""
    splitter = app.make_agent(name="synapse-splitter", instructions=SPLITTER,
                              gateway_mode="strict", max_turns=3, memory=False)
    split_r = await app.runner.run(agent=splitter, input=f"Complex topic: {topic}", user_id=student_id)
    try:
        subtopics: list[str] = json.loads(_xj(split_r.content))
    except Exception:
        subtopics = [topic]
    if len(subtopics) <= 1:
        return await _simple(app, student_id, topic, content)

    sub_notes = []
    for sub in subtopics:
        try:
            n = await _simple(app, student_id, sub, "")
            sub_notes.append(n.model_dump())
        except Exception as e:
            logger.warning("Sub-notes failed for %s: %s", sub, e)

    if not sub_notes:
        return await _simple(app, student_id, topic, content)

    synth = app.make_agent(name="synapse-synthesizer", instructions=SYNTHESIZER,
                           gateway_mode="quality", output_schema=None, max_turns=5,
                           memory=True, memory_scope=AgentMemoryScope.USER)
    synth_r = await app.runner.run(agent=synth, user_id=student_id,
                                   input=f"Merge notes for '{topic}':\n{json.dumps(sub_notes)}")
    try:
        return SmartNotes(**json.loads(_xj(synth_r.content)))
    except Exception:
        return await _simple(app, student_id, topic, content)
