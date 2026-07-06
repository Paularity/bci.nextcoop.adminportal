import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isApiAuth = pathname.startsWith("/api/auth");
  if (isApiAuth) return;

  const session = req.auth;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (isAuthPage) {
    if (session && role === "SYSTEM_ADMIN") {
      return NextResponse.redirect(new URL("/tenants", req.nextUrl));
    }
    return;
  }

  if (!session) {
    const url = new URL("/login", req.nextUrl);
    return NextResponse.redirect(url);
  }
  if (role !== "SYSTEM_ADMIN") {
    const url = new URL("/login?error=forbidden", req.nextUrl);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
