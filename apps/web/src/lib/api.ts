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

  listSites: () => request("/sites"),

  createSite: (payload: { name: string; domain: string; defaultIcon?: string; defaultTtl?: number }) =>
    request("/sites", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  getSite: (siteId: string) => request(`/sites/${siteId}`)
};
