import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        accountId: string;
        email: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing bearer token" });
  }

  try {
    const token = authHeader.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
  }
}
