"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const raw = await response.text();
      let payload: { error?: string } = {};
      if (raw) {
        try {
          payload = JSON.parse(raw) as { error?: string };
        } catch {
          payload = {};
        }
      }
      if (!response.ok) {
        setError(payload.error ?? "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Server is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <header className="card-surface flex items-center justify-center rounded-2xl p-4 shadow-sm">
          <Image src="/SRYN.png" alt="SRYN Areca logo" width={70} height={70} className="h-14 w-14 rounded-md" />
        </header>
        <form
          onSubmit={onSubmit}
          className="card-surface rounded-2xl p-6 shadow-sm"
        >
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-orange-700">Use phone number or email.</p>
          <div className="mt-5 space-y-3">
            <input
              required
              placeholder="Phone or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          <button
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <footer className="card-surface rounded-2xl px-4 py-2 text-center text-xs text-orange-700 shadow-sm">
          Authorized access only.
        </footer>
        </div>
    </div>
  );
}
