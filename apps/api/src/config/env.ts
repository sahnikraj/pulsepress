import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "ENCRYPTION_KEY"
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL as string,
  redisUrl: process.env.REDIS_URL as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  encryptionKey: process.env.ENCRYPTION_KEY as string,
  rateLimitPublicRpm: Number(process.env.RATE_LIMIT_PUBLIC_RPM ?? 120),
  defaultRssPollMinutes: Number(process.env.DEFAULT_RSS_POLL_MINUTES ?? 5)
};
