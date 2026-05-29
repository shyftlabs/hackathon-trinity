"""Knowledge map retrieval endpoint."""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from synapse.agents.lifecycle import get_synapse_app
from synapse.models import KnowledgeMap

router = APIRouter(prefix="/knowledge-map", tags=["knowledge-map"])


@router.get("/{student_id}", response_model=KnowledgeMap | None)
async def get_knowledge_map(student_id: str):
    """
    Retrieve the stored KnowledgeMap for a student from USER-scope memory.
    Returns null if not yet diagnosed.
    """
    app = get_synapse_app()
    try:
        memory_client = app.container.memory_client
        if not memory_client or not memory_client.is_enabled:
            raise HTTPException(status_code=503, detail="Memory service unavailable")

        results = await memory_client.search(
            query=f"knowledge map for student {student_id}",
            user_id=student_id,
            limit=5,
        )
        if not results:
            return None

        # Try to reconstruct KnowledgeMap from the most recent memory fact
        for result in results:
            text = result.get("memory", "") if isinstance(result, dict) else str(result)
            if "knowledge map" in text.lower() or "topics" in text.lower():
                try:
                    # Memories are stored as natural language; we return the latest diagnostic
                    # result stored directly (the grader/evaluator stores the full JSON)
                    data = json.loads(text)
                    return KnowledgeMap(**data)
                except Exception:
                    continue
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
