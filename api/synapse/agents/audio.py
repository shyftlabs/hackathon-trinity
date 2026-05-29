"""AudioAgent — generate a spoken-word narration script for a topic, grounded
in course material. The script is spoken client-side via the Web Speech API."""
from __future__ import annotations
import json
from orchestrator import AgentMemoryScope, get_logger
from synapse.agents.lifecycle import SynapseApp
from synapse.models import AudioSummary

logger = get_logger(__name__)

AUDIO_INSTRUCTIONS = """You are Synapse AI's Audio Summary narrator.
1. Call get_topic_sources and search_source_material to gather the key material.
2. Write a clear, engaging narration the student can listen to — like a short podcast segment.

Rules:
- Conversational, spoken tone (it will be read aloud by a text-to-speech voice).
- 250-450 words. No markdown, no headings, no bullet points, no citations like "(CLRS 3.2)".
- Spell out symbols ("the derivative of f of x", not "f'(x)").
- Open with a one-line hook, cover 3-4 core ideas, end with a quick recap.

Return ONLY this JSON (no markdown fences):
{"topic":"<topic>","student_id":"<id>","title":"<short title>","script":"<narration>","duration_estimate":"~N min"}"""


def _xj(c: str) -> str:
    c = (c or "").strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_audio_summary(app: SynapseApp, student_id: str, topic: str) -> AudioSummary:
    agent = app.make_agent(
        name="synapse-audio",
        instructions=AUDIO_INSTRUCTIONS,
        gateway_mode="quality",
        max_turns=8,
        memory=True,
        memory_scope=AgentMemoryScope.USER,
        tool_attention_k=4,
    )
    response = await app.runner.run(
        agent=agent,
        user_id=student_id,
        input=f"Write an audio summary for student '{student_id}' on topic: {topic}.",
    )
    if response.structured_output:
        return AudioSummary(**{"student_id": student_id, "topic": topic, **response.structured_output})
    try:
        data = json.loads(_xj(response.content))
        return AudioSummary(
            topic=data.get("topic", topic),
            student_id=data.get("student_id", student_id),
            title=data.get("title", topic),
            script=data.get("script", ""),
            duration_estimate=data.get("duration_estimate", ""),
        )
    except Exception as e:
        logger.error("Audio parse error: %s | %s", e, (response.content or "")[:300])
        raise
