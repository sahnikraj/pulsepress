"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "../../components/dashboard-shell";
import { api, type Site } from "../../../lib/api";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const campaignId = params.id;

  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>(searchParams.get("siteId") ?? "");
  const [metrics, setMetrics] = useState<{
    targeted: number;
    sent: number;
    delivered: number;
    failed: number;
    shown: number;
    clicks: number;
    ctr: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSite = useMemo(() => sites.find((site) => site.id === siteId) ?? null, [sites, siteId]);

  useEffect(() => {
    async function load() {
      try {
        const siteData = await api.listSites();
        const siteItems = siteData.items ?? [];
        setSites(siteItems);

        const resolvedSiteId = siteId || siteItems[0]?.id;
        if (!resolvedSiteId) return;

        setSiteId(resolvedSiteId);
        const metricsData = await api.getCampaignMetrics(resolvedSiteId, campaignId);
        setMetrics(metricsData);
      } catch (err: any) {
        setError(err.message ?? "Failed to load metrics");
      }
    }

    void load();
  }, [campaignId]);

  async function refreshMetrics(nextSiteId: string) {
    try {
      setSiteId(nextSiteId);
      const metricsData = await api.getCampaignMetrics(nextSiteId, campaignId);
      setMetrics(metricsData);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load metrics");
    }
  }

  return (
    <DashboardShell title="Campaign Metrics">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Campaign ID</p>
            <p className="font-mono text-xs text-slate-300">{campaignId}</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <select
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              value={siteId}
              onChange={(event) => refreshMetrics(event.target.value)}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <Link href="/campaigns" className="rounded border border-slate-700 px-3 py-2 hover:bg-slate-800">
              Back to Campaigns
            </Link>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      {!metrics ? (
        <section className="panel">Loading metrics...</section>
      ) : (
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {[
            ["Targeted", metrics.targeted],
            ["Sent", metrics.sent],
            ["Delivered", metrics.delivered],
            ["Failed", metrics.failed],
            ["Shown", metrics.shown],
            ["Clicks", metrics.clicks],
            ["CTR", `${(metrics.ctr * 100).toFixed(2)}%`]
          ].map(([label, value]) => (
            <article key={label} className="panel">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </article>
          ))}

          <article className="panel md:col-span-3 xl:col-span-1">
            <p className="text-xs text-slate-400">Site</p>
            <p className="mt-2 text-sm font-medium">{selectedSite?.name ?? "Unknown"}</p>
            <p className="text-xs text-slate-400">{selectedSite?.domain ?? ""}</p>
          </article>
        </section>
      )}
    </DashboardShell>
  );
}
