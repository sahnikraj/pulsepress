import { z } from "zod";

export const segmentSchema = z.object({
  name: z.string().min(1),
  rules: z.record(z.any())
});
