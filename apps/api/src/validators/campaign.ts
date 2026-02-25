import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().url(),
  image: z.string().url().optional(),
  icon: z.string().url().optional(),
  ttl: z.number().int().min(1).max(86400).default(600),
  urgency: z.enum(["very-low", "low", "normal", "high"]).default("normal"),
  segmentId: z.string().uuid().nullable().optional(),
  scheduleAt: z.string().datetime().nullable().optional()
});
