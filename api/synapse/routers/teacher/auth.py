"""
Teacher auth endpoints.
OWNER: Teacher developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import Teacher
from synapse.db.teacher.queries import upsert_teacher, get_teacher_by_email

router = APIRouter(prefix="/teacher/auth", tags=["teacher-auth"])


@router.post("/register", response_model=Teacher)
async def register_teacher(teacher: Teacher) -> Teacher:
    """Register or update a teacher account."""
    try:
        existing = await get_teacher_by_email(teacher.email)
        if existing:
            raise HTTPException(status_code=409, detail="Teacher with this email already exists")
        await upsert_teacher(teacher)
        return teacher
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{teacher_id}", response_model=Teacher | None)
async def get_teacher(teacher_id: str):
    """Fetch teacher profile."""
    from synapse.db.teacher.queries import get_teacher as _get
    try:
        return await _get(teacher_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
