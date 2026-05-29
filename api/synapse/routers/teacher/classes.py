"""
Classroom management endpoints.
OWNER: Teacher developer
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from synapse.models import (
    Classroom,
    ClassroomCreate,
    ClassroomMaterialBatchCreate,
    SyllabusUpload,
    PublishMaterialsRequest,
    ClassroomInvite,
    InviteStudentRequest,
)
from synapse.db.teacher.queries import (
    create_classroom,
    get_classroom,
    list_teacher_classrooms,
    enroll_student,
    list_classroom_students,
    save_syllabus,
    get_syllabus,
    update_classroom_topics,
    create_classroom_invite,
    list_classroom_invites,
    create_classroom_material,
    list_classroom_materials,
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
    """Create a new classroom and return it with its generated join code."""
    try:
        classroom = Classroom(
            teacher_id=payload.teacher_id,
            name=payload.name,
            description=payload.description,
            topics=payload.topics,
        )
        saved = await create_classroom(classroom)
        # Reflect the server-assigned join code (and id) back to the client.
        return Classroom(**{**classroom.model_dump(), **{k: saved[k] for k in ("id", "join_code") if k in saved}})
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
        materials = await list_classroom_materials(classroom_id)
        return {
            "classroom": classroom,
            "students": students,
            "syllabus": syllabus,
            "materials": materials,
        }
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


@router.post("/{classroom_id}/publish")
async def publish_materials(classroom_id: str, payload: PublishMaterialsRequest):
    """Derive the class topic list from the prof's uploaded lecture material
    (via a Continuum agent) and publish it as the classroom syllabus so
    students see the updated topics."""
    classroom = await get_classroom(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    try:
        from synapse.agents.lifecycle import get_synapse_app
        from synapse.agents.syllabus import extract_topics

        topics = await extract_topics(
            app=get_synapse_app(),
            teacher_id=payload.teacher_id or classroom["teacher_id"],
            about=payload.about,
            materials=payload.materials,
        )
        if not topics:
            raise HTTPException(status_code=422, detail="Could not derive topics from the material")

        await save_syllabus(classroom_id, classroom["teacher_id"], topics, payload.about)
        await update_classroom_topics(classroom_id, topics)
        return {"classroom_id": classroom_id, "topics": topics}
    except HTTPException:
        raise
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


@router.post("/{classroom_id}/invite", response_model=ClassroomInvite)
async def invite_student(classroom_id: str, payload: InviteStudentRequest):
    """Create an invite code for a registered student."""
    if not payload.student_id.strip():
        raise HTTPException(status_code=400, detail="student_id is required")

    classroom = await get_classroom(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    return await create_classroom_invite(
        classroom_id=classroom_id,
        student_id=payload.student_id,
        teacher_id=classroom["teacher_id"],
    )


@router.get("/{classroom_id}/invites")
async def classroom_invites(classroom_id: str, status: str | None = None):
    """List invite codes created for a classroom."""
    await get_classroom(classroom_id)  # will 404 if missing
    return {
        "classroom_id": classroom_id,
        "invites": await list_classroom_invites(classroom_id, status),
    }


@router.post("/{classroom_id}/materials")
async def upload_classroom_materials(classroom_id: str, payload: ClassroomMaterialBatchCreate):
    """Upload one or more resources for a classroom.

    In build 1 we persist metadata URL + title only; file transport is handled by frontend service.
    """
    classroom = await get_classroom(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    if not payload.materials:
        return {
            "classroom_id": classroom_id,
            "materials": [],
        }

    saved = []
    for item in payload.materials:
        if not item.title.strip() or not item.material_url.strip():
            continue
        saved.append(
            await create_classroom_material(
                classroom_id=classroom_id,
                teacher_id=classroom["teacher_id"],
                title=item.title,
                material_url=item.material_url,
                content_type=item.content_type,
                description=item.description,
            )
        )

    return {
        "classroom_id": classroom_id,
        "materials": saved,
    }


@router.get("/{classroom_id}/materials")
async def classroom_materials(classroom_id: str):
    """List uploaded classroom materials."""
    await get_classroom(classroom_id)
    return {
        "classroom_id": classroom_id,
        "materials": await list_classroom_materials(classroom_id),
    }
