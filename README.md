# Hiring Assessment Frontend

Next.js + TypeScript frontend for personal candidate interviews and HR review. Shared API
types are generated from `../hiring-assessment-specs/contracts/openapi.yaml`; the browser
does not score answers or enforce authorization.

## Run locally

1. Install Node.js 20.9 or later.
2. Start the backend API on `http://localhost:8000`, or set
   `NEXT_PUBLIC_API_BASE_URL` to its `/api/v1` base URL.
3. Install dependencies and generate types:

   ```sh
   npm install
   npm run api:types
   ```

4. Start the app:

   ```sh
   npm run dev
   ```

   Open `http://localhost:3000`. Candidate personal links use
   `/candidate/<personal-token>`. The HR demo login is at `/hr/login` and is
   clearly labelled as mocked; it requires the backend's demo login endpoint.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Architecture

- Candidate routes use the personal link token only in memory to make bearer-authenticated
  requests. Interview questions and current progress are loaded from the backend after each
  page load; text submission uses the contract's idempotency header. An audio file may be
  attached to a saved text submission. No candidate page renders grading or HR fields.
- HR login and all HR data operations call the backend; the backend session cookie is
  authoritative. The workspace lists roles, candidates, and scoring jobs, and the answer
  detail route loads a known submission ID. Retry and override operations use their
  contract-defined endpoints.
- `src/lib/api/schema.d.ts` is generated from OpenAPI 1.0.0 and is not hand-maintained.
  There are no production mock services or in-component mock records.

The current contract cannot create audio-only submissions or discover submission IDs and
version histories from the role candidate list. These gaps are recorded in
`AI_CONTEXT/reports/FE-001-contract-change-request.md`; the frontend does not invent the
missing API fields or behavior. The mocked HR login is for local demonstration only and is
not production authentication.

## Context provenance

See `SPECS_VERSION.md` for the shared specs snapshot and its revision limitation.
