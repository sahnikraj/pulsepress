import { analyticsQueue, rssQueue } from "./queue";

export async function registerRecurringJobs() {
  await analyticsQueue.add(
    "nightly-rollup",
    {},
    {
      jobId: "nightly-rollup",
      repeat: { pattern: "0 2 * * *" }
    }
  );

  await rssQueue.add(
    "poll-rss-loop",
    {},
    {
      jobId: "poll-rss-loop",
      repeat: { every: 5 * 60 * 1000 }
    }
  );
}
