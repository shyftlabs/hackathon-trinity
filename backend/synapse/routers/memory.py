"""Memory management endpoints (GDPR / transparency)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from synapse.agents.lifecycle import get_synapse_app

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/{student_id}")
async def get_memories(student_id: str):
    """List all stored memories for a student."""
    app = get_synapse_app()
    try:
        memory_client = app.container.memory_client
        if not memory_client or not memory_client.is_enabled:
            raise HTTPException(status_code=503, detail="Memory service unavailable")
        memories = await memory_client.get_all(user_id=student_id)
        return {"student_id": student_id, "memories": memories}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{student_id}/{memory_id}")
async def delete_memory(student_id: str, memory_id: str):
    """Delete a specific memory."""
    app = get_synapse_app()
    try:
        memory_client = app.container.memory_client
        if not memory_client or not memory_client.is_enabled:
            raise HTTPException(status_code=503, detail="Memory service unavailable")
        await memory_client.delete(memory_id=memory_id)
        return {"deleted": memory_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{student_id}")
async def delete_all_memories(student_id: str):
    """Delete all memories for a student (GDPR erasure)."""
    app = get_synapse_app()
    try:
        memory_client = app.container.memory_client
        if not memory_client or not memory_client.is_enabled:
            raise HTTPException(status_code=503, detail="Memory service unavailable")
        await memory_client.delete_all(user_id=student_id)
        return {"deleted_all_for": student_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{student_id}/coordinator")
async def coordinate(student_id: str, message: str, profile: dict | None = None):
    """Route a free-text student request to the right agent via coordinator."""
    from synapse.agents.coordinator import coordinate as do_coordinate
    from synapse.models import LearningProfile

    app = get_synapse_app()
    try:
        lp = LearningProfile(**(profile or {}))
        return await do_coordinate(app, student_id, message, lp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
