import { z } from "zod";

export const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  }),
  browser: z.enum(["chrome", "firefox", "edge", "safari"]),
  deviceType: z.enum(["desktop", "mobile", "tablet"]),
  timezone: z.string().min(1),
  country: z.string().optional(),
  city: z.string().optional()
});

export const publicEventSchema = z.object({
  campaignId: z.string().uuid(),
  subscriberId: z.string().uuid(),
  eventType: z.enum(["shown", "click"])
});
