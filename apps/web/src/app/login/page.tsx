import { DashboardShell } from "../components/dashboard-shell";

export default function LoginPage() {
  return (
    <DashboardShell title="Login">
      <section className="panel max-w-md">
        <h2 className="text-lg font-medium">Sign in</h2>
        <p className="mt-2 text-sm text-slate-400">JWT access + refresh auth flow placeholder</p>
      </section>
    </DashboardShell>
  );
}
