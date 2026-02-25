import type { NextFunction, Request, Response } from "express";
import { db } from "../db/pool";

export async function requireSiteAccess(req: Request, res: Response, next: NextFunction) {
  const siteId = req.params.siteId;
  const accountId = req.user?.accountId;

  if (!siteId || !accountId) {
    return res.status(400).json({ code: "INVALID_CONTEXT", message: "Missing site or account context" });
  }

  const result = await db.query(
    `SELECT id FROM websites WHERE id = $1 AND account_id = $2`,
    [siteId, accountId]
  );

  if (!result.rowCount) {
    return res.status(404).json({ code: "SITE_NOT_FOUND", message: "Website not found for account" });
  }

  return next();
}
