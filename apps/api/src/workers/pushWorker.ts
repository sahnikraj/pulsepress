import { Worker } from "bullmq";
import webpush from "web-push";
import { db } from "../db/pool";
import { redis } from "../db/redis";
import { decrypt } from "../utils/crypto";
import { emitCampaignWebhook } from "../services/webhooks";

const BATCH_SIZE = 500;

async function processCampaign(campaignId: string, siteId: string) {
  const campaignRes = await db.query(
    `SELECT c.*, w.vapid_public_key, w.vapid_private_key_encrypted
     FROM campaigns c
     JOIN websites w ON w.id = c.website_id
     WHERE c.id = $1 AND c.website_id = $2
     LIMIT 1`,
    [campaignId, siteId]
  );

  if (!campaignRes.rowCount) {
    return;
  }

  const campaign = campaignRes.rows[0];
  webpush.setVapidDetails(
    `mailto:ops@${campaign.domain ?? "pulsepress.dev"}`,
    campaign.vapid_public_key,
    decrypt(campaign.vapid_private_key_encrypted)
  );

  await db.query(`UPDATE campaigns SET status = 'sending', started_at = now() WHERE id = $1`, [campaignId]);
  await emitCampaignWebhook(siteId, "campaign.sending", { campaignId, websiteId: siteId });

  const snapshot = await db.query(
    `INSERT INTO campaign_snapshots (id, campaign_id, website_id, targeted_count, rules_snapshot)
     SELECT gen_random_uuid(), $1, $2, COUNT(*), COALESCE((SELECT rules_json FROM segments WHERE id = c.segment_id), '{}'::jsonb)
     FROM subscribers s
     JOIN campaigns c ON c.id = $1
     WHERE s.website_id = $2 AND s.status = 'active'
     RETURNING targeted_count`,
    [campaignId, siteId]
  );

  let offset = 0;
  while (true) {
    const currentState = await db.query(`SELECT status FROM campaigns WHERE id = $1`, [campaignId]);
    if (currentState.rows[0]?.status === "cancel_requested") {
      await db.query(`UPDATE campaigns SET status = 'canceled', completed_at = now() WHERE id = $1`, [campaignId]);
      await emitCampaignWebhook(siteId, "campaign.canceled", { campaignId, websiteId: siteId });
      return;
    }

    const batch = await db.query(
      `SELECT id, endpoint, p256dh_key, auth_key
       FROM subscribers
       WHERE website_id = $1 AND status = 'active'
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [siteId, BATCH_SIZE, offset]
    );

    if (!batch.rowCount) {
      break;
    }

    for (const sub of batch.rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          },
          JSON.stringify({
            campaignId,
            title: campaign.title,
            body: campaign.body,
            url: campaign.url,
            icon: campaign.icon,
            image: campaign.image
          }),
          { TTL: campaign.ttl, urgency: campaign.urgency }
        );

        await db.query(
          `INSERT INTO campaign_events (id, campaign_id, subscriber_id, website_id, event_type, event_timestamp)
           VALUES (gen_random_uuid(), $1, $2, $3, 'sent', now())`,
          [campaignId, sub.id, siteId]
        );
      } catch (error: any) {
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          await db.query(`UPDATE subscribers SET status = 'expired' WHERE id = $1`, [sub.id]);
        }

        await db.query(
          `INSERT INTO campaign_events (
             id, campaign_id, subscriber_id, website_id, event_type, event_timestamp,
             error_code, provider_status
           ) VALUES (gen_random_uuid(), $1, $2, $3, 'failed', now(), $4, $5)`,
          [campaignId, sub.id, siteId, String(error?.code ?? "UNKNOWN"), String(error?.statusCode ?? "")]
        );
      }
    }

    offset += BATCH_SIZE;
  }

  await db.query(
    `UPDATE campaigns SET status = 'completed', completed_at = now(), targeted_count = $2 WHERE id = $1`,
    [campaignId, snapshot.rows[0]?.targeted_count ?? 0]
  );

  await emitCampaignWebhook(siteId, "campaign.completed", { campaignId, websiteId: siteId });
}

export const pushWorker = new Worker(
  "push-campaigns",
  async (job) => {
    await processCampaign(job.data.campaignId, job.data.siteId);
  },
  { connection: redis, concurrency: 5 }
);
