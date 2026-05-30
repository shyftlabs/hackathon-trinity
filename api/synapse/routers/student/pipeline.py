"""
Study material pipeline endpoints — student route.
OWNER: Student developer

POST /student/pipeline/generate   — scatter notes+flashcards for topic list (called after assessment)
POST /student/pipeline/memory-quiz — memory-informed personalized quiz (called after tutor chat)
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/student/pipeline", tags=["student-pipeline"])


class GenerateMaterialsRequest(BaseModel):
    student_id: str
    topics: list[str]


class MemoryQuizRequest(BaseModel):
    student_id: str
    topic: str
    chat_summary: str = Field(default="", description="Summary of the tutor chat session for this topic")


@router.post("/generate")
async def generate_materials(request: GenerateMaterialsRequest):
    """
    Scatter notes + flashcards generation across all topics in parallel.
    Call this after knowledge-gap assessment evaluates OR after assessment grading.
    Uses Continuum ScatterAgent: each topic spawns notes + flashcards branches concurrently.
    """
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.material_pipeline import generate_study_materials
    app = get_synapse_app()
    if not request.topics:
        raise HTTPException(status_code=400, detail="At least one topic required")
    try:
        results = await generate_study_materials(app, request.student_id, request.topics)
        return {
            "student_id": request.student_id,
            "topics_processed": len(results),
            "results": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/memory-quiz")
async def memory_quiz(request: MemoryQuizRequest):
    """
    Generate a personalized quiz using the student's long-term Mem0 memory
    and the tutor chat summary. Call this when student clicks 'Take the quiz'
    after a tutor session (the frontend should pass the last chat summary).
    Uses AgentMemoryScope.USER to load accumulated knowledge gaps from Redis/Mem0.
    """
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.material_pipeline import generate_memory_quiz
    app = get_synapse_app()
    try:
        quiz = await generate_memory_quiz(
            app, request.student_id, request.topic, request.chat_summary
        )
        # Persist to assessments table so grading endpoint can retrieve it
        from synapse.models import Assessment, AssessmentQuestion
        from synapse.db.student.queries import save_assessment
        assessment = Assessment(
            id=quiz.get("id", ""),
            topic=quiz.get("topic", request.topic),
            student_id=quiz.get("student_id", request.student_id),
            questions=[AssessmentQuestion(**q) for q in quiz.get("questions", [])],
        )
        await save_assessment(assessment)
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
