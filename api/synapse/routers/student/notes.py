"""
Smart Notes endpoints — student route.
OWNER: Student developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import NotesRequest, SmartNotes
from synapse.db.student.queries import save_notes, list_notes

router = APIRouter(prefix="/student/notes", tags=["student-notes"])


@router.post("/", response_model=SmartNotes)
async def create_notes(request: NotesRequest) -> SmartNotes:
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.notes import generate_notes
    app = get_synapse_app()
    broad = {"introduction", "overview", "fundamentals", "complete", "full", "all"}
    complex_topic = any(kw in request.topic.lower() for kw in broad)
    try:
        notes = await generate_notes(app, request.student_id, request.topic, request.content, complex_topic)
        await save_notes(notes)
        return notes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}")
async def get_notes_list(student_id: str):
    try:
        return {"student_id": student_id, "notes": await list_notes(student_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
