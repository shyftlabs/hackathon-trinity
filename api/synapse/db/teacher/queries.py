"""
Teacher database queries (Supabase).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OWNER: Teacher developer
Tables: teachers, classrooms, enrollments, syllabi, cohort_snapshots
"""
from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone

from synapse.db.client import get_client
from synapse.models import Teacher, Classroom, Enrollment, CohortAnalytics


_INVITE_CODE_LEN = 8
_INVITE_TTL_DAYS = 30


def _new_invite_code(length: int = _INVITE_CODE_LEN) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _to_iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


async def _next_invite_code(client) -> str:
    """Generate a unique invite code not used yet."""
    for _ in range(12):
        code = _new_invite_code()
        existing = client.table("classroom_invitations").select("id").eq("code", code).limit(1).execute()
        if not existing.data:
            return code
    raise RuntimeError("Unable to allocate unique classroom invite code")


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


async def create_classroom_invite(classroom_id: str, student_id: str, teacher_id: str) -> dict:
    """Create a classroom invite code for one specific registered student."""
    client = get_client()

    existing = (
        client.table("classroom_invitations")
        .select("*")
        .eq("classroom_id", classroom_id)
        .eq("student_id", student_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    code = await _next_invite_code(client)
    expires_at = _to_iso(datetime.now(timezone.utc) + timedelta(days=_INVITE_TTL_DAYS))
    result = client.table("classroom_invitations").insert(
        {
            "classroom_id": classroom_id,
            "student_id": student_id,
            "teacher_id": teacher_id,
            "code": code,
            "status": "pending",
            "expires_at": expires_at,
        }
    ).execute()
    return result.data[0] if result.data else {}


async def get_invite_by_code(code: str) -> dict | None:
    client = get_client()
    result = client.table("classroom_invitations").select("*").eq("code", code).limit(1).execute()
    return result.data[0] if result.data else None


async def list_classroom_invites(classroom_id: str, status: str | None = None) -> list[dict]:
    client = get_client()
    query = (
        client.table("classroom_invitations")
        .select("*")
        .eq("classroom_id", classroom_id)
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data or []


async def list_student_invites(student_id: str, status: str | None = None) -> list[dict]:
    client = get_client()
    query = (
        client.table("classroom_invitations")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data or []


async def accept_invite(student_id: str, code: str) -> dict:
    client = get_client()
    now = _to_iso(datetime.now(timezone.utc))
    result = (
        client.table("classroom_invitations")
        .update({"status": "accepted", "accepted_at": now})
        .eq("code", code)
        .eq("student_id", student_id)
        .eq("status", "pending")
        .execute()
    )
    if result.data:
        return result.data[0]

    updated = await get_invite_by_code(code)
    return updated or {}


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


async def create_classroom_material(
    classroom_id: str,
    teacher_id: str,
    title: str,
    material_url: str,
    content_type: str = "application/pdf",
    description: str = "",
) -> dict:
    client = get_client()
    result = client.table("classroom_materials").insert(
        {
            "classroom_id": classroom_id,
            "teacher_id": teacher_id,
            "title": title,
            "material_url": material_url,
            "content_type": content_type,
            "description": description,
        }
    ).execute()
    return result.data[0] if result.data else {}


async def list_classroom_materials(classroom_id: str) -> list[dict]:
    client = get_client()
    result = (
        client.table("classroom_materials")
        .select("*")
        .eq("classroom_id", classroom_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


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
