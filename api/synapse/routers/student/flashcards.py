"""
Flashcards endpoints — student route.
OWNER: Student developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import FlashcardsRequest, FlashcardsResponse, Flashcard
from synapse.db.student.queries import save_flashcards, get_flashcards

router = APIRouter(prefix="/student/flashcards", tags=["student-flashcards"])


@router.post("/", response_model=FlashcardsResponse)
async def create_flashcards(request: FlashcardsRequest) -> FlashcardsResponse:
    """Generate AI flashcards for a topic, grounded in course material, and persist them."""
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.flashcards import generate_flashcards
    app = get_synapse_app()
    try:
        result = await generate_flashcards(app, request.student_id, request.topic, request.content)
        await save_flashcards(request.student_id, request.topic, [f.model_dump() for f in result.flashcards])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}/{topic}", response_model=FlashcardsResponse)
async def fetch_flashcards(student_id: str, topic: str) -> FlashcardsResponse:
    """Retrieve the most recently generated flashcards for a student + topic."""
    try:
        cards = await get_flashcards(student_id, topic)
        return FlashcardsResponse(
            student_id=student_id,
            topic=topic,
            flashcards=[Flashcard(**c) for c in cards],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
