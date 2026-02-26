import { API_BASE_URL } from "./config";
import { getAccessToken } from "./auth";

async function request(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message ?? `Request failed (${response.status})`);
  }

  return response.json();
}

export type Site = {
  id: string;
  name: string;
  domain: string;
  created_at: string;
  vapid_public_key?: string;
};

export type Campaign = {
  id: string;
  name: string;
  title: string;
  status: string;
  created_at: string;
  scheduled_at?: string | null;
};

export const api = {
  register: (email: string, password: string, accountName: string) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, accountName })
    }),

  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  me: () => request("/auth/me"),

  listSites: (): Promise<{ items: Site[] }> => request("/sites"),

  createSite: (payload: { name: string; domain: string; defaultIcon?: string; defaultTtl?: number }) =>
    request("/sites", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  getSite: (siteId: string): Promise<Site> => request(`/sites/${siteId}`),

  listCampaigns: (siteId: string, cursor?: string): Promise<{ items: Campaign[]; nextCursor?: string | null }> =>
    request(`/sites/${siteId}/campaigns${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),

  createCampaign: (
    siteId: string,
    payload: {
      name: string;
      title: string;
      body: string;
      url: string;
      image?: string;
      icon?: string;
      ttl?: number;
      scheduleAt?: string | null;
      segmentId?: string | null;
    }
  ): Promise<Campaign> =>
    request(`/sites/${siteId}/campaigns`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  sendCampaign: (siteId: string, campaignId: string) =>
    request(`/sites/${siteId}/campaigns/${campaignId}/send`, {
      method: "POST"
    }),

  cancelCampaign: (siteId: string, campaignId: string) =>
    request(`/sites/${siteId}/campaigns/${campaignId}/cancel`, {
      method: "POST"
    }),

  getCampaignMetrics: (
    siteId: string,
    campaignId: string
  ): Promise<{
    targeted: number;
    sent: number;
    delivered: number;
    failed: number;
    shown: number;
    clicks: number;
    ctr: number;
  }> => request(`/sites/${siteId}/campaigns/${campaignId}/metrics`)
};
