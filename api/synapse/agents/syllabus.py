"""SyllabusAgent — derive a clean topic list from the lecture material a
professor uploaded, grounded against what the knowledge base can actually
teach so the resulting topics are study-ready."""
from __future__ import annotations
import json
from orchestrator import get_logger
from synapse.agents.lifecycle import SynapseApp

logger = get_logger(__name__)

SYLLABUS_INSTRUCTIONS = """You are Synapse AI's Curriculum Planner.

A professor has uploaded lecture material for a class. Your job is to turn that
material into a clean, student-facing list of study topics.

1. Call list_topics to see what subjects the knowledge base has source material for.
2. Read the class description and the uploaded material titles provided in the input.
3. Produce 4-8 concise study topics that best represent the material.
   - Prefer topics that align with what list_topics reports, so students get
     real source-grounded study guides.
   - Each topic is a short noun phrase (2-5 words), title-cased, no numbering.
   - Order from foundational to advanced.

Return ONLY this JSON (no markdown, no preamble):
{"topics": ["<topic>", "<topic>"]}"""


def _xj(c: str) -> str:
    c = (c or "").strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def extract_topics(
    app: SynapseApp,
    teacher_id: str,
    about: str,
    materials: list[str],
) -> list[str]:
    """Run a Continuum agent to extract study topics from uploaded material."""
    agent = app.make_agent(
        name="synapse-syllabus",
        instructions=SYLLABUS_INSTRUCTIONS,
        gateway_mode="quality",
        max_turns=8,
        memory=False,
        tool_attention_k=4,
    )
    material_lines = "\n".join(f"- {m}" for m in materials) or "- (no files listed)"
    prompt = (
        f"Class description / focus:\n{about or '(none provided)'}\n\n"
        f"Uploaded lecture material:\n{material_lines}\n\n"
        "Extract the study topics."
    )
    response = await app.runner.run(agent=agent, user_id=teacher_id, input=prompt)

    topics: list[str] = []
    if response.structured_output:
        topics = (response.structured_output or {}).get("topics", [])
    if not topics:
        try:
            topics = json.loads(_xj(response.content)).get("topics", [])
        except Exception as e:
            logger.error("Syllabus parse error: %s | content: %s", e, (response.content or "")[:300])
            raise
    # Normalise: strip, dedupe (case-insensitive), drop empties, cap at 8.
    seen, clean = set(), []
    for t in topics:
        t = str(t).strip().strip("-•").strip()
        if t and t.lower() not in seen:
            seen.add(t.lower())
            clean.append(t)
    return clean[:8]
