import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { requireSiteAccess } from "../middleware/tenant";
import { createCampaignSchema } from "../validators/campaign";
import { enqueueCampaignSend, requestCancelCampaign } from "../services/campaign";
import { emitCampaignWebhook } from "../services/webhooks";

export const campaignsRouter = Router({ mergeParams: true });

campaignsRouter.use(requireAuth, requireSiteAccess);

campaignsRouter.post("/", async (req, res) => {
  const siteId = (req.params as any).siteId as string;
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: parsed.error.message });
  }

  const data = parsed.data;
  const status = data.scheduleAt ? "scheduled" : "draft";

  const result = await db.query(
    `INSERT INTO campaigns (
      id, website_id, name, title, body, url, image, icon, ttl, urgency, segment_id, status, scheduled_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      uuidv4(),
      siteId,
      data.name,
      data.title,
      data.body,
      data.url,
      data.image ?? null,
      data.icon ?? null,
      data.ttl,
      data.urgency,
      data.segmentId ?? null,
      status,
      data.scheduleAt ? new Date(data.scheduleAt) : null
    ]
  );

  return res.status(201).json(result.rows[0]);
});

campaignsRouter.get("/", async (req, res) => {
  const siteId = (req.params as any).siteId as string;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const cursor = req.query.cursor as string | undefined;

  const result = await db.query(
    `SELECT id, name, title, status, scheduled_at, created_at
     FROM campaigns
     WHERE website_id = $1
       AND ($2::uuid IS NULL OR id < $2::uuid)
     ORDER BY created_at DESC
     LIMIT $3`,
    [siteId, cursor ?? null, limit + 1]
  );

  const hasMore = result.rows.length > limit;
  const items = hasMore ? result.rows.slice(0, limit) : result.rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return res.json({ items, nextCursor });
});

campaignsRouter.get("/:campaignId", async (req, res) => {
  const siteId = (req.params as any).siteId as string;
  const campaign = await db.query(
    `SELECT * FROM campaigns WHERE id = $1 AND website_id = $2`,
    [req.params.campaignId, siteId]
  );

  if (!campaign.rowCount) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Campaign not found" });
  }

  return res.json(campaign.rows[0]);
});

campaignsRouter.post("/:campaignId/send", async (req, res) => {
  const siteId = (req.params as any).siteId as string;
  await enqueueCampaignSend(req.params.campaignId, siteId);
  await emitCampaignWebhook(siteId, "campaign.queued", {
    campaignId: req.params.campaignId,
    websiteId: siteId
  });
  return res.status(202).json({ status: "queued" });
});

campaignsRouter.post("/:campaignId/cancel", async (req, res) => {
  const siteId = (req.params as any).siteId as string;
  await requestCancelCampaign(req.params.campaignId, siteId);
  await emitCampaignWebhook(siteId, "campaign.canceled", {
    campaignId: req.params.campaignId,
    websiteId: siteId
  });
  return res.status(202).json({ status: "cancel_requested" });
});
