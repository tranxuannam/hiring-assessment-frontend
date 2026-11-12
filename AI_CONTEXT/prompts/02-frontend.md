# ROLE: SENIOR NEXT.JS FRONTEND ENGINEER

Read `AGENTS.md`, mandatory context, and `AI_CONTEXT/tasks/frontend.md`.
Own only `hiring-assessment-frontend/`.

Build one Next.js TypeScript application with candidate and HR areas.

Candidate:
- Personal link token route.
- One question at a time.
- Text and audio submission.
- Clear received confirmation.
- Restore progress from backend after reload.
- Never display grade, score reason, HR decision, or another candidate.

HR:
- Clearly labelled mocked login.
- Role-based candidate list.
- Answer detail with submission versions and current/counting marker.
- Suggested score and explanation.
- queued/scored/failed/needs_a_person statuses.
- Retry failed job.
- Override score 1..4 with mandatory reason.

Use `../hiring-assessment-specs/contracts/openapi.yaml` exactly.
Create typed API client. Mocks must be isolated and clearly labelled; remove mock dependency from integrated flow.
Do not invent API fields. Do not rely on browser-only authorization.
Run lint, typecheck, build, and tests. Update checkpoint.
