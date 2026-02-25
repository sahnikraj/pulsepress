import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { requireSiteAccess } from "../middleware/tenant";

export const webhooksRouter = Router({ mergeParams: true });

webhooksRouter.use(requireAuth, requireSiteAccess);

webhooksRouter.post("/", async (req, res) => {
  const { url, secret, eventFilters } = req.body ?? {};
  if (!url || !secret) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "url and secret are required" });
  }

  const result = await db.query(
    `INSERT INTO webhook_endpoints (id, website_id, url, secret, event_filters, status)
     VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`,
    [uuidv4(), req.params.siteId, url, secret, eventFilters ?? []]
  );

  return res.status(201).json(result.rows[0]);
});

webhooksRouter.get("/", async (req, res) => {
  const result = await db.query(
    `SELECT id, url, event_filters, status, created_at
     FROM webhook_endpoints WHERE website_id = $1 ORDER BY created_at DESC`,
    [req.params.siteId]
  );

  return res.json({ items: result.rows });
});
