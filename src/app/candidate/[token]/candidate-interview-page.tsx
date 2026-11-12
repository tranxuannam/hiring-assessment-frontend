"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnswerSubmissionReceipt,
  CandidateInterview,
  CandidateProgress,
  getCandidateInterview,
  getCandidateProgress,
  submitCandidateAnswer,
  uploadCandidateAudio,
} from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";

type Props = { token: string };
type PendingAudioUpload = {
  submissionId: number;
  questionId: string;
  file: File;
  idempotencyKey: string;
};

export default function CandidateInterviewPage({ token }: Props) {
  const [interview, setInterview] = useState<CandidateInterview>();
  const [progress, setProgress] = useState<CandidateProgress>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [audioFile, setAudioFile] = useState<File>();
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<AnswerSubmissionReceipt>();
  const [audioError, setAudioError] = useState("");
  const [pendingAudioUpload, setPendingAudioUpload] =
    useState<PendingAudioUpload>();
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pendingAnswer = useRef<{
    payload: { question_id: string; answer_text: string };
    idempotencyKey: string;
  } | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    Promise.all([
      getCandidateInterview(token, controller.signal),
      getCandidateProgress(token, controller.signal),
    ])
      .then(([interviewResult, progressResult]) => {
        setInterview(interviewResult);
        setProgress(progressResult);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(reason));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token]);

  const currentQuestion = useMemo(
    () =>
      interview?.questions.find(
        (question) =>
          question.external_id === progress?.current_question_external_id,
      ),
    [interview, progress],
  );
  const totalQuestions = interview?.questions.length ?? 0;
  const submittedQuestionIds = new Set(progress?.submitted_question_ids ?? []);
  const answeredQuestions =
    interview?.questions.filter((question) =>
      submittedQuestionIds.has(question.external_id),
    ).length ?? 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentQuestion || !answer.trim()) {
      setError("Enter a text answer before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setAudioError("");
    setReceipt(undefined);

    try {
      const payload = {
        question_id: currentQuestion.external_id,
        answer_text: answer.trim(),
      };
      const previousAttempt = pendingAnswer.current;
      const idempotencyKey =
        previousAttempt?.payload.question_id === payload.question_id &&
        previousAttempt.payload.answer_text === payload.answer_text
          ? previousAttempt.idempotencyKey
          : crypto.randomUUID();
      pendingAnswer.current = { payload, idempotencyKey };

      const saved = await submitCandidateAnswer(token, payload, idempotencyKey);
      pendingAnswer.current = undefined;
      setReceipt(saved);
      setAnswer("");

      if (audioFile) {
        const upload: PendingAudioUpload = {
          submissionId: saved.submission_id,
          questionId: currentQuestion.external_id,
          file: audioFile,
          idempotencyKey: crypto.randomUUID(),
        };
        setPendingAudioUpload(upload);
        setAudioFile(undefined);
        if (audioInputRef.current) audioInputRef.current.value = "";
        await sendAudio(upload);
      }

      setProgress(await getCandidateProgress(token));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendAudio(upload: PendingAudioUpload) {
    setUploadingAudio(true);
    setAudioError("");
    try {
      await uploadCandidateAudio(
        token,
        upload.submissionId,
        upload.questionId,
        upload.file,
        upload.idempotencyKey,
      );
      setPendingAudioUpload(undefined);
    } catch (reason) {
      setAudioError(
        `Your text answer was received, but the audio upload failed: ${errorMessage(reason)}`,
      );
    } finally {
      setUploadingAudio(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          Hiring Assessment
        </Link>
        <span>Candidate interview</span>
      </header>
      <section className="content-card">
        <p className="eyebrow">Personal interview</p>
        <h1>{interview ? `Hello, ${interview.candidate.display_name}` : "Interview"}</h1>
        {loading && <p role="status">Loading your interview…</p>}
        {error && <p className="message error" role="alert">{error}</p>}
        {receipt?.received && (
          <p className="message success" role="status">
            Your answer has been received.
          </p>
        )}
        {audioError && <p className="message error" role="alert">{audioError}</p>}
        {interview && progress && totalQuestions > 0 && (
          <div className="interview-progress">
            <label htmlFor="interview-progress">
              {answeredQuestions} of {totalQuestions} questions answered
            </label>
            <progress
              aria-label="Interview progress"
              className="interview-progress-bar"
              id="interview-progress"
              max={totalQuestions}
              value={answeredQuestions}
            />
          </div>
        )}
        {pendingAudioUpload && (
          <button
            disabled={uploadingAudio}
            onClick={() => void sendAudio(pendingAudioUpload)}
            type="button"
          >
            {uploadingAudio ? "Uploading audio…" : "Retry audio upload"}
          </button>
        )}

        {!loading && !error && !currentQuestion && (
          <p role="status">You have completed all available questions.</p>
        )}

        {currentQuestion && (
          <>
            <p className="progress">
              Question {currentQuestion.position} of {totalQuestions}
            </p>
            <h2>{currentQuestion.question_text}</h2>
            <form className="stack" onSubmit={handleSubmit}>
              <label htmlFor="answer">Your answer</label>
              <textarea
                id="answer"
                maxLength={20000}
                onChange={(event) => setAnswer(event.target.value)}
                required
                rows={8}
                value={answer}
              />
              <label htmlFor="audio">Attach an audio recording (optional)</label>
              <input
                accept="audio/*"
                id="audio"
                onChange={(event) => setAudioFile(event.target.files?.[0])}
                ref={audioInputRef}
                type="file"
              />
              <p className="help-text">
                The current API accepts audio as an attachment to a saved text
                answer. Audio-only submission is not available in this contract.
              </p>
              <button disabled={submitting} type="submit">
                {submitting ? "Sending…" : "Submit answer"}
              </button>
            </form>
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
