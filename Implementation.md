# Synapse Build — Implementation Plan

## Branch context
- Working branch: `build`
- Team split focus:
  - **Teacher**: classroom/module ownership, teacher dashboard endpoints
  - **Student (you)**: student classroom lifecycle + assessment/knowledge-gap flow
  - **Frontend**: Aman (view wiring)

## Current implementation state
Backend already has baseline endpoints for:
- student tutoring (`/student/tutor/stream`)
- diagnostic assessment (`/student/diagnose/*`)
- topic assessment (`/student/assess/*`)
- smart notes (`/student/notes/*`)
- teacher classroom CRUD (`/teacher/classes/*`)
- teacher analytics/reports

## Scope for this build pass
Based on the prompt, this pass adds
1. Invite-by-user-id flow for teacher-to-student joins
2. Classroom material metadata uploads
3. Student-side classroom resolution and accept flow
4. Classroom-aware knowledge-gap kickoff (manual or AI topic selection)
5. DB/migration artifacts and contract docs

## Implemented in this pass
### 1) Shared data contracts
- Added DTOs in `api/synapse/models.py`:
  - `InviteStudentRequest`
  - `ClassroomInvite`
  - `InviteAcceptance`
  - `ClassroomMaterialCreate`
  - `ClassroomMaterialBatchCreate`
  - `ClassroomMaterial`
  - `KnowledgeGapStartRequest`

### 2) Classroom invite/material persistence layer
- Added queries in `api/synapse/db/teacher/queries.py`:
  - `create_classroom_invite`
  - `get_invite_by_code`
  - `list_classroom_invites`
  - `list_student_invites`
  - `accept_invite`
  - `create_classroom_material`
  - `list_classroom_materials`

### 3) Teacher APIs
- Extended `api/synapse/routers/teacher/classes.py` with:
  - `POST /teacher/classes/{classroom_id}/invite`
  - `GET /teacher/classes/{classroom_id}/invites`
  - `POST /teacher/classes/{classroom_id}/materials`
  - `GET /teacher/classes/{classroom_id}/materials`

### 4) Student APIs
- Added `api/synapse/routers/student/classroom.py` and mounted in `api/synapse/app.py`:
  - `GET /student/classrooms/invites/{student_id}`
  - `POST /student/classrooms/invites/{invite_code}/accept`
  - `GET /student/classrooms/invites/code/{invite_code}`
  - `POST /student/classrooms/knowledge-gap/start`

### 5) DB schema
- Added migration: `api/synapse/migrations/003_classroom_invites_and_materials.sql`
  - `classroom_invitations`
  - `classroom_materials`

## What remains for this build session
1. Connect frontend to these routes in place of mock paths.
2. Add file upload storage path for materials (S3/R2/Supabase Storage or local staging).
3. Add teacher endpoint for “classroom chat summary + progress notes” if required by MVP.
4. Add acceptance guardrails:
   - verify students exist before invite generation
   - verify enrollments before duplicate invite creation
5. Add API docs/Swagger tags and tests for the new routes.

## Build commands
- Apply migration 003 after 001/002 in local Postgres/Supabase.
- Start backend: `uvicorn synapse.app:app --port 8000 --reload`
- Start frontend: `cd frontend && npm run dev -- -p 3001`

## Notes
- Invitations are student-specific by design to satisfy “specific user id” requirement.
- Materials are currently metadata-first (title + URL + content type). Binary upload transport can be added once frontend file flow is finalized.
