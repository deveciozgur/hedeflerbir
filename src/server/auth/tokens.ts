import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** 256-bit URL-safe token; only its hash is persisted. */
export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
