import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CandidateInterviewPage from "./candidate-interview-page";

const api = vi.hoisted(() => ({
  getCandidateInterview: vi.fn(),
  getCandidateProgress: vi.fn(),
  submitCandidateAnswer: vi.fn(),
  uploadCandidateAudio: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  ApiError: class ApiError extends Error {},
  getCandidateInterview: api.getCandidateInterview,
  getCandidateProgress: api.getCandidateProgress,
  submitCandidateAnswer: api.submitCandidateAnswer,
  uploadCandidateAudio: api.uploadCandidateAudio,
}));

describe("candidate interview", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    api.getCandidateInterview.mockResolvedValue({
      candidate: { display_name: "Candidate" },
      questions: [
        {
          id: 5,
          external_id: "Q1",
          position: 1,
          question_text: "<script>not executable</script>",
        },
      ],
      progress: {
        current_question_external_id: "Q1",
        submitted_question_ids: [],
      },
    });
    api.getCandidateProgress.mockResolvedValue({
      current_question_external_id: "Q1",
      submitted_question_ids: [],
    });
    api.submitCandidateAnswer.mockResolvedValue({
      submission_id: 7,
      question_id: "Q1",
      received: true,
      scoring_status: "queued",
      version: 1,
      current: true,
    });
    api.uploadCandidateAudio.mockResolvedValue({});
  });

  it("shows a single backend question as text and confirms receipt without exposing scores", async () => {
    render(<CandidateInterviewPage token="personal-token" />);
    expect(await screen.findByText("<script>not executable</script>")).toBeVisible();
    expect(screen.queryByText(/score|grade|decision/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: "My response" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your answer has been received.",
    );
    await waitFor(() =>
      expect(api.submitCandidateAnswer).toHaveBeenCalledWith(
        "personal-token",
        { question_id: "Q1", answer_text: "My response" },
        expect.any(String),
      ),
    );
  });

  it("reuses the idempotency key when retrying the same answer", async () => {
    api.submitCandidateAnswer.mockRejectedValueOnce(
      new Error("Temporary network failure"),
    );
    render(<CandidateInterviewPage token="personal-token" />);
    await screen.findByText("<script>not executable</script>");
    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: "Retry this response" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Temporary network failure",
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit answer" }));
    expect(await screen.findByText("Your answer has been received.")).toBeVisible();

    const firstKey = api.submitCandidateAnswer.mock.calls[0][2];
    const retryKey = api.submitCandidateAnswer.mock.calls[1][2];
    expect(retryKey).toBe(firstKey);
  });

  it("measures progress by submitted questions, not the current question position", async () => {
    api.getCandidateInterview.mockResolvedValue({
      candidate: { display_name: "Candidate" },
      questions: [
        { id: 5, external_id: "Q1", position: 1, question_text: "First" },
        { id: 6, external_id: "Q2", position: 2, question_text: "Second" },
      ],
      progress: {
        current_question_external_id: "Q2",
        submitted_question_ids: ["Q1"],
      },
    });
    api.getCandidateProgress.mockResolvedValue({
      current_question_external_id: "Q2",
      submitted_question_ids: ["Q1"],
    });

    render(<CandidateInterviewPage token="personal-token" />);

    const progressBar = await screen.findByRole("progressbar", {
      name: "Interview progress",
    });
    expect(progressBar).toHaveAttribute("max", "2");
    expect(progressBar).toHaveAttribute("value", "1");
    expect(screen.getByText("1 of 2 questions answered")).toBeVisible();
    expect(screen.getByText("Question 2 of 2")).toBeVisible();
  });
});
