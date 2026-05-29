"""
Knowledge Map endpoints — student route.
OWNER: Student developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import KnowledgeMap
from synapse.db.student.queries import load_knowledge_map

router = APIRouter(prefix="/student/knowledge-map", tags=["student-knowledge-map"])


@router.get("/{student_id}", response_model=KnowledgeMap | None)
async def get_knowledge_map(student_id: str):
    try:
        return await load_knowledge_map(student_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
