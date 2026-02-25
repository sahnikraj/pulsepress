import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: env.rateLimitPublicRpm,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Too many requests" }
});
