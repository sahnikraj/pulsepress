import jwt from "jsonwebtoken";
import type { JwtUser } from "@pulsepress/shared";
import { env } from "../config/env";

export function signAccessToken(payload: JwtUser) {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
}

export function signRefreshToken(payload: JwtUser) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
}

export function verifyAccessToken(token: string): JwtUser {
  return jwt.verify(token, env.jwtAccessSecret) as JwtUser;
}

export function verifyRefreshToken(token: string): JwtUser {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtUser;
}
