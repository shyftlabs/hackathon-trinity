"""Smart Notes endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from synapse.agents.lifecycle import get_synapse_app
from synapse.agents.notes import generate_notes
from synapse.models import NotesRequest, SmartNotes

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/", response_model=SmartNotes)
async def create_notes(request: NotesRequest) -> SmartNotes:
    """Generate AI smart notes for a topic."""
    app = get_synapse_app()
    # Treat as complex topic if content is large or topic name suggests breadth
    broad_keywords = {"introduction", "overview", "fundamentals", "complete", "full", "all"}
    complex_topic = any(kw in request.topic.lower() for kw in broad_keywords)
    try:
        return await generate_notes(
            app=app,
            student_id=request.student_id,
            topic=request.topic,
            content=request.content,
            complex_topic=complex_topic,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
