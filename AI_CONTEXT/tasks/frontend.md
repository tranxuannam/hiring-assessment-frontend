# Frontend Task

Own `hiring-assessment-frontend/`. Read all mandatory context first.

Build one Next.js TypeScript app with:
- Candidate personal-link interview flow.
- One question at a time.
- Text answer and audio upload.
- Immediate receipt and server-backed progress restore.
- HR demo login clearly labelled mocked.
- Role candidate list.
- Answer detail, version/current indicator, suggested score and reason.
- Job states queued/scored/failed/needs_a_person.
- Retry failed job.
- HR override with mandatory reason.

Use `../hiring-assessment-specs/contracts/openapi.yaml` as the only API contract.
While backend is unfinished, use isolated mock services that exactly match the contract.
Do not put mock data directly into production UI components.
Never display score data in candidate routes.
Do not implement security only in browser.
Run lint/typecheck/build/tests and report actual output.
