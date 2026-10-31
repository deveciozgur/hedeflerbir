import type { NextAuthConfig } from "next-auth";
import { isRole } from "@/modules/identity/domain/role";

/**
 * Edge-safe Auth.js configuration (no Prisma, no bcrypt).
 * Shared by middleware and the full node-runtime instance in ./index.ts.
 */
export const authConfig = {
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user && !(user.id && isRole(user.role))) console.error("[auth] jwt: signed-in user has no id/role", { id: user.id, role: user.role });
      if (user?.id && isRole(user.role)) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string" && isRole(token.role)) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.sessionVersion = typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
