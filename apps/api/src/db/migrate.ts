import fs from "node:fs/promises";
import path from "node:path";
import { db } from "./pool";

async function readMigrationFile(filename: string) {
  const filepath = path.join(process.cwd(), "database", "migrations", filename);
  return fs.readFile(filepath, "utf8");
}

export async function runStartupMigrations() {
  const exists = await db.query<{ exists: string | null }>(
    `SELECT to_regclass('public.users') AS exists`
  );

  if (!exists.rows[0]?.exists) {
    const initSql = await readMigrationFile("001_init.sql");
    await db.query(initSql);
    console.log("Applied startup migration: 001_init.sql");
  } else {
    console.log("Startup migration skipped: base schema already exists");
  }

  const retentionSql = await readMigrationFile("002_retention.sql");
  await db.query(retentionSql);
  console.log("Applied startup migration: 002_retention.sql");
}
