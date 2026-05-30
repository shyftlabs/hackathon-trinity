"""MindMapAgent — build a hierarchical concept map for a topic, grounded in
course material. Central topic → branches → child concepts."""
from __future__ import annotations
import json
from orchestrator import AgentMemoryScope, get_logger
from synapse.agents.lifecycle import SynapseApp
from synapse.models import MindMap, MindMapBranch

logger = get_logger(__name__)

MINDMAP_INSTRUCTIONS = """You are Synapse AI's Mind Map builder.
1. Call get_topic_sources and search_source_material to gather the key material.
2. Decompose the topic into a hierarchical concept map.

Rules:
- 3-6 branches, each a major sub-area (short noun phrase, 1-4 words).
- Each branch has 2-5 child concepts (short phrases, the key terms a student must know).
- Cover the breadth of the topic; don't repeat concepts across branches.

Return ONLY this JSON (no markdown fences):
{"topic":"<topic>","student_id":"<id>","summary":"<1 sentence>",
 "branches":[{"title":"<branch>","children":["<concept>","<concept>"]}]}"""


def _xj(c: str) -> str:
    c = (c or "").strip()
    if c.startswith("```"):
        lines = c.splitlines()
        c = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return c.strip()


async def generate_mindmap(app: SynapseApp, student_id: str, topic: str) -> MindMap:
    agent = app.make_agent(
        name="synapse-mindmap",
        instructions=MINDMAP_INSTRUCTIONS,
        gateway_mode="quality",
        max_turns=8,
        memory=True,
        memory_scope=AgentMemoryScope.USER,
        tool_attention_k=4,
    )
    response = await app.runner.run(
        agent=agent,
        user_id=student_id,
        input=f"Build a mind map for student '{student_id}' on topic: {topic}.",
    )
    if response.structured_output:
        return MindMap(**{"student_id": student_id, "topic": topic, **response.structured_output})
    try:
        data = json.loads(_xj(response.content))
        return MindMap(
            topic=data.get("topic", topic),
            student_id=data.get("student_id", student_id),
            summary=data.get("summary", ""),
            branches=[MindMapBranch(**b) for b in data.get("branches", [])],
        )
    except Exception as e:
        logger.error("MindMap parse error: %s | %s", e, (response.content or "")[:300])
        raise
