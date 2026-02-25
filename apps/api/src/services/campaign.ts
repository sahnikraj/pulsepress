import { db } from "../db/pool";
import { pushQueue } from "./queue";

export async function enqueueCampaignSend(campaignId: string, siteId: string) {
  await db.query(
    `UPDATE campaigns
     SET status = 'queued', queued_at = now()
     WHERE id = $1 AND website_id = $2 AND status IN ('draft', 'scheduled')`,
    [campaignId, siteId]
  );

  await pushQueue.add("send-campaign", { campaignId, siteId }, { attempts: 1 });
}

export async function requestCancelCampaign(campaignId: string, siteId: string) {
  await db.query(
    `UPDATE campaigns
     SET status = 'cancel_requested', canceled_at = now()
     WHERE id = $1 AND website_id = $2 AND status IN ('queued', 'sending', 'scheduled')`,
    [campaignId, siteId]
  );
}
