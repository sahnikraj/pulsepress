import { Worker } from "bullmq";
import { redis } from "../db/redis";
import { signWebhook } from "../utils/webhook";

export const webhookWorker = new Worker(
  "webhook-delivery",
  async (job) => {
    const body = JSON.stringify({
      event: job.data.eventType,
      data: job.data.payload,
      occurredAt: new Date().toISOString()
    });

    const signature = signWebhook(job.data.secret, body);

    const response = await fetch(job.data.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature": signature
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed with ${response.status}`);
    }
  },
  { connection: redis, concurrency: 10 }
);
