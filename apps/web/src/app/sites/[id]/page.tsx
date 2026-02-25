"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "../../components/dashboard-shell";
import { api } from "../../../lib/api";
import { clearTokens } from "../../../lib/auth";
import { API_BASE_URL } from "../../../lib/config";

type Site = {
  id: string;
  name: string;
  domain: string;
  vapid_public_key: string;
};

function buildHeaderScript(site: Site, prePromptTitle: string, buttonLabel: string) {
  return `<script>
(function() {
  const siteId = "${site.id}";
  const apiBase = "${API_BASE_URL}";
  const vapidPublicKey = "${site.vapid_public_key}";

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  async function subscribeUser() {
    const registration = await navigator.serviceWorker.register('/pulsepress-sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    const sub = subscription.toJSON();
    await fetch(apiBase + '/public/' + siteId + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.keys,
        browser: /firefox/i.test(navigator.userAgent) ? 'firefox' : /edg/i.test(navigator.userAgent) ? 'edge' : /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent) ? 'safari' : 'chrome',
        deviceType: /mobile|android|iphone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
  }

  function addPromptButton() {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.bottom = '20px';
    wrapper.style.right = '20px';
    wrapper.style.zIndex = '99999';
    wrapper.style.background = '#0f172a';
    wrapper.style.color = '#fff';
    wrapper.style.padding = '12px';
    wrapper.style.borderRadius = '8px';
    wrapper.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';

    const title = document.createElement('div');
    title.textContent = '${prePromptTitle.replace(/'/g, "\\'")}';
    title.style.marginBottom = '8px';

    const btn = document.createElement('button');
    btn.textContent = '${buttonLabel.replace(/'/g, "\\'")}';
    btn.style.background = '#0ea5e9';
    btn.style.border = '0';
    btn.style.color = '#fff';
    btn.style.padding = '8px 10px';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.onclick = function() { subscribeUser().catch(console.error); };

    wrapper.appendChild(title);
    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);
  }

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', addPromptButton);
  }
})();
</script>`;
}

const serviceWorkerTemplate = `self.addEventListener('push', function (event) {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || 'New update';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      icon: payload.icon,
      image: payload.image,
      data: {
        url: payload.url,
        campaignId: payload.campaignId
      }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});`;

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const siteId = params.id;

  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prePromptTitle, setPrePromptTitle] = useState("Get breaking updates in real-time");
  const [buttonLabel, setButtonLabel] = useState("Enable Notifications");

  useEffect(() => {
    async function loadSite() {
      try {
        const data = await api.getSite(siteId);
        setSite(data);
      } catch (err: any) {
        if ((err.message ?? "").toLowerCase().includes("unauthorized")) {
          clearTokens();
          router.push("/login");
          return;
        }
        setError(err.message ?? "Failed to load site");
      }
    }

    if (siteId) {
      void loadSite();
    }
  }, [siteId]);

  const headerScript = useMemo(() => {
    if (!site) return "";
    return buildHeaderScript(site, prePromptTitle, buttonLabel);
  }, [site, prePromptTitle, buttonLabel]);

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    alert("Copied");
  }

  return (
    <DashboardShell title="Site Setup">
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      {!site ? (
        <section className="panel">Loading site configuration...</section>
      ) : (
        <section className="space-y-4">
          <article className="panel">
            <h2 className="text-lg font-medium">Website</h2>
            <p className="text-sm text-slate-300">{site.name}</p>
            <p className="text-xs text-slate-400">{site.domain}</p>
          </article>

          <article className="panel space-y-3">
            <h2 className="text-lg font-medium">Prompt Configuration</h2>
            <p className="text-sm text-slate-400">
              Configure the pre-prompt text and button users see before browser permission appears.
            </p>
            <label className="block text-sm">
              Prompt title
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={prePromptTitle}
                onChange={(event) => setPrePromptTitle(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              Button label
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                value={buttonLabel}
                onChange={(event) => setButtonLabel(event.target.value)}
              />
            </label>
          </article>

          <article className="panel space-y-2">
            <h2 className="text-lg font-medium">Step 1: Add header code to your website</h2>
            <p className="text-sm text-slate-400">Paste this before closing <code>&lt;/body&gt;</code>.</p>
            <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-200">{headerScript}</pre>
            <button
              className="rounded bg-sky-600 px-3 py-2 text-xs font-medium text-white"
              onClick={() => copyText(headerScript)}
            >
              Copy Header Code
            </button>
          </article>

          <article className="panel space-y-2">
            <h2 className="text-lg font-medium">Step 2: Create service worker file</h2>
            <p className="text-sm text-slate-400">
              Create <code>/pulsepress-sw.js</code> in your website root with this content.
            </p>
            <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-200">{serviceWorkerTemplate}</pre>
            <button
              className="rounded bg-sky-600 px-3 py-2 text-xs font-medium text-white"
              onClick={() => copyText(serviceWorkerTemplate)}
            >
              Copy Service Worker File
            </button>
          </article>
        </section>
      )}
    </DashboardShell>
  );
}
