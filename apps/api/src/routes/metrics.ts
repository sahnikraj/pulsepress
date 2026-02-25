import { Router } from "express";
import { db } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { requireSiteAccess } from "../middleware/tenant";

export const metricsRouter = Router({ mergeParams: true });

metricsRouter.use(requireAuth, requireSiteAccess);

metricsRouter.get("/:campaignId/metrics", async (req, res) => {
  const campaignId = req.params.campaignId;

  const rows = await db.query(
    `SELECT event_type, COUNT(*)::int AS count
     FROM campaign_events
     WHERE campaign_id = $1
     GROUP BY event_type`,
    [campaignId]
  );

  const map = Object.fromEntries(rows.rows.map((r) => [r.event_type, r.count]));

  const targetedRes = await db.query(
    `SELECT targeted_count FROM campaign_snapshots WHERE campaign_id = $1 LIMIT 1`,
    [campaignId]
  );

  const targeted = targetedRes.rows[0]?.targeted_count ?? 0;
  const clicks = map.click ?? 0;
  const shown = map.shown ?? 0;

  return res.json({
    targeted,
    sent: map.sent ?? 0,
    delivered: map.delivered ?? 0,
    failed: map.failed ?? 0,
    shown,
    clicks,
    ctr: shown ? clicks / shown : 0
  });
});

metricsRouter.get("/:campaignId/breakdown", async (req, res) => {
  const groupBy = String(req.query.groupBy ?? "country");
  const allowed = new Set(["country", "browser", "device", "hour"]);
  if (!allowed.has(groupBy)) {
    return res.status(400).json({ code: "INVALID_GROUPBY", message: "Invalid groupBy" });
  }

  const sqlMap: Record<string, string> = {
    country: "COALESCE(s.country, 'unknown')",
    browser: "COALESCE(s.browser, 'unknown')",
    device: "COALESCE(s.device_type, 'unknown')",
    hour: "EXTRACT(HOUR FROM ce.event_timestamp)::text"
  };

  const result = await db.query(
    `SELECT ${sqlMap[groupBy]} AS label, COUNT(*)::int AS count
     FROM campaign_events ce
     JOIN subscribers s ON s.id = ce.subscriber_id
     WHERE ce.campaign_id = $1
     GROUP BY label
     ORDER BY count DESC`,
    [req.params.campaignId]
  );

  return res.json({ items: result.rows, groupBy });
});
