import type { components, paths } from "./schema";

export type CandidateInterview =
  components["schemas"]["CandidateInterview"];
export type CandidateProgress = components["schemas"]["CandidateProgress"];
export type AnswerSubmissionRequest =
  components["schemas"]["AnswerSubmissionRequest"];
export type AnswerSubmissionReceipt =
  components["schemas"]["AnswerSubmissionReceipt"];
export type Role = components["schemas"]["Role"];
export type ScoringJob = components["schemas"]["ScoringJob"];
export type HrAnswerDetail = components["schemas"]["HrAnswerDetail"];
export type CandidateListResponse = components["schemas"]["CandidateListResponse"];

type JsonBody<Operation> = Operation extends {
  requestBody: {
    content: { "application/json": infer Body };
  };
}
  ? Body
  : never;

type LoginRequest = JsonBody<paths["/hr/auth/login"]["post"]>;
type ReviewRequest = JsonBody<paths["/hr/answers/{submissionId}/review"]["put"]>;
type ReviewResponse =
  paths["/hr/answers/{submissionId}/review"]["put"]["responses"][200]["content"]["application/json"];
type LoginResponse =
  paths["/hr/auth/login"]["post"]["responses"][200]["content"]["application/json"];
type SessionResponse =
  paths["/hr/auth/session"]["get"]["responses"][200]["content"]["application/json"];
type RolesResponse =
  paths["/hr/roles"]["get"]["responses"][200]["content"]["application/json"];
type JobsResponse =
  paths["/hr/scoring-jobs"]["get"]["responses"][200]["content"]["application/json"];

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {},
  candidateToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (candidateToken) {
    headers.set("Authorization", `Bearer ${candidateToken}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    cache: "no-store",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function getCandidateInterview(
  token: string,
  signal?: AbortSignal,
): Promise<CandidateInterview> {
  return request("/candidate/interview", { signal }, token);
}

export function getCandidateProgress(
  token: string,
  signal?: AbortSignal,
): Promise<CandidateProgress> {
  return request("/candidate/progress", { signal }, token);
}

export function submitCandidateAnswer(
  token: string,
  payload: AnswerSubmissionRequest,
  idempotencyKey: string,
): Promise<AnswerSubmissionReceipt> {
  return request(
    "/candidate/answers",
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function uploadCandidateAudio(
  token: string,
  responseId: number,
  questionId: string,
  file: File,
  idempotencyKey: string,
): Promise<AnswerSubmissionReceipt> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("question_id", questionId);
  return request(
    `/candidate/answers/${responseId}/audio`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: formData,
    },
    token,
  );
}

export function loginHr(
  payload: LoginRequest,
): Promise<LoginResponse> {
  return request("/hr/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getHrSession(signal?: AbortSignal): Promise<SessionResponse> {
  return request("/hr/auth/session", { signal });
}

export function getRoles(signal?: AbortSignal): Promise<RolesResponse> {
  return request("/hr/roles", { signal });
}

export function getRoleCandidates(
  roleId: number,
  page: number,
  signal?: AbortSignal,
): Promise<CandidateListResponse> {
  return request(
    `/hr/roles/${roleId}/candidates?page=${page}&page_size=100`,
    { signal },
  );
}

export function getScoringJobs(
  signal?: AbortSignal,
): Promise<JobsResponse> {
  return request("/hr/scoring-jobs?page=1", { signal });
}

export function getHrAnswerDetail(
  submissionId: number,
  signal?: AbortSignal,
): Promise<HrAnswerDetail> {
  return request(`/hr/answers/${submissionId}`, { signal });
}

export function retryScoringJob(jobId: number): Promise<ScoringJob> {
  return request(`/hr/scoring-jobs/${jobId}/retry`, { method: "POST" });
}

export function overrideSuggestedScore(
  submissionId: number,
  payload: ReviewRequest,
): Promise<ReviewResponse> {
  return request(`/hr/answers/${submissionId}/review`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
