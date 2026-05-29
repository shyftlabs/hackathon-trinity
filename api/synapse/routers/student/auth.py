"""
Student auth endpoints.
OWNER: Student developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import Student, StudentAuthRequest
from synapse.db.student.queries import upsert_student, get_student

router = APIRouter(prefix="/student/auth", tags=["student-auth"])


@router.post("/register", response_model=Student)
async def register(payload: StudentAuthRequest) -> Student:
    """Register or update a student account."""
    try:
        await upsert_student(payload.id, payload.email, payload.name)
        return Student(id=payload.id, email=payload.email, name=payload.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}", response_model=Student)
async def get_profile(student_id: str) -> Student:
    """Fetch student profile by ID."""
    row = await get_student(student_id)
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return Student(
        id=row["id"],
        email=row.get("email", ""),
        name=row.get("name", ""),
        teacher_id=row.get("teacher_id"),
    )
