import HrAnswerDetailPage from "./hr-answer-detail-page";

export default async function HrAnswerPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const id = Number(submissionId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return (
      <main className="page-shell">
        <section className="content-card">
          <h1>Invalid submission ID</h1>
          <a href="/hr">Return to HR workspace</a>
        </section>
      </main>
    );
  }
  return <HrAnswerDetailPage submissionId={id} />;
}
