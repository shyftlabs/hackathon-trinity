"""
Cohort analytics endpoints.
OWNER: Teacher developer
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from synapse.models import CohortAnalytics, TopicStatus
from synapse.db.teacher.queries import (
    get_student_knowledge_maps_for_class,
    get_student_count,
    save_cohort_snapshot,
)

router = APIRouter(prefix="/teacher/analytics", tags=["teacher-analytics"])


@router.get("/{classroom_id}", response_model=CohortAnalytics)
async def get_cohort_analytics(classroom_id: str) -> CohortAnalytics:
    """
    Aggregate all student knowledge maps for a classroom.
    Returns per-topic average levels and struggling topic list.
    """
    try:
        rows = await get_student_knowledge_maps_for_class(classroom_id)
        total = await get_student_count(classroom_id)

        if not rows:
            return CohortAnalytics(
                classroom_id=classroom_id,
                total_students=total,
                avg_mastery=0.0,
                topic_breakdown=[],
                struggling_topics=[],
            )

        # Aggregate per-topic scores across all students
        topic_scores: dict[str, list[float]] = {}
        for row in rows:
            km_data = row.get("knowledge_maps") or {}
            if isinstance(km_data, list):
                km_data = km_data[0] if km_data else {}
            for ts in km_data.get("topics", []):
                t = ts["topic"]
                score = 1.0 if ts["level"] == "strong" else 0.5 if ts["level"] == "moderate" else 0.0
                topic_scores.setdefault(t, []).append(score)

        all_masteries: list[float] = []
        topic_breakdown: list[TopicStatus] = []
        struggling: list[str] = []

        for topic, scores in topic_scores.items():
            avg = sum(scores) / len(scores)
            all_masteries.append(avg)
            level = "strong" if avg >= 0.75 else "moderate" if avg >= 0.4 else "needs_improvement"
            if level == "needs_improvement":
                struggling.append(topic)
            topic_breakdown.append(TopicStatus(
                topic=topic,
                level=level,
                evidence=f"{len(scores)} students assessed; avg score {avg:.0%}",
            ))

        avg_mastery = sum(all_masteries) / len(all_masteries) if all_masteries else 0.0
        analytics = CohortAnalytics(
            classroom_id=classroom_id,
            total_students=total,
            avg_mastery=round(avg_mastery, 3),
            topic_breakdown=topic_breakdown,
            struggling_topics=struggling,
        )

        # Persist snapshot for historical tracking
        await save_cohort_snapshot(classroom_id, analytics)
        return analytics

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
