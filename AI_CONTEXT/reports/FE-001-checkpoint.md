# FE-001 checkpoint

- **Task:** Candidate and HR frontend application
- **Agent:** Senior Next.js frontend engineer
- **Branch:** `feature/agent_1_init_project_fe`
- **Contract:** OpenAPI 1.0.0
- **Status:** Frontend implemented and verified against OpenAPI 1.0.0; audio-only submission and HR answer/version discovery remain blocked pending shared-spec changes.

## Completed

- Added a Next.js App Router application with personal-link candidate interview and HR demo areas.
- Candidate progress/questions load from the backend on page load; text retries reuse the original idempotency key and confirm receipt. An audio file can be attached to a saved text submission and retried with its original key.
- Added HR mocked login, role candidate lists, scoring job status/retry, known-submission detail, suggested score/reason, and score override with required reason.
- Added typed API operations and generated `src/lib/api/schema.d.ts` from the shared OpenAPI contract. Production UI uses no mock data/service.
- Added candidate UI coverage for server-provided question rendering, answer submission, receipt confirmation, and absence of HR/score content.
- Candidate progress bar reflects completed questions from backend `submitted_question_ids`, separately from the active question number.
- Documented setup and architecture in `README.md`; recorded the specs provenance in `SPECS_VERSION.md`.

## Files changed

Application source under `src/app/` and `src/lib/api/`; generated OpenAPI types; npm manifest and lockfile; Next.js, TypeScript, ESLint, and Vitest configuration; `.gitignore`; `.env.example`; `README.md`; `SPECS_VERSION.md`; and `AI_CONTEXT/reports/FE-001-contract-change-request.md`.

## Decisions and constraints

- Candidate tokens are sent as bearer credentials only; no local storage, logging, or analytics was added. Candidate UI renders no score, explanation, HR decision, or other candidate data.
- Backend responses remain authoritative for progress, job states, authorization, scoring, and overrides.
- Audio-only submission cannot be built against contract 1.0.0: the required text submission precedes audio upload. The UI supports audio attachment to text and explains the limitation rather than inventing a transcript.
- HR detail can show the version/current marker only for a known submission ID. The candidate list exposes no submission IDs and the detail schema has no version collection; a request is recorded in `FE-001-contract-change-request.md`.
- The shared specs worktree had no Git commit or tag when consumed. The OpenAPI version is recorded; no immutable shared revision could be named.

## Tests and checks

- Verified 2026-11-12:
- `npm run api:types` — passed; generated from `../hiring-assessment-specs/contracts/openapi.yaml` (OpenAPI 1.0.0).
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed; 1 test file, 3 tests, including answered-count progress behavior.
- `npm run build` — passed; production build generated `/`, `/candidate/[token]`, `/hr`, `/hr/answers/[submissionId]`, and `/hr/login`.

No live backend journey was run in this frontend worktree; backend integration remains unverified.

## Blockers / next steps

- Shared specs owners: review and version audio-only submission and HR answer/version discovery capabilities described in the contract-change request.
- Backend: implement the approved contract changes and validate candidate audio, HR answer discovery, and historical versions.
- Frontend: regenerate types and integrate those approved capabilities, then run end-to-end journeys against the live API.

## Dependencies for other agents

Shared specs and backend work are required for audio-only submission and HR answer/version discovery. The current contract-backed app does not depend on frontend mock services.

No shared specs or backend files were changed by this frontend task.
