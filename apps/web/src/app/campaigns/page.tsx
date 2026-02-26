"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "../components/dashboard-shell";
import { api, type Campaign, type Site } from "../../lib/api";

export default function CampaignsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("Breaking News Alert");
  const [title, setTitle] = useState("Major update just published");
  const [body, setBody] = useState("Open now to read the latest story.");
  const [url, setUrl] = useState("https://example.com/latest");
  const [image, setImage] = useState("");
  const [ttl, setTtl] = useState(600);
  const [sendNow, setSendNow] = useState(true);
  const [scheduleAt, setScheduleAt] = useState("");

  const selectedSite = useMemo(() => sites.find((site) => site.id === selectedSiteId) ?? null, [sites, selectedSiteId]);

  async function loadSitesAndCampaigns() {
    setLoading(true);
    setError(null);
    try {
      const siteData = await api.listSites();
      const siteItems = siteData.items ?? [];
      setSites(siteItems);

      let siteId = selectedSiteId || window.localStorage.getItem("pulsepress_selected_site") || siteItems[0]?.id || "";
      if (!siteId) {
        setCampaigns([]);
        return;
      }

      setSelectedSiteId(siteId);
      window.localStorage.setItem("pulsepress_selected_site", siteId);

      const campaignData = await api.listCampaigns(siteId);
      setCampaigns(campaignData.items ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSitesAndCampaigns();
  }, []);

  async function onSiteChange(nextSiteId: string) {
    setSelectedSiteId(nextSiteId);
    window.localStorage.setItem("pulsepress_selected_site", nextSiteId);
    setLoading(true);
    try {
      const data = await api.listCampaigns(nextSiteId);
      setCampaigns(data.items ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateCampaign(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSiteId) {
      setError("Create a site first in /sites");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const campaign = await api.createCampaign(selectedSiteId, {
        name,
        title,
        body,
        url,
        image: image || undefined,
        ttl,
        scheduleAt: sendNow ? null : new Date(scheduleAt).toISOString()
      });

      if (sendNow) {
        await api.sendCampaign(selectedSiteId, campaign.id);
      }

      setSuccess(sendNow ? "Campaign queued for sending." : "Campaign scheduled.");
      const data = await api.listCampaigns(selectedSiteId);
      setCampaigns(data.items ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell title="Campaigns">
      <section className="grid gap-4 xl:grid-cols-5">
        <article className="panel xl:col-span-2">
          <h2 className="text-lg font-semibold">Create Campaign</h2>
          <p className="mt-1 text-sm text-slate-400">Simple flow inspired by Webpushr: define content, send now or schedule.</p>

          <form className="mt-4 space-y-3" onSubmit={onCreateCampaign}>
            <label className="block text-sm">
              Website
              <select
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={selectedSiteId}
                onChange={(event) => onSiteChange(event.target.value)}
                required
              >
                <option value="">Select website</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.domain})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              Campaign Name
              <input className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label className="block text-sm">
              Notification Title
              <input className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>

            <label className="block text-sm">
              Body
              <textarea className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" rows={3} value={body} onChange={(e) => setBody(e.target.value)} required />
            </label>

            <label className="block text-sm">
              Click URL
              <input className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" value={url} onChange={(e) => setUrl(e.target.value)} required />
            </label>

            <label className="block text-sm">
              Image URL (optional)
              <input className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2" value={image} onChange={(e) => setImage(e.target.value)} />
            </label>

            <label className="block text-sm">
              TTL (seconds)
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                type="number"
                min={1}
                max={86400}
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value || 600))}
              />
            </label>

            <div className="rounded border border-slate-700 p-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} />
                Send immediately
              </label>
              {!sendNow ? (
                <label className="mt-2 block text-sm">
                  Schedule Date/Time
                  <input
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    required={!sendNow}
                  />
                </label>
              ) : null}
            </div>

            <button className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white" disabled={submitting}>
              {submitting ? "Processing..." : sendNow ? "Create + Send" : "Create Scheduled Campaign"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
          {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}
        </article>

        <article className="panel xl:col-span-3">
          <h2 className="text-lg font-semibold">Campaign Operations</h2>
          <p className="mt-1 text-sm text-slate-400">Track status and open campaign metrics.</p>

          {!selectedSite ? (
            <p className="mt-4 text-sm text-slate-400">Select a website to view campaigns.</p>
          ) : loading ? (
            <p className="mt-4 text-sm text-slate-400">Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No campaigns yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between rounded border border-slate-700 p-3">
                  <div>
                    <p className="font-medium">{campaign.title}</p>
                    <p className="text-xs text-slate-400">{campaign.status} · {new Date(campaign.created_at).toLocaleString()}</p>
                  </div>
                  <Link
                    href={`/campaigns/${campaign.id}?siteId=${selectedSite.id}`}
                    className="rounded border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800"
                  >
                    View Metrics
                  </Link>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
