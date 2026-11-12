"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  HrAnswerDetail,
  getHrAnswerDetail,
  overrideSuggestedScore,
  retryScoringJob,
} from "@/lib/api/client";

export default function HrAnswerDetailPage({
  submissionId,
}: {
  submissionId: number;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<HrAnswerDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [score, setScore] = useState("3");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getHrAnswerDetail(submissionId, controller.signal)
      .then(setDetail)
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) {
          router.replace("/hr/login");
        } else {
          setError(errorMessage(failure));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [router, submissionId]);

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const finalScore = Number(score);
    const trimmedReason = reason.trim();
    if (!Number.isInteger(finalScore) || finalScore < 1 || finalScore > 4) {
      setError("Score must be an integer from 1 to 4.");
      return;
    }
    if (!trimmedReason) {
      setError("A reason is required for an override.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await overrideSuggestedScore(submissionId, {
        final_score: finalScore,
        reason: trimmedReason,
      });
      setDetail(await getHrAnswerDetail(submissionId));
      setReason("");
      setNotice("HR score and reason were saved.");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  async function handleRetry() {
    if (!detail?.scoring_job) return;
    setSaving(true);
    setError("");
    try {
      const job = await retryScoringJob(detail.scoring_job.id);
      setDetail({ ...detail, scoring_job: job });
      setNotice("Scoring retry was queued.");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/hr">HR workspace</Link>
        <span className="badge">Mocked HR authentication</span>
      </header>
      <section className="content-card">
        <p className="eyebrow">Answer detail</p>
        <h1>Submission {submissionId}</h1>
        {loading && <p role="status">Loading answer…</p>}
        {error && <p className="message error" role="alert">{error}</p>}
        {notice && <p className="message success" role="status">{notice}</p>}
        {detail && (
          <>
            <dl className="detail-grid">
              <dt>Candidate</dt>
              <dd>{detail.candidate?.name ?? detail.candidate?.external_id ?? "Not provided"}</dd>
              <dt>Role</dt>
              <dd>{detail.candidate?.role ?? "Not provided"}</dd>
              <dt>Question</dt>
              <dd>{detail.question?.external_id ?? "Not provided"}</dd>
              <dt>Question text</dt>
              <dd>{detail.question?.question_text ?? "Not provided"}</dd>
              <dt>Grading guide</dt>
              <dd>{detail.question?.grading_guide ?? "Not provided"}</dd>
              <dt>Submitted</dt>
              <dd>{detail.submitted_at}</dd>
              <dt>Version</dt>
              <dd>{detail.version ?? "Not provided"}</dd>
              <dt>Current / counting</dt>
              <dd>{detail.is_current ? "Current and counting" : "Superseded; not current"}</dd>
              <dt>Scoring job</dt>
              <dd>
                {detail.scoring_job ? (
                  <>
                    <span className={`status status-${detail.scoring_job.status}`}>
                      {detail.scoring_job.status}
                    </span>
                    {detail.scoring_job.status === "failed" &&
                      detail.scoring_job.can_retry && (
                        <button
                          className="inline-action"
                          disabled={saving}
                          onClick={handleRetry}
                          type="button"
                        >
                          Retry failed job
                        </button>
                      )}
                    {detail.scoring_job.status === "failed" &&
                      detail.scoring_job.error_message && (
                        <span className="help-text">{detail.scoring_job.error_message}</span>
                      )}
                  </>
                ) : "No scoring job"}
              </dd>
              <dt>Suggested score</dt>
              <dd>{detail.suggested_score ?? "Not available"}</dd>
              <dt>Suggested score explanation</dt>
              <dd>{detail.reason ?? "Not available"}</dd>
              <dt>HR final score</dt>
              <dd>{detail.hr_final_score ?? "Not set"}</dd>
              <dt>HR override reason</dt>
              <dd>{detail.hr_override_reason ?? "Not set"}</dd>
              <dt>Audio</dt>
              <dd>{detail.audio_available ? "Audio received" : "No audio attached"}</dd>
            </dl>

            <section className="section">
              <h2>Answer</h2>
              {detail.answer_text ? (
                <p className="answer-text">{detail.answer_text}</p>
              ) : (
                <p>No text answer was provided.</p>
              )}
            </section>

            <section className="section">
              <h2>Override suggested score</h2>
              <form className="stack" onSubmit={handleReview}>
                <label htmlFor="final-score">Final score (1–4)</label>
                <select
                  id="final-score"
                  onChange={(event) => setScore(event.target.value)}
                  value={score}
                >
                  {[1, 2, 3, 4].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <label htmlFor="override-reason">Reason (required)</label>
                <textarea
                  id="override-reason"
                  maxLength={2000}
                  onChange={(event) => setReason(event.target.value)}
                  required
                  rows={4}
                  value={reason}
                />
                <button disabled={saving} type="submit">
                  {saving ? "Saving…" : "Save HR override"}
                </button>
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
