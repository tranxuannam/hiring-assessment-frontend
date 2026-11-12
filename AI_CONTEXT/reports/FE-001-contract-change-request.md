# Contract change request: frontend integration gaps

**Consumer:** `hiring-assessment-frontend`

**Current contract:** OpenAPI 1.0.0
**Status:** Requested; no shared contract changes made here

The current contract cannot represent two requested UI flows without fabricated data:

1. **Audio-only candidate answers.** `AnswerSubmissionRequest.answer_text` is required and has `minLength: 1`; the audio endpoint requires an existing integer `responseId`. Please define a contract-backed audio-only creation flow (or explicitly permit an empty text answer), including how its scoring status is represented. Audio-only answers must not be sent to scoring as invented transcript text.
2. **HR submission discovery and versions.** `CandidateListResponse` does not expose submission IDs or answer summaries, `HrAnswerDetail` describes only one submission, and there is no response containing all versions for a candidate/question. Please add a role/candidate answer-list capability with submission IDs and a version-history relationship, or document an equivalent existing contract path. The current detail response does expose `version` and `is_current` for one known ID.

Until the shared contract is reviewed and versioned, the frontend only attaches audio to a successfully submitted text answer, displays answer detail when given a submission ID, and does not synthesize missing audio text or version links.
