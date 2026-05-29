"""
Teacher database queries (Supabase).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OWNER: Teacher developer
Tables: teachers, classrooms, enrollments, syllabi, cohort_snapshots
"""
from __future__ import annotations
from synapse.db.client import get_client
from synapse.models import Teacher, Classroom, Enrollment, CohortAnalytics


# ── Teachers ──────────────────────────────────────────────────────────────────

async def upsert_teacher(teacher: Teacher) -> dict:
    client = get_client()
    result = client.table("teachers").upsert(teacher.model_dump()).execute()
    return result.data[0] if result.data else {}


async def get_teacher(teacher_id: str) -> dict | None:
    client = get_client()
    result = client.table("teachers").select("*").eq("id", teacher_id).execute()
    return result.data[0] if result.data else None


async def get_teacher_by_email(email: str) -> dict | None:
    client = get_client()
    result = client.table("teachers").select("*").eq("email", email).execute()
    return result.data[0] if result.data else None


# ── Classrooms ────────────────────────────────────────────────────────────────

async def create_classroom(classroom: Classroom) -> dict:
    client = get_client()
    result = client.table("classrooms").insert(classroom.model_dump()).execute()
    return result.data[0] if result.data else {}


async def get_classroom(classroom_id: str) -> dict | None:
    client = get_client()
    result = client.table("classrooms").select("*").eq("id", classroom_id).execute()
    return result.data[0] if result.data else None


async def list_teacher_classrooms(teacher_id: str) -> list[dict]:
    client = get_client()
    result = (
        client.table("classrooms")
        .select("*")
        .eq("teacher_id", teacher_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


async def update_classroom_topics(classroom_id: str, topics: list[str]) -> dict:
    client = get_client()
    result = (
        client.table("classrooms")
        .update({"topics": topics})
        .eq("id", classroom_id)
        .execute()
    )
    return result.data[0] if result.data else {}


# ── Enrollments ───────────────────────────────────────────────────────────────

async def enroll_student(classroom_id: str, student_id: str) -> dict:
    client = get_client()
    result = client.table("enrollments").upsert({
        "classroom_id": classroom_id,
        "student_id": student_id,
    }).execute()
    return result.data[0] if result.data else {}


async def list_classroom_students(classroom_id: str) -> list[dict]:
    """Return students enrolled in a classroom with their latest knowledge map."""
    client = get_client()
    result = (
        client.table("enrollments")
        .select("student_id, students(id, name, email)")
        .eq("classroom_id", classroom_id)
        .execute()
    )
    return result.data or []


async def get_student_count(classroom_id: str) -> int:
    client = get_client()
    result = (
        client.table("enrollments")
        .select("student_id", count="exact")
        .eq("classroom_id", classroom_id)
        .execute()
    )
    return result.count or 0


# ── Syllabi ───────────────────────────────────────────────────────────────────

async def save_syllabus(classroom_id: str, teacher_id: str, topics: list[str], description: str = "") -> dict:
    client = get_client()
    result = client.table("syllabi").upsert({
        "classroom_id": classroom_id,
        "teacher_id": teacher_id,
        "topics": topics,
        "description": description,
    }).execute()
    return result.data[0] if result.data else {}


async def get_syllabus(classroom_id: str) -> dict | None:
    client = get_client()
    result = (
        client.table("syllabi")
        .select("*")
        .eq("classroom_id", classroom_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


# ── Cohort Analytics ──────────────────────────────────────────────────────────

async def save_cohort_snapshot(classroom_id: str, analytics: CohortAnalytics) -> dict:
    client = get_client()
    result = client.table("cohort_snapshots").insert({
        "classroom_id": classroom_id,
        "total_students": analytics.total_students,
        "avg_mastery": analytics.avg_mastery,
        "topic_breakdown": [t.model_dump() for t in analytics.topic_breakdown],
        "struggling_topics": analytics.struggling_topics,
    }).execute()
    return result.data[0] if result.data else {}


async def get_student_knowledge_maps_for_class(classroom_id: str) -> list[dict]:
    """Aggregate all knowledge maps for students in a classroom."""
    client = get_client()
    result = (
        client.table("enrollments")
        .select("student_id, knowledge_maps(student_id, topics, overall_mastery, updated_at)")
        .eq("classroom_id", classroom_id)
        .execute()
    )
    return result.data or []
