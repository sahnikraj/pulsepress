import { Worker } from "bullmq";
import { redis } from "../db/redis";
import { db } from "../db/pool";
import { rssQueue } from "../services/queue";

export const rssWorker = new Worker(
  "rss-poller",
  async (job) => {
    if (job.name === "poll-rss-loop") {
      const automations = await db.query(
        `SELECT id, website_id FROM automations
         WHERE type = 'rss' AND status = 'active'`
      );

      for (const automation of automations.rows) {
        await rssQueue.add(
          "poll-rss",
          { automationId: automation.id, websiteId: automation.website_id },
          { jobId: `poll-rss-${automation.id}-${Date.now()}` }
        );
      }
      return;
    }

    // RSS parsing and campaign generation are scaffolded here for MVP extension.
    console.log("Polling RSS automation", job.data);
  },
  { connection: redis }
);
