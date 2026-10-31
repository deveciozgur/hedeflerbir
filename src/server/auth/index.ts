import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { recordAudit } from "@/server/audit";
import { loginSchema, portalSchema } from "@/modules/identity/domain/credentials";
import { canUsePortal } from "@/modules/identity/domain/role";
import { authConfig } from "./auth.config";

export class PortalMismatchError extends CredentialsSignin {
  override code = "portal_mismatch";
}

export class InactiveAccountError extends CredentialsSignin {
  override code = "inactive_account";
}

/**
 * Login diagnostics. Every failed attempt logs its reason (never the password) so a
 * "Giriş sırasında bir sorun oluştu" in production can be traced in the server logs:
 * that message means authorize() threw, typically because the database is unreachable
 * or not migrated, or AUTH_SECRET is missing.
 */
const authLog = (event: string, details: Record<string, unknown>) => console.error(`[auth] ${event}`, details);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    error(error) {
      if (error.name === "CredentialsSignin") return; // already logged with its reason by authorize()
      const cause = error.cause instanceof Error ? error.cause : (error.cause as { err?: unknown } | undefined)?.err;
      authLog(error.name, {
        message: error.message,
        cause: cause instanceof Error ? `${cause.name}: ${cause.message}` : cause,
      });
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, portal: {} },
      async authorize(raw) {
        const credentials = loginSchema.safeParse(raw);
        const portal = portalSchema.safeParse(raw.portal);
        if (!credentials.success || !portal.success) {
          authLog("invalid input", { emailValid: credentials.success, portal: raw.portal });
          return null;
        }
        const { email } = credentials.data;

        let user;
        try {
          user = await db.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, surname: true, role: true, passwordHash: true, isActive: true, sessionVersion: true },
          });
        } catch (error) {
          authLog("database lookup failed", { email, error: error instanceof Error ? `${error.name}: ${error.message}` : error });
          throw error;
        }
        if (!user) {
          authLog("user not found", { email });
          await recordAudit({ action: "auth.login_failed", actorEmail: email, metadata: { reason: "unknown_email", portal: portal.data } });
          return null;
        }
        if (!user.passwordHash) {
          authLog("user has no password hash", { email });
          await recordAudit({ action: "auth.login_failed", actorId: user.id, actorEmail: email, metadata: { reason: "no_password", portal: portal.data } });
          return null;
        }

        const valid = await bcrypt.compare(credentials.data.password, user.passwordHash);
        const failed = (reason: string) =>
          recordAudit({ action: "auth.login_failed", actorId: user.id, actorEmail: email, metadata: { reason, portal: portal.data } });
        if (!valid) {
          authLog("password mismatch", { email, bcrypt: false });
          await failed("wrong_password");
          return null;
        }
        if (!user.isActive) {
          authLog("inactive account", { email });
          await failed("inactive_account");
          throw new InactiveAccountError();
        }
        if (!canUsePortal(user.role, portal.data)) {
          authLog("portal mismatch", { email, role: user.role, portal: portal.data });
          await failed("portal_mismatch");
          throw new PortalMismatchError();
        }
        await recordAudit({ action: "auth.login_success", actorId: user.id, actorEmail: email, metadata: { portal: portal.data } });

        return { id: user.id, email: user.email, name: `${user.name} ${user.surname}`, role: user.role, sessionVersion: user.sessionVersion };
      },
    }),
  ],
});
