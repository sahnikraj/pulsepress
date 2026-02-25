import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { requireSiteAccess } from "../middleware/tenant";
import { segmentSchema } from "../validators/segment";

export const segmentsRouter = Router({ mergeParams: true });

segmentsRouter.use(requireAuth, requireSiteAccess);

segmentsRouter.post("/", async (req, res) => {
  const parsed = segmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: parsed.error.message });
  }

  const result = await db.query(
    `INSERT INTO segments (id, website_id, name, rules_json)
     VALUES ($1,$2,$3,$4::jsonb)
     RETURNING *`,
    [uuidv4(), req.params.siteId, parsed.data.name, JSON.stringify(parsed.data.rules)]
  );

  return res.status(201).json(result.rows[0]);
});

segmentsRouter.get("/", async (req, res) => {
  const result = await db.query(
    `SELECT * FROM segments WHERE website_id = $1 ORDER BY created_at DESC`,
    [req.params.siteId]
  );
  return res.json({ items: result.rows });
});

segmentsRouter.post("/:segmentId/evaluate", async (req, res) => {
  const result = await db.query(
    `SELECT estimated_count FROM segment_estimates
     WHERE segment_id = $1
     ORDER BY calculated_at DESC
     LIMIT 1`,
    [req.params.segmentId]
  );

  return res.json({ estimatedSubscriberCount: result.rows[0]?.estimated_count ?? 0 });
});
