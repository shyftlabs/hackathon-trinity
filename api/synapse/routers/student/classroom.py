"""
Student classroom and invitation flow.
OWNER: Student developer
"""
from __future__ import annotations

import datetime
from fastapi import APIRouter, HTTPException

from synapse.models import InviteAcceptance, KnowledgeGapStartRequest, DiagnosticQuiz
from synapse.db.student.queries import load_knowledge_map, upsert_student
from synapse.db.student.queries import save_quiz_session
from synapse.db.teacher.queries import (
    accept_invite,
    get_classroom,
    get_invite_by_code,
    get_syllabus,
    list_classroom_materials,
    list_student_invites as list_student_invites_query,
    enroll_student,
)

router = APIRouter(prefix="/student/classrooms", tags=["student-classrooms"])


@router.get("/invites/{student_id}")
async def list_student_invites(student_id: str, status: str | None = None):
    """List invitations for a student; default includes all, pass `status=pending` for pending only."""
    try:
        return {
            "student_id": student_id,
            "invites": await list_student_invites_query(student_id, status),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/invites/{invite_code}/accept")
async def accept_invite_code(invite_code: str, payload: InviteAcceptance) -> dict:
    """Accept a teacher invite by code and join the classroom."""
    try:
        invite = await get_invite_by_code(invite_code.upper())
        if not invite:
            raise HTTPException(status_code=404, detail="Invite code not found")

        if invite.get("student_id") != payload.student_id:
            raise HTTPException(status_code=403, detail="This invite is issued for another student user id")

        if invite.get("status") == "accepted":
            classroom_id = invite["classroom_id"]
            return {
                "status": "already_accepted",
                "classroom_id": classroom_id,
                "invite": invite,
            }

        if invite.get("status") != "pending":
            raise HTTPException(status_code=410, detail="Invite is no longer valid")

        expires = invite.get("expires_at")
        if isinstance(expires, str):
            try:
                expiry = datetime.datetime.fromisoformat(expires.replace("Z", "+00:00"))
                if expiry < datetime.datetime.now(datetime.timezone.utc):
                    raise HTTPException(status_code=410, detail="Invite code has expired")
            except ValueError:
                pass

        await upsert_student(payload.student_id)
        await enroll_student(invite["classroom_id"], payload.student_id)
        await accept_invite(payload.student_id, invite_code.upper())

        return {
            "status": "accepted",
            "classroom_id": invite["classroom_id"],
            "invite_code": invite_code.upper(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invites/code/{invite_code}")
async def get_invite_context(invite_code: str, student_id: str | None = None):
    """Fetch classroom context for an invite code (classroom, syllabus, materials)."""
    try:
        invite = await get_invite_by_code(invite_code.upper())
        if not invite:
            raise HTTPException(status_code=404, detail="Invite code not found")

        if student_id and invite.get("student_id") != student_id:
            raise HTTPException(status_code=403, detail="Invite does not match this student")

        classroom = await get_classroom(invite["classroom_id"])
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")

        syllabus = await get_syllabus(invite["classroom_id"])
        materials = await list_classroom_materials(invite["classroom_id"])

        return {
            "classroom": classroom,
            "invite": {
                "code": invite["code"],
                "status": invite["status"],
                "student_id": invite["student_id"],
            },
            "syllabus": syllabus or None,
            "materials": materials,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge-gap/start", response_model=DiagnosticQuiz)
async def start_knowledge_gap_session(request: KnowledgeGapStartRequest) -> DiagnosticQuiz:
    """Start a knowledge-gap assessment for a classroom topic set."""
    from synapse.agents.lifecycle import get_synapse_app
    from synapse.agents.diagnostic import generate_quiz

    app = get_synapse_app()
    try:
        selected_topics: list[str] = []
        if request.mode == "manual":
            selected_topics = [t.strip() for t in request.topics if t.strip()]
            if not selected_topics:
                raise HTTPException(status_code=400, detail="Manual mode requires at least one topic")

        if request.mode == "ai":
            syllabus = await get_syllabus(request.classroom_id)
            available_topics = syllabus.get("topics", []) if syllabus else []
            selected_topics = [t.strip() for t in available_topics if str(t).strip()]

            km = await load_knowledge_map(request.student_id)
            if km and km.topics:
                weak_first = sorted(
                    km.topics,
                    key=lambda item: 0 if item.level == "needs_improvement" else 1 if item.level == "moderate" else 2,
                )
                prioritized = [entry.topic for entry in weak_first if entry.topic in available_topics]
                selected_topics = list(dict.fromkeys([*prioritized, *selected_topics]))

            selected_topics = selected_topics[: request.max_topics]
            if not selected_topics:
                raise HTTPException(status_code=404, detail="No topics available for AI selection")

        if not selected_topics:
            raise HTTPException(status_code=400, detail="No topics selected")

        quiz = await generate_quiz(app, request.student_id, selected_topics)
        await save_quiz_session(request.student_id, selected_topics, quiz.model_dump())
        return quiz
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
