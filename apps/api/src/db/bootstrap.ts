import fs from "node:fs/promises";
import path from "node:path";
import { db } from "./pool";

let bootstrapPromise: Promise<void> | null = null;

function makeInitMigrationPortable(sql: string) {
  return sql
    .replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;?/gi, "")
    .replace(/DEFAULT gen_random_uuid\(\)/gi, "")
    .replace(/CREATE TABLE\s+([a-z_]+)/gi, "CREATE TABLE IF NOT EXISTS $1")
    .replace(/CREATE UNIQUE INDEX\s+([a-z_]+)/gi, "CREATE UNIQUE INDEX IF NOT EXISTS $1")
    .replace(/CREATE INDEX\s+([a-z_]+)/gi, "CREATE INDEX IF NOT EXISTS $1");
}

async function runBootstrap() {
  const exists = await db.query<{ exists: string | null }>(
    `SELECT to_regclass('public.users') AS exists`
  );
  if (exists.rows[0]?.exists) {
    return;
  }

  const candidates = [
    path.join(process.cwd(), "database", "migrations", "001_init.sql"),
    path.join(process.cwd(), "..", "..", "database", "migrations", "001_init.sql")
  ];

  let sql: string | null = null;
  for (const candidate of candidates) {
    try {
      sql = await fs.readFile(candidate, "utf8");
      break;
    } catch {
      // try next path candidate
    }
  }

  if (!sql) {
    throw new Error("Missing 001_init.sql migration file");
  }

  await db.query(makeInitMigrationPortable(sql));
}

export async function ensureDatabaseSchema() {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  await bootstrapPromise;
}
