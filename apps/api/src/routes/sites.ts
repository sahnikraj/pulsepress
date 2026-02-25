import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import webpush from "web-push";
import { db } from "../db/pool";
import { encrypt } from "../utils/crypto";
import { requireAuth } from "../middleware/auth";

export const siteRouter = Router();

siteRouter.use(requireAuth);

siteRouter.post("/", async (req, res) => {
  const { name, domain, defaultIcon, defaultTtl } = req.body ?? {};
  if (!name || !domain) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "name and domain are required" });
  }

  const vapidKeys = webpush.generateVAPIDKeys();
  const siteId = uuidv4();

  await db.query(
    `INSERT INTO websites (
      id, account_id, name, domain, vapid_public_key, vapid_private_key_encrypted, default_icon, default_ttl
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      siteId,
      req.user?.accountId,
      name,
      domain,
      vapidKeys.publicKey,
      encrypt(vapidKeys.privateKey),
      defaultIcon ?? null,
      defaultTtl ?? 600
    ]
  );

  const installScript = `<script src=\"https://cdn.pulsepress.dev/sdk.js\" data-site-id=\"${siteId}\"></script>`;
  return res.status(201).json({ id: siteId, vapidPublicKey: vapidKeys.publicKey, installScript });
});

siteRouter.get("/", async (req, res) => {
  const sites = await db.query(
    `SELECT id, name, domain, vapid_public_key, created_at
     FROM websites
     WHERE account_id = $1
     ORDER BY created_at DESC`,
    [req.user?.accountId]
  );
  return res.json({ items: sites.rows });
});

siteRouter.get("/:siteId", async (req, res) => {
  const site = await db.query(
    `SELECT id, name, domain, vapid_public_key, created_at
     FROM websites
     WHERE id = $1 AND account_id = $2`,
    [req.params.siteId, req.user?.accountId]
  );

  if (!site.rowCount) {
    return res.status(404).json({ code: "SITE_NOT_FOUND", message: "Site not found" });
  }

  return res.json(site.rows[0]);
});

siteRouter.post("/:siteId/vapid/rotate", async (req, res) => {
  const existing = await db.query(
    `SELECT id FROM websites WHERE id = $1 AND account_id = $2`,
    [req.params.siteId, req.user?.accountId]
  );
  if (!existing.rowCount) {
    return res.status(404).json({ code: "SITE_NOT_FOUND", message: "Site not found" });
  }

  const vapidKeys = webpush.generateVAPIDKeys();
  await db.query(
    `UPDATE websites
     SET vapid_public_key = $1, vapid_private_key_encrypted = $2, updated_at = now()
     WHERE id = $3`,
    [vapidKeys.publicKey, encrypt(vapidKeys.privateKey), req.params.siteId]
  );

  return res.json({ vapidPublicKey: vapidKeys.publicKey });
});
