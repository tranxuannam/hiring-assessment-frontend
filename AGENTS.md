# Frontend Agent Instructions

You own this repository only. Shared product/architecture/business context is in the sibling
`../hiring-assessment-specs` repository. Read its relevant documents before coding.

## Required reading
- `../hiring-assessment-specs/requirements/product-requirements.md`
- `../hiring-assessment-specs/business-rules/scoring-and-submission-rules.md`
- `../hiring-assessment-specs/architecture/security.md`
- `../hiring-assessment-specs/contracts/openapi.yaml`
- `../hiring-assessment-specs/integration/frontend-backend.md`

## Scope
Implement Next.js/TypeScript candidate and HR experiences, API client, client-side validation,
loading/error states, accessibility and UI tests.

## Non-negotiable rules
- Do not invent endpoints, response fields, scoring rules or permissions.
- Generate TypeScript API types from the shared OpenAPI contract.
- Do not implement authoritative scoring or authorization in the browser.
- Candidate views must never display scores, HR notes, reference scores or other candidates.
- Treat candidate answer content as untrusted text.
- Do not store candidate access tokens in logs or analytics.
- Keep UI states aligned with backend job states: `queued`, `scored`, `failed`, `needs_a_person`.
- HR override requires a reason and must call the backend API; frontend is not the source of truth.

## Change discipline
If the UI requires a missing API capability, raise a contract-change request. Do not mock a
production endpoint and silently assume it exists. Record the specs tag/commit consumed.
