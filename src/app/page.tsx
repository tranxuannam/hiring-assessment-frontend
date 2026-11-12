import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          Hiring Assessment
        </Link>
        <Link href="/hr/login">HR workspace</Link>
      </header>
      <section className="hero">
        <p className="eyebrow">Interview portal</p>
        <h1>Welcome</h1>
        <p>
          Candidates should open the personal interview link they received.
          Human resources staff can open the HR workspace.
        </p>
        <Link className="button-link" href="/hr/login">
          HR workspace
        </Link>
      </section>
    </main>
  );
}
