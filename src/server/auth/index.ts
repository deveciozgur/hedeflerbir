import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { loginSchema, portalSchema } from "@/modules/identity/domain/credentials";
import { canUsePortal } from "@/modules/identity/domain/role";
import { authConfig } from "./auth.config";

export class PortalMismatchError extends CredentialsSignin {
  override code = "portal_mismatch";
}

export class InactiveAccountError extends CredentialsSignin {
  override code = "inactive_account";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, portal: {} },
      async authorize(raw) {
        const credentials = loginSchema.safeParse(raw);
        const portal = portalSchema.safeParse(raw.portal);
        if (!credentials.success || !portal.success) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.data.email },
          select: { id: true, email: true, name: true, surname: true, role: true, passwordHash: true, isActive: true, sessionVersion: true },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.data.password, user.passwordHash);
        if (!valid) return null;
        if (!user.isActive) throw new InactiveAccountError();
        if (!canUsePortal(user.role, portal.data)) throw new PortalMismatchError();

        return { id: user.id, email: user.email, name: `${user.name} ${user.surname}`, role: user.role, sessionVersion: user.sessionVersion };
      },
    }),
  ],
});
