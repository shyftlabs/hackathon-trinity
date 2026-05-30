"""
Teacher API routers.
━━━━━━━━━━━━━━━━━━
OWNER: Teacher developer
Prefix: /teacher

Endpoints:
  POST   /teacher/auth/register          → register teacher account
  GET    /teacher/{teacher_id}/classes   → list all classrooms
  POST   /teacher/classes                → create a classroom
  GET    /teacher/classes/{id}           → get classroom detail + enrolled students
  POST   /teacher/classes/{id}/syllabus  → upload/update syllabus topics
  POST   /teacher/classes/{id}/enroll    → enroll a student
  GET    /teacher/classes/{id}/analytics → cohort knowledge map analytics
  GET    /teacher/classes/{id}/report    → full progress report (PDF ready)
"""
