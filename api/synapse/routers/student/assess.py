"""
Assessment endpoints — student route.
OWNER: Student developer
"""
from __future__ import annotations
import json
from fastapi import APIRouter, HTTPException
from synapse.models import Assessment, AssessmentSubmission, GradeReport
from synapse.db.student.queries import save_assessment, load_assessment, save_grade_report, save_knowledge_map
from synapse.models import KnowledgeMap, TopicStatus

router = APIRouter(prefix="/student/assess", tags=["student-assess"])


@router.post("/grade", response_model=GradeReport)
async def grade(submission: AssessmentSubmission) -> GradeReport:
    """Grade a submitted assessment and update the student knowledge map."""
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.assessment import grade_assessment
    app = get_synapse_app()
    row = await load_assessment(submission.assessment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
    try:
        from synapse.models import Assessment, AssessmentQuestion
        assessment = Assessment(
            id=row["id"],
            topic=row["topic"],
            student_id=row["student_id"],
            questions=[AssessmentQuestion(**q) for q in row["questions"]],
        )
        answers = [a.model_dump() for a in submission.answers]
        report = await grade_assessment(app, submission.student_id, submission.topic, assessment, answers)

        await save_grade_report(report)
        # Also update the knowledge map in Supabase with the new topic status
        from synapse.db.student.queries import load_knowledge_map
        km = await load_knowledge_map(submission.student_id)
        if km:
            topics = [t for t in km.topics if t.topic.lower() != report.topic.lower()]
            topics.append(report.updated_status)
            updated_km = KnowledgeMap(
                student_id=submission.student_id,
                topics=topics,
                overall_mastery=sum(
                    1.0 if t.level == "strong" else 0.5 if t.level == "moderate" else 0.0
                    for t in topics
                ) / max(len(topics), 1),
            )
            await save_knowledge_map(updated_km)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# NOTE: declared AFTER /grade so the literal path isn't captured by {topic}.
@router.post("/{topic}", response_model=Assessment)
async def create_assessment(topic: str, student_id: str) -> Assessment:
    """Generate and persist a new assessment."""
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.assessment import generate_assessment
    app = get_synapse_app()
    try:
        assessment = await generate_assessment(app, student_id, topic)
        await save_assessment(assessment)
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
