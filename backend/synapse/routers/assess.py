"""Assessment endpoints: generate and grade assessments."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from synapse.agents.assessment import generate_assessment, grade_assessment
from synapse.agents.lifecycle import get_synapse_app
from synapse.models import Assessment, AssessmentSubmission, GradeReport

router = APIRouter(prefix="/assess", tags=["assess"])

# In-memory assessment store (replace with Redis/DB for production)
_assessments: dict[str, Assessment] = {}


@router.post("/{topic}", response_model=Assessment)
async def create_assessment(topic: str, student_id: str) -> Assessment:
    """Generate a new assessment for a topic."""
    app = get_synapse_app()
    try:
        assessment = await generate_assessment(app, student_id, topic)
        _assessments[assessment.id] = assessment
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/grade", response_model=GradeReport)
async def grade(submission: AssessmentSubmission) -> GradeReport:
    """Grade an assessment submission and update the knowledge map."""
    app = get_synapse_app()
    assessment = _assessments.get(submission.assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    try:
        answers = [a.model_dump() for a in submission.answers]
        return await grade_assessment(
            app, submission.student_id, submission.topic, assessment, answers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
