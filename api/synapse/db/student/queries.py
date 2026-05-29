"""
Student database queries (Supabase).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OWNER: Student developer
Tables: students, knowledge_maps, quiz_sessions, assessments, notes
"""
from __future__ import annotations
from synapse.db.client import get_client
from synapse.models import KnowledgeMap, Assessment, GradeReport, SmartNotes


# ── Students ──────────────────────────────────────────────────────────────────

async def upsert_student(student_id: str, email: str = "", name: str = "") -> dict:
    client = get_client()
    result = client.table("students").upsert({
        "id": student_id,
        "email": email,
        "name": name,
    }).execute()
    return result.data[0] if result.data else {}


async def get_student(student_id: str) -> dict | None:
    client = get_client()
    result = client.table("students").select("*").eq("id", student_id).execute()
    return result.data[0] if result.data else None


# ── Knowledge Maps ─────────────────────────────────────────────────────────────

async def save_knowledge_map(km: KnowledgeMap) -> dict:
    client = get_client()
    result = client.table("knowledge_maps").upsert({
        "student_id": km.student_id,
        "topics": [t.model_dump() for t in km.topics],
        "overall_mastery": km.overall_mastery,
    }).execute()
    return result.data[0] if result.data else {}


async def load_knowledge_map(student_id: str) -> KnowledgeMap | None:
    client = get_client()
    result = (
        client.table("knowledge_maps")
        .select("*")
        .eq("student_id", student_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    row = result.data[0]
    return KnowledgeMap(
        student_id=row["student_id"],
        topics=row["topics"],
        overall_mastery=row["overall_mastery"],
    )


# ── Quiz Sessions ──────────────────────────────────────────────────────────────

async def save_quiz_session(student_id: str, topics: list[str], quiz_json: dict) -> str:
    """Persist a generated quiz so correct answers are available at evaluation time."""
    client = get_client()
    result = client.table("quiz_sessions").insert({
        "student_id": student_id,
        "topics": topics,
        "quiz": quiz_json,
    }).execute()
    return result.data[0]["id"] if result.data else ""


async def load_quiz_session(student_id: str) -> dict | None:
    """Load the most recent quiz for a student."""
    client = get_client()
    result = (
        client.table("quiz_sessions")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


# ── Assessments ────────────────────────────────────────────────────────────────

async def save_assessment(assessment: Assessment) -> dict:
    client = get_client()
    result = client.table("assessments").insert({
        "id": assessment.id,
        "student_id": assessment.student_id,
        "topic": assessment.topic,
        "questions": [q.model_dump() for q in assessment.questions],
    }).execute()
    return result.data[0] if result.data else {}


async def load_assessment(assessment_id: str) -> dict | None:
    client = get_client()
    result = client.table("assessments").select("*").eq("id", assessment_id).execute()
    return result.data[0] if result.data else None


async def save_grade_report(report: GradeReport) -> dict:
    client = get_client()
    result = client.table("grade_reports").insert({
        "assessment_id": report.assessment_id,
        "student_id": report.student_id,
        "topic": report.topic,
        "score": report.score,
        "per_question": [q.model_dump() for q in report.per_question],
        "updated_status": report.updated_status.model_dump(),
    }).execute()
    return result.data[0] if result.data else {}


# ── Notes ─────────────────────────────────────────────────────────────────────

async def save_notes(notes: SmartNotes) -> dict:
    client = get_client()
    result = client.table("student_notes").insert({
        "student_id": notes.student_id,
        "topic": notes.topic,
        "summary": notes.summary,
        "sections": [s.model_dump() for s in notes.sections],
        "key_concepts": notes.key_concepts,
        "sources": [s.model_dump() for s in notes.sources],
    }).execute()
    return result.data[0] if result.data else {}


async def list_notes(student_id: str) -> list[dict]:
    client = get_client()
    result = (
        client.table("student_notes")
        .select("id, topic, summary, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ── Flashcards ─────────────────────────────────────────────────────────────────

async def save_flashcards(student_id: str, topic: str, cards: list[dict]) -> dict:
    client = get_client()
    result = client.table("flashcards").insert({
        "student_id": student_id,
        "topic": topic,
        "cards": cards,
    }).execute()
    return result.data[0] if result.data else {}


async def get_flashcards(student_id: str, topic: str) -> list[dict]:
    client = get_client()
    result = (
        client.table("flashcards")
        .select("cards, created_at")
        .eq("student_id", student_id)
        .eq("topic", topic)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return []
    return result.data[0].get("cards", [])


# ── Class discovery ────────────────────────────────────────────────────────────

async def get_class_by_code(code: str) -> dict | None:
    client = get_client()
    result = (
        client.table("classrooms")
        .select("*")
        .eq("join_code", code.upper())
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


async def get_enrolled_classes(student_id: str) -> list[dict]:
    client = get_client()
    result = (
        client.table("enrollments")
        .select("classroom_id, classrooms(id, name, description, topics, teacher_id, join_code)")
        .eq("student_id", student_id)
        .execute()
    )
    classes = []
    for row in (result.data or []):
        classroom = row.get("classrooms") or {}
        if classroom:
            classes.append(classroom)
    return classes
