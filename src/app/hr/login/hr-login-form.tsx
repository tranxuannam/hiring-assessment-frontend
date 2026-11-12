"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, loginHr } from "@/lib/api/client";

export default function HrLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await loginHr({ username, password });
      if (result.authenticated && result.mode === "mocked") {
        router.push("/hr");
      } else {
        setError("The demo service did not establish a session.");
      }
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : reason instanceof Error
            ? reason.message
            : "Sign-in failed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label htmlFor="username">Username</label>
      <input
        autoComplete="username"
        id="username"
        onChange={(event) => setUsername(event.target.value)}
        required
        value={username}
      />
      <label htmlFor="password">Password</label>
      <input
        autoComplete="current-password"
        id="password"
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      {error && <p className="message error" role="alert">{error}</p>}
      <button disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in to mocked demo"}
      </button>
    </form>
  );
}
