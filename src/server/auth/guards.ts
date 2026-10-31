import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { homeFor } from "@/modules/identity/domain/access-policy";
import { PORTAL_LOGIN_PATH, type Role } from "@/modules/identity/domain/role";

export interface SessionUser {
  id: string;
  role: Role;
  /** Compared against User.sessionVersion to detect revoked sessions. */
  sessionVersion: number;
}

type SessionState = { status: "anonymous" } | { status: "revoked" } | { status: "active"; user: SessionUser };

/**
 * JWTs can't be revoked on their own, so each request re-checks the account:
 * a suspended account, a bumped sessionVersion (password reset) or a role changed
 * by an admin all invalidate the token. One primary-key lookup, memoized per request.
 */
const getSessionState = cache(async (): Promise<SessionState> => {
  const session = await auth();
  const claims = session?.user;
  if (!claims?.id || !claims.role) return { status: "anonymous" };

  const account = await db.user.findUnique({
    where: { id: claims.id },
    select: { isActive: true, role: true, sessionVersion: true },
  });
  const tokenVersion = claims.sessionVersion ?? 0;
  if (!account?.isActive || account.sessionVersion !== tokenVersion || account.role !== claims.role) {
    return { status: "revoked" };
  }
  return { status: "active", user: { id: claims.id, role: claims.role, sessionVersion: tokenVersion } };
});

/** For route handlers: the authenticated, non-revoked user or null. */
export const getSessionUser = async (): Promise<SessionUser | null> => {
  const state = await getSessionState();
  return state.status === "active" ? state.user : null;
};

/**
 * Defense in depth: middleware already gates routes, but every layout and
 * mutation re-checks authorization on the server.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const state = await getSessionState();
  if (state.status === "anonymous") redirect(PORTAL_LOGIN_PATH.student);
  // Clear the cookie; a plain /login redirect would loop, since middleware still trusts the JWT.
  if (state.status === "revoked") redirect("/logout");
  if (!roles.includes(state.user.role)) redirect(homeFor(state.user.role));
  return state.user;
}
