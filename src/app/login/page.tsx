"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "login"
          ? { action: "login", email, password }
          : { action: "register", email, password, name }
      ),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.push(data.user?.role === "admin" ? "/admin" : "/account");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="page-title mb-2 text-[2.5rem]">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Faster checkout and order history.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <label className="block text-sm">
            <span className="mb-1.5 block">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--line)] px-3 py-3 outline-none focus:border-ink"
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1.5 block">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[var(--line)] px-3 py-3 outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--line)] px-3 py-3 outline-none focus:border-ink"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="btn-dark w-full" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <p className="text-sm mt-6 text-[var(--muted)]">
        {mode === "login" ? (
          <>
            New here?{" "}
            <button
              type="button"
              className="underline text-ink"
              onClick={() => setMode("register")}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="underline text-ink"
              onClick={() => setMode("login")}
            >
              Log in
            </button>
          </>
        )}
      </p>

      <div className="mt-10 text-xs text-[var(--muted)] border border-[var(--line)] p-4 space-y-1">
        <p className="font-semibold text-ink">Demo accounts</p>
        <p>Admin: admin@culturecloset.com / culture123</p>
        <p>Customer: demo@culturecloset.com / culture123</p>
        <p className="pt-2">
          <Link href="/admin" className="underline">
            Admin inventory
          </Link>{" "}
          ·{" "}
          <Link href="/admin/pos" className="underline">
            In-person Apple Pay POS
          </Link>
        </p>
      </div>
    </div>
  );
}
