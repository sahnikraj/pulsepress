"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "../components/dashboard-shell";
import { api } from "../../lib/api";
import { clearTokens } from "../../lib/auth";

type Site = {
  id: string;
  name: string;
  domain: string;
  created_at: string;
};

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [name, setName] = useState("My News Site");
  const [domain, setDomain] = useState("example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSites() {
    setError(null);
    try {
      const data = await api.listSites();
      setSites(data.items ?? []);
    } catch (err: any) {
      if ((err.message ?? "").toLowerCase().includes("unauthorized")) {
        clearTokens();
        router.push("/login");
        return;
      }
      setError(err.message ?? "Failed to load sites");
    }
  }

  useEffect(() => {
    void loadSites();
  }, []);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createSite({ name, domain });
      await loadSites();
    } catch (err: any) {
      setError(err.message ?? "Failed to create site");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell title="Sites">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel space-y-3">
          <h2 className="text-lg font-medium">Add Website</h2>
          <form className="space-y-3" onSubmit={onCreate}>
            <label className="block text-sm">
              Site Name
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              Domain
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                required
              />
            </label>
            <button className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white" disabled={loading}>
              {loading ? "Creating..." : "Create Site"}
            </button>
          </form>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </article>

        <article className="panel space-y-3">
          <h2 className="text-lg font-medium">Your Websites</h2>
          {sites.length === 0 ? (
            <p className="text-sm text-slate-400">No sites yet. Add one from the left panel.</p>
          ) : (
            <div className="space-y-2">
              {sites.map((site) => (
                <div key={site.id} className="rounded border border-slate-700 p-3">
                  <p className="font-medium">{site.name}</p>
                  <p className="text-xs text-slate-400">{site.domain}</p>
                  <Link href={`/sites/${site.id}`} className="mt-2 inline-block text-sm text-sky-400 hover:underline">
                    Open setup
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
