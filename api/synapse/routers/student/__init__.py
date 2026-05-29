"""
Student API routers.
━━━━━━━━━━━━━━━━━━
OWNER: Student developer
Prefix: /student

Endpoints:
  POST /student/diagnose/quiz       → generate diagnostic quiz
  POST /student/diagnose/evaluate   → evaluate answers → KnowledgeMap
  GET  /student/knowledge-map/{id}  → fetch stored KnowledgeMap
  POST /student/tutor/stream        → SSE tutor chat
  POST /student/assess/{topic}      → generate assessment
  POST /student/assess/grade        → grade submission
  POST /student/notes               → generate smart notes
  GET  /student/notes/{student_id}  → list saved notes
  GET  /student/memory/{id}         → list memories
  DELETE /student/memory/{id}       → GDPR erasure
"""
