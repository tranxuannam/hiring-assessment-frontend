import HrLoginForm from "./hr-login-form";
import Link from "next/link";

export default function HrLoginPage() {
  return (
    <main className="page-shell narrow">
      <header className="site-header">
        <Link className="brand" href="/">Hiring Assessment</Link>
      </header>
      <section className="content-card">
        <p className="eyebrow">HR access</p>
        <h1>Sign in</h1>
        <p className="message warning">
          Mocked demo login. This is not production authentication.
        </p>
        <HrLoginForm />
      </section>
    </main>
  );
}
