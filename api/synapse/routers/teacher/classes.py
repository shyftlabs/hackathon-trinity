"""
Classroom management endpoints.
OWNER: Teacher developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import Classroom, ClassroomCreate, Enrollment, SyllabusUpload
from synapse.db.teacher.queries import (
    create_classroom,
    get_classroom,
    list_teacher_classrooms,
    enroll_student,
    list_classroom_students,
    save_syllabus,
    get_syllabus,
    update_classroom_topics,
)

router = APIRouter(prefix="/teacher/classes", tags=["teacher-classes"])


@router.get("/{teacher_id}/all")
async def list_classes(teacher_id: str):
    """List all classrooms owned by a teacher."""
    try:
        return {"classrooms": await list_teacher_classrooms(teacher_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Classroom)
async def create_class(payload: ClassroomCreate) -> Classroom:
    """Create a new classroom."""
    try:
        classroom = Classroom(
            teacher_id=payload.teacher_id,
            name=payload.name,
            description=payload.description,
            topics=payload.topics,
        )
        await create_classroom(classroom)
        return classroom
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{classroom_id}")
async def get_class(classroom_id: str):
    """Get classroom detail including enrolled students."""
    try:
        classroom = await get_classroom(classroom_id)
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        students = await list_classroom_students(classroom_id)
        syllabus = await get_syllabus(classroom_id)
        return {"classroom": classroom, "students": students, "syllabus": syllabus}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{classroom_id}/syllabus")
async def upload_syllabus(classroom_id: str, payload: SyllabusUpload):
    """Upload or update the syllabus for a classroom."""
    try:
        await save_syllabus(classroom_id, payload.teacher_id, payload.topics, payload.description)
        await update_classroom_topics(classroom_id, payload.topics)
        return {"classroom_id": classroom_id, "topics": payload.topics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{classroom_id}/enroll")
async def enroll(classroom_id: str, student_id: str):
    """Enroll a student in a classroom."""
    try:
        await enroll_student(classroom_id, student_id)
        return {"enrolled": student_id, "classroom_id": classroom_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
