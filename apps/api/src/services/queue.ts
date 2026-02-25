import { Queue } from "bullmq";
import { redis } from "../db/redis";

export const pushQueue = new Queue("push-campaigns", { connection: redis });
export const analyticsQueue = new Queue("analytics-nightly", { connection: redis });
export const rssQueue = new Queue("rss-poller", { connection: redis });
export const webhookQueue = new Queue("webhook-delivery", { connection: redis });
