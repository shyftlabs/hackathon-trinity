"""Tutor streaming endpoint (SSE)."""

from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from synapse.agents.lifecycle import get_synapse_app
from synapse.agents.tutor import stream_tutor
from synapse.models import TutorStreamRequest

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/stream")
async def tutor_stream(request: TutorStreamRequest) -> StreamingResponse:
    """
    Stream a tutor response as Server-Sent Events.

    Event types:
      data: {"type": "content", "content": "..."}
      data: {"type": "check", "data": {"question": "...", "hint": "...", "expected_insight": "..."}}
      data: {"type": "tool", "tool_name": "...", "status": "start"|"end"}
      data: {"type": "done"}
      data: {"type": "error", "error": "..."}
    """
    app = get_synapse_app()

    async def event_generator():
        yield f"data: {json.dumps({'type': 'start', 'topic': request.topic})}\n\n"
        async for event in stream_tutor(
            app=app,
            student_id=request.student_id,
            topic=request.topic,
            message=request.message,
            profile=request.profile,
        ):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
