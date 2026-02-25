import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/pool";
import { publicRateLimit } from "../middleware/rateLimit";
import { publicEventSchema, subscribeSchema } from "../validators/public";

export const publicRouter = Router();

publicRouter.use(publicRateLimit);

publicRouter.post("/:siteId/subscribe", async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: parsed.error.message });
  }

  const data = parsed.data;
  const subscriberId = uuidv4();

  await db.query(
    `INSERT INTO subscribers (
      id, website_id, endpoint, p256dh_key, auth_key, browser, device_type,
      country, city, timezone, status, subscription_date, last_site_visit
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',now(),now())
     ON CONFLICT (website_id, endpoint)
     DO UPDATE SET
       p256dh_key = EXCLUDED.p256dh_key,
       auth_key = EXCLUDED.auth_key,
       browser = EXCLUDED.browser,
       device_type = EXCLUDED.device_type,
       timezone = EXCLUDED.timezone,
       status = 'active',
       updated_at = now()`,
    [
      subscriberId,
      req.params.siteId,
      data.endpoint,
      data.keys.p256dh,
      data.keys.auth,
      data.browser,
      data.deviceType,
      data.country ?? null,
      data.city ?? null,
      data.timezone
    ]
  );

  return res.status(200).json({ ok: true });
});

publicRouter.post("/:siteId/event", async (req, res) => {
  const parsed = publicEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: parsed.error.message });
  }

  const { campaignId, subscriberId, eventType } = parsed.data;

  await db.query(
    `INSERT INTO campaign_events (
      id, campaign_id, subscriber_id, event_type, event_timestamp, website_id
     ) VALUES ($1,$2,$3,$4,now(),$5)
     ON CONFLICT ON CONSTRAINT campaign_events_dedupe_key DO NOTHING`,
    [uuidv4(), campaignId, subscriberId, eventType, req.params.siteId]
  );

  if (eventType === "click") {
    await db.query(
      `UPDATE subscribers SET last_click = now() WHERE id = $1`,
      [subscriberId]
    );
  }

  return res.status(200).json({ ok: true });
});
