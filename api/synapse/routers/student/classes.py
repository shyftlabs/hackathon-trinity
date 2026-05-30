"""
Student class discovery and enrollment endpoints.
OWNER: Student developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import StudentJoinRequest
from synapse.db.student.queries import (
    get_class_by_code,
    get_enrolled_classes,
    upsert_student,
)
from synapse.db.teacher.queries import enroll_student, get_syllabus

router = APIRouter(prefix="/student/classes", tags=["student-classes"])


@router.post("/join")
async def join_class(payload: StudentJoinRequest):
    """Join a classroom using its invite code. Creates student record if needed."""
    classroom = await get_class_by_code(payload.code)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found — check the code and try again")
    try:
        # Ensure the student exists before enrolling (FK constraint)
        await upsert_student(payload.student_id)
        await enroll_student(classroom["id"], payload.student_id)
        syllabus = await get_syllabus(classroom["id"])
        return {
            "classroom_id": classroom["id"],
            "name": classroom["name"],
            "description": classroom.get("description", ""),
            "topics": syllabus["topics"] if syllabus else classroom.get("topics", []),
            "teacher_id": classroom["teacher_id"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}")
async def list_classes(student_id: str):
    """List all classrooms the student is enrolled in."""
    try:
        classes = await get_enrolled_classes(student_id)
        return {"student_id": student_id, "classrooms": classes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{classroom_id}/topics")
async def get_topics(classroom_id: str):
    """Get the topic list for a classroom.

    Accepts either a classroom UUID or a short join code, so the frontend can
    pass the code from the URL without a separate resolution round-trip.
    """
    try:
        from synapse.db.teacher.queries import get_classroom

        # Resolve the identifier. Try join code first (a plain string match);
        # fall back to a UUID lookup, guarded since a code is not a valid uuid.
        classroom = await get_class_by_code(classroom_id)
        if not classroom:
            try:
                classroom = await get_classroom(classroom_id)
            except Exception:
                classroom = None
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")

        resolved_id = classroom["id"]
        syllabus = await get_syllabus(resolved_id)
        if syllabus:
            return {"classroom_id": resolved_id, "topics": syllabus["topics"]}
        return {"classroom_id": resolved_id, "topics": classroom.get("topics", [])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
