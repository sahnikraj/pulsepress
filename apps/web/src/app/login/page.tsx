"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "../components/dashboard-shell";
import { api } from "../../lib/api";
import { setTokens } from "../../lib/auth";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("My Publisher Account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password, accountName);

      setTokens(data.accessToken, data.refreshToken);
      router.push("/sites");
    } catch (err: any) {
      setError(err.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell title="Login">
      <section className="panel max-w-xl space-y-4">
        <div className="flex gap-2 text-sm">
          <button
            className={`rounded px-3 py-1 ${mode === "login" ? "bg-sky-600 text-white" : "bg-slate-800"}`}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            className={`rounded px-3 py-1 ${mode === "register" ? "bg-sky-600 text-white" : "bg-slate-800"}`}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          {mode === "register" ? (
            <label className="block text-sm">
              Account Name
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                required
              />
            </label>
          ) : null}

          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm">
            Password
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <button className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-xs text-slate-400">
          After login, open <strong>/sites</strong> to add your website and copy install code.
        </p>
      </section>
    </DashboardShell>
  );
}
