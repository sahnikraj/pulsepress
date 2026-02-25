import crypto from "crypto";

export function signWebhook(secret: string, body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}
