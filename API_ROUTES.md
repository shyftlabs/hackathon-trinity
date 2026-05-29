# Synapse API Routes (Current)

## Student routes
- `POST /student/diagnose/quiz`
- `POST /student/diagnose/evaluate`
- `GET /student/knowledge-map/{student_id}`
- `POST /student/tutor/stream`
- `POST /student/assess/{topic}`
- `POST /student/assess/grade`
- `POST /student/notes/`
- `GET /student/notes/{student_id}`
- `GET /student/classrooms/invites/{student_id}`
- `POST /student/classrooms/invites/{invite_code}/accept`
- `GET /student/classrooms/invites/code/{invite_code}`
- `POST /student/classrooms/knowledge-gap/start`

## Teacher routes
- `POST /teacher/auth/register`
- `GET /teacher/auth/{teacher_id}`
- `GET /teacher/classes/{teacher_id}/all`
- `POST /teacher/classes/`
- `GET /teacher/classes/{classroom_id}`
- `POST /teacher/classes/{classroom_id}/syllabus`
- `POST /teacher/classes/{classroom_id}/enroll`
- `POST /teacher/classes/{classroom_id}/invite`
- `GET /teacher/classes/{classroom_id}/invites`
- `POST /teacher/classes/{classroom_id}/materials`
- `GET /teacher/classes/{classroom_id}/materials`
- `GET /teacher/analytics/{classroom_id}`
- `GET /teacher/reports/{classroom_id}/summary`

## New flow (high level)
1. Teacher creates classroom and uploads syllabus.
2. Teacher creates invite for each registered student via `/teacher/classes/{classroom_id}/invite`.
3. Student queries invite context `GET /student/classrooms/invites/code/{invite_code}`.
4. Student accepts `POST /student/classrooms/invites/{invite_code}/accept`.
5. Student starts gap assessment via `/student/classrooms/knowledge-gap/start`.
6. Existing diagnosis evaluate flow updates knowledge map and teacher analytics consume it.
