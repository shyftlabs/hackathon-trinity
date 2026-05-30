"""Audio summary + mind map endpoints — student route.
OWNER: Student developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import AudioSummary, MindMap

router = APIRouter(prefix="/student", tags=["student-media"])


@router.post("/audio/", response_model=AudioSummary)
async def audio_summary(payload: dict) -> AudioSummary:
    """Generate a spoken-word narration script for a topic."""
    student_id = payload.get("student_id", "")
    topic = payload.get("topic", "")
    if not student_id or not topic:
        raise HTTPException(status_code=400, detail="student_id and topic are required")
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.audio import generate_audio_summary
    try:
        return await generate_audio_summary(get_synapse_app(), student_id, topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mindmap/", response_model=MindMap)
async def mind_map(payload: dict) -> MindMap:
    """Generate a hierarchical concept map for a topic."""
    student_id = payload.get("student_id", "")
    topic = payload.get("topic", "")
    if not student_id or not topic:
        raise HTTPException(status_code=400, detail="student_id and topic are required")
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.mindmap import generate_mindmap
    try:
        return await generate_mindmap(get_synapse_app(), student_id, topic)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
