"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/dashboard-shell";
import { api, type Site } from "../../lib/api";

function StepCard({ title, done, description, href }: { title: string; done: boolean; description: string; href: string }) {
  return (
    <article className="panel flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-100">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      <Link
        href={href}
        className={`rounded px-3 py-2 text-xs font-medium ${done ? "bg-emerald-600/20 text-emerald-300" : "bg-sky-600 text-white"}`}
      >
        {done ? "Done" : "Open"}
      </Link>
    </article>
  );
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.listSites();
        setSites(data.items ?? []);
      } catch (err: any) {
        setError(err.message ?? "Failed to load");
      }
    }

    void load();
  }, []);

  const siteCount = sites.length;
  const selectedSiteId = typeof window !== "undefined" ? window.localStorage.getItem("pulsepress_selected_site") : null;

  const onboardingSteps = useMemo(
    () => [
      {
        title: "Create your first website",
        done: siteCount > 0,
        description: "Add domain + generate secure push credentials.",
        href: "/sites"
      },
      {
        title: "Install website code",
        done: Boolean(selectedSiteId),
        description: "Copy header snippet and service worker file.",
        href: siteCount > 0 ? `/sites/${sites[0].id}` : "/sites"
      },
      {
        title: "Launch first campaign",
        done: false,
        description: "Create and send a manual push notification.",
        href: "/campaigns"
      }
    ],
    [siteCount, selectedSiteId, sites]
  );

  return (
    <DashboardShell title="Dashboard">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel">
          <p className="text-xs text-slate-400">Websites</p>
          <p className="mt-2 text-2xl font-semibold">{siteCount}</p>
        </article>
        <article className="panel">
          <p className="text-xs text-slate-400">Campaign Engine</p>
          <p className="mt-2 text-2xl font-semibold">Ready</p>
        </article>
        <article className="panel">
          <p className="text-xs text-slate-400">Push Delivery</p>
          <p className="mt-2 text-2xl font-semibold">Live</p>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Onboarding Checklist</h2>
        {onboardingSteps.map((step) => (
          <StepCard key={step.title} {...step} />
        ))}
      </section>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <section className="panel">
        <h2 className="text-lg font-semibold">What You Can Do Today</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-300">
          <li>Create sites and generate install setup.</li>
          <li>Capture browser subscribers.</li>
          <li>Create and send manual campaigns from Campaigns page.</li>
        </ul>
      </section>
    </DashboardShell>
  );
}
