# Brain / Memory — Synapse Backend Build

## Why this design
- Product asks for user-specific invitation, therefore classroom codes are generated per student per class.
- Teachers need to upload multiple materials; storing material metadata first keeps this backend independent of storage implementation.
- Student “knowledge gap” has explicit user choice in prompt:
  - manual topics
  - AI-suggested topics
  We implemented this as one kickoff endpoint that returns a diagnostic quiz.

## Assumptions
- User IDs (`student_id`, `teacher_id`) are canonical across platform auth and are already known.
- Invite consumption is one-time: `pending -> accepted` update.
- Invite expiry is enforced at accept time only.
- Syllabus-driven topic suggestions are a practical first iteration; deeper Bayesian/embedding selection can be added later.

## Risks
- No file storage pipeline yet; only material links are persisted.
- `knowledge-gap` AI mode currently prioritizes weak topics from existing knowledge map, then syllabus topics.
- Supabase row-level permissions are not yet defined in SQL migration; access control is currently API-level.

## Open decisions
- Keep class entry URL code as per-invite code or move to classroom-wide sharing code in next pass.
- Add teacher-facing classroom chat summary endpoint backed by tutor interaction history if/when chat logs are persisted.

## Decision log
- Use one additional migration (`003_classroom_invites_and_materials.sql`) rather than altering existing migration history.
- Return lightweight context payloads for invite resolution to support frontend bootstrapping screens.
- Keep model ownership split by route groups while allowing required shared model/schema edits.
