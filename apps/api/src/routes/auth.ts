import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { loginSchema, registerSchema } from "../validators/auth";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: parsed.error.message });
  }

  const { email, password, accountName } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  const userId = uuidv4();
  const accountId = uuidv4();

  await db.query("BEGIN");
  try {
    await db.query(
      `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)`,
      [userId, email, passwordHash]
    );

    await db.query(
      `INSERT INTO accounts (id, name, owner_user_id) VALUES ($1, $2, $3)`,
      [accountId, accountName, userId]
    );

    await db.query(
      `INSERT INTO account_memberships (id, account_id, user_id, role)
       VALUES ($1, $2, $3, 'owner')`,
      [uuidv4(), accountId, userId]
    );

    const refreshToken = signRefreshToken({ userId, accountId, email });
    await db.query(
      `INSERT INTO refresh_tokens (id, user_id, account_id, token_hash, expires_at)
       VALUES ($1, $2, $3, digest($4, 'sha256'), now() + interval '30 days')`,
      [uuidv4(), userId, accountId, refreshToken]
    );

    await db.query("COMMIT");

    return res.status(201).json({
      accessToken: signAccessToken({ userId, accountId, email }),
      refreshToken
    });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR", message: parsed.error.message });
  }

  const { email, password } = parsed.data;
  const userRes = await db.query(
    `SELECT u.id, u.email, u.password_hash, am.account_id
     FROM users u
     JOIN account_memberships am ON am.user_id = u.id
     WHERE u.email = $1
     LIMIT 1`,
    [email]
  );

  if (!userRes.rowCount) {
    return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
  }

  const user = userRes.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
  }

  const payload = { userId: user.id, accountId: user.account_id, email: user.email };
  const refreshToken = signRefreshToken(payload);

  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, account_id, token_hash, expires_at)
     VALUES ($1, $2, $3, digest($4, 'sha256'), now() + interval '30 days')`,
    [uuidv4(), user.id, user.account_id, refreshToken]
  );

  return res.json({
    accessToken: signAccessToken(payload),
    refreshToken
  });
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.body?.refreshToken;
  if (!token) {
    return res.status(400).json({ code: "TOKEN_REQUIRED", message: "refreshToken is required" });
  }

  try {
    const payload = verifyRefreshToken(token);
    const existing = await db.query(
      `SELECT id FROM refresh_tokens
       WHERE token_hash = digest($1, 'sha256')
         AND revoked_at IS NULL
         AND expires_at > now()
       LIMIT 1`,
      [token]
    );

    if (!existing.rowCount) {
      return res.status(401).json({ code: "INVALID_TOKEN", message: "Invalid refresh token" });
    }

    await db.query(
      `UPDATE refresh_tokens
       SET revoked_at = now()
       WHERE id = $1`,
      [existing.rows[0].id]
    );

    const newRefresh = signRefreshToken(payload);
    await db.query(
      `INSERT INTO refresh_tokens (id, user_id, account_id, token_hash, expires_at)
       VALUES ($1, $2, $3, digest($4, 'sha256'), now() + interval '30 days')`,
      [uuidv4(), payload.userId, payload.accountId, newRefresh]
    );

    return res.json({
      accessToken: signAccessToken(payload),
      refreshToken: newRefresh
    });
  } catch {
    return res.status(401).json({ code: "INVALID_TOKEN", message: "Invalid refresh token" });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});
