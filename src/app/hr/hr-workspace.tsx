"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  CandidateListResponse,
  Role,
  ScoringJob,
  getHrSession,
  getRoleCandidates,
  getRoles,
  getScoringJobs,
  retryScoringJob,
} from "@/lib/api/client";

type Candidate = CandidateListResponse["data"][number];

export default function HrWorkspace() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState<number>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidatePagination, setCandidatePagination] =
    useState<CandidateListResponse["pagination"]>();
  const [jobs, setJobs] = useState<ScoringJob[]>([]);
  const [submissionId, setSubmissionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingJob, setRetryingJob] = useState<number>();

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getHrSession(controller.signal),
      getRoles(controller.signal),
      getScoringJobs(controller.signal),
    ])
      .then(([session, rolesResponse, jobsResponse]) => {
        if (!session.authenticated) {
          router.replace("/hr/login");
          return;
        }
        if (!jobsResponse.data) {
          throw new Error("Scoring jobs response did not include a data array.");
        }
        setRoles(rolesResponse.data);
        setRoleId(rolesResponse.data[0]?.id);
        setJobs(jobsResponse.data);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof ApiError && reason.status === 401) {
          router.replace("/hr/login");
        } else {
          setError(errorMessage(reason));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (roleId === undefined) return;
    const controller = new AbortController();
    getRoleCandidates(roleId, candidatePage, controller.signal)
      .then((response) => {
        setCandidates(response.data);
        setCandidatePagination(response.pagination);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason));
      });
    return () => controller.abort();
  }, [candidatePage, roleId]);

  async function handleRetry(jobId: number) {
    setRetryingJob(jobId);
    setError("");
    try {
      await retryScoringJob(jobId);
      const response = await getScoringJobs();
      if (!response.data) {
        throw new Error("Scoring jobs response did not include a data array.");
      }
      setJobs(response.data);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setRetryingJob(undefined);
    }
  }

  function openAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(submissionId);
    if (!Number.isInteger(id) || id < 1) {
      setError("Enter a valid submission ID.");
      return;
    }
    router.push(`/hr/answers/${id}`);
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/">Hiring Assessment</Link>
        <span className="badge">Mocked HR authentication</span>
      </header>
      <section className="content-card">
        <p className="eyebrow">HR workspace</p>
        <h1>Assessment review</h1>
        {loading && <p role="status">Loading HR workspace…</p>}
        {error && <p className="message error" role="alert">{error}</p>}

        {!loading && (
          <>
            <section aria-labelledby="role-title" className="section">
              <h2 id="role-title">Candidates by role</h2>
              {roles.length === 0 ? (
                <p>No roles are available.</p>
              ) : (
                <>
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    onChange={(event) => {
                      setRoleId(Number(event.target.value));
                      setCandidatePage(1);
                    }}
                    value={roleId}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {candidates.length === 0 ? (
                    <p>No candidates are listed for this role.</p>
                  ) : (
                    <>
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th scope="col">Candidate</th>
                              <th scope="col">Answers</th>
                              <th scope="col">Scored</th>
                              <th scope="col">Failed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {candidates.map((candidate) => (
                              <tr key={candidate.candidate_id}>
                                <th scope="row">{candidate.name}</th>
                                <td>{candidate.answer_count}</td>
                                <td>{candidate.scored_count ?? "—"}</td>
                                <td>{candidate.failed_count ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="inline-form pagination">
                        <button
                          disabled={candidatePage <= 1}
                          onClick={() => setCandidatePage((page) => page - 1)}
                          type="button"
                        >
                          Previous page
                        </button>
                        <span aria-live="polite">
                          Page {candidatePagination?.page ?? candidatePage}
                          {candidatePagination?.total !== undefined &&
                            candidatePagination.page_size !== undefined &&
                            ` of ${Math.max(1, Math.ceil(candidatePagination.total / candidatePagination.page_size))}`}
                        </span>
                        <button
                          disabled={
                            candidatePagination?.total === undefined ||
                            candidatePagination.page_size === undefined ||
                            candidatePage * candidatePagination.page_size >=
                              candidatePagination.total
                          }
                          onClick={() => setCandidatePage((page) => page + 1)}
                          type="button"
                        >
                          Next page
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </section>

            <section aria-labelledby="jobs-title" className="section">
              <h2 id="jobs-title">Scoring jobs</h2>
              {jobs.length === 0 ? (
                <p>No scoring jobs are available.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Job</th>
                        <th scope="col">Status</th>
                        <th scope="col">Attempts</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <th scope="row">{job.id}</th>
                          <td><span className={`status status-${job.status}`}>{job.status}</span></td>
                          <td>{job.attempt_count}</td>
                          <td>
                            {job.status === "failed" && job.can_retry ? (
                              <button
                                disabled={retryingJob === job.id}
                                onClick={() => handleRetry(job.id)}
                                type="button"
                              >
                                {retryingJob === job.id ? "Retrying…" : "Retry"}
                              </button>
                            ) : "—"}
                            {job.status === "failed" && job.error_message && (
                              <p className="help-text">{job.error_message}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section aria-labelledby="answer-title" className="section">
              <h2 id="answer-title">Open an answer</h2>
              <p>
                The current API does not include submission IDs in the
                candidate list. Enter a submission ID supplied by the backend
                to load its answer detail.
              </p>
              <form className="inline-form" onSubmit={openAnswer}>
                <label htmlFor="submission-id">Submission ID</label>
                <input
                  id="submission-id"
                  min="1"
                  onChange={(event) => setSubmissionId(event.target.value)}
                  required
                  type="number"
                  value={submissionId}
                />
                <button type="submit">Open answer detail</button>
              </form>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function errorMessage(reason: unknown): string {
  return reason instanceof ApiError
    ? reason.message
    : reason instanceof Error
      ? reason.message
      : "The request could not be completed. Please try again.";
}
