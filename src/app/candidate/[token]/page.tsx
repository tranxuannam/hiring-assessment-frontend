import CandidateInterviewPage from "./candidate-interview-page";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CandidateInterviewPage token={token} />;
}
