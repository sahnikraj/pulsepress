import { Pool } from "pg";
import { env } from "../config/env";

const useSsl = env.databaseUrl.includes("render.com");

export const db = new Pool({
  connectionString: env.databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined
});
