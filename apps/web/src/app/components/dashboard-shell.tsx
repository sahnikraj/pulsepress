import type { ReactNode } from "react";

const nav = [
  "/dashboard",
  "/sites",
  "/campaigns",
  "/subscribers",
  "/segments",
  "/automations",
  "/settings"
];

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-slate-400">PulsePress multi-tenant push platform</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs text-slate-300">
          {nav.map((item) => (
            <span key={item} className="rounded-md border border-slate-700 px-2 py-1">
              {item}
            </span>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
