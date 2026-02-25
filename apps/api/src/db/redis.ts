import IORedis from "ioredis";
import { env } from "../config/env";

export const redis = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null
});
