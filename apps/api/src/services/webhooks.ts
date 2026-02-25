import { db } from "../db/pool";
import { webhookQueue } from "./queue";

export async function emitCampaignWebhook(
  websiteId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const endpoints = await db.query(
    `SELECT id, url, secret, event_filters
     FROM webhook_endpoints
     WHERE website_id = $1 AND status = 'active'`,
    [websiteId]
  );

  for (const row of endpoints.rows) {
    const filters: string[] = row.event_filters ?? [];
    if (filters.length && !filters.includes(eventType)) {
      continue;
    }

    await webhookQueue.add("deliver-webhook", {
      webhookId: row.id,
      url: row.url,
      secret: row.secret,
      eventType,
      payload
    }, {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000
      }
    });
  }
}
