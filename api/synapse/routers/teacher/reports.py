"""
Report generation endpoints.
OWNER: Teacher developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/teacher/reports", tags=["teacher-reports"])


@router.get("/{classroom_id}/summary")
async def classroom_summary_report(classroom_id: str):
    """
    Full classroom progress report — JSON (Stage 1).
    PDF export to be added in Stage 2 (reportlab).
    """
    from synapse.db.teacher.queries import (
        get_classroom,
        get_syllabus,
        get_student_knowledge_maps_for_class,
        get_student_count,
    )
    try:
        classroom = await get_classroom(classroom_id)
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        syllabus = await get_syllabus(classroom_id)
        km_rows = await get_student_knowledge_maps_for_class(classroom_id)
        total = await get_student_count(classroom_id)

        student_summaries = []
        for row in km_rows:
            km_data = row.get("knowledge_maps") or {}
            if isinstance(km_data, list):
                km_data = km_data[0] if km_data else {}
            student_summaries.append({
                "student_id": row["student_id"],
                "overall_mastery": km_data.get("overall_mastery", 0.0),
                "topics": km_data.get("topics", []),
            })

        return {
            "classroom": classroom,
            "syllabus": syllabus,
            "total_students": total,
            "student_progress": student_summaries,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
