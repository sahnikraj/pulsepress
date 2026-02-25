import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { requireSiteAccess } from "../middleware/tenant";
import { rssQueue } from "../services/queue";

export const automationsRouter = Router({ mergeParams: true });

automationsRouter.use(requireAuth, requireSiteAccess);

automationsRouter.post("/rss", async (req, res) => {
  const feedUrl = req.body?.feedUrl;
  const autoSend = Boolean(req.body?.autoSend);
  if (!feedUrl) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "feedUrl is required" });
  }

  const automation = await db.query(
    `INSERT INTO automations (id, website_id, type, config_json, status)
     VALUES ($1,$2,'rss',$3::jsonb,'active')
     RETURNING *`,
    [uuidv4(), req.params.siteId, JSON.stringify({ feedUrl, autoSend, intervalMinutes: 5 })]
  );

  await rssQueue.add("poll-rss", { websiteId: req.params.siteId, automationId: automation.rows[0].id });

  return res.status(201).json(automation.rows[0]);
});

automationsRouter.get("/", async (req, res) => {
  const result = await db.query(
    `SELECT * FROM automations WHERE website_id = $1 ORDER BY created_at DESC`,
    [req.params.siteId]
  );

  return res.json({ items: result.rows });
});
