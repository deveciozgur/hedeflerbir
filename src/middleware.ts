import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/server/auth/auth.config";
import { resolveAccess } from "@/modules/identity/domain/access-policy";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const decision = resolveAccess(req.nextUrl.pathname, req.auth?.user?.role);
  return decision.type === "redirect"
    ? NextResponse.redirect(new URL(decision.to, req.nextUrl))
    : NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
