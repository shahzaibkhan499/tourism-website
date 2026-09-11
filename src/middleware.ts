import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const useSecureCookies = Boolean(process.env.NEXTAUTH_URL?.startsWith("https://"));
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? "",
    secureCookie: useSecureCookies,
    salt: useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token",
  });

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Admin routes: only ADMIN role allowed
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected app routes: require session
  const protectedPaths = [
    "/dashboard",
    "/events",
    "/community",
    "/rishta",
    "/jobs",
    "/business",
    "/memories",
    "/media",
    "/profile",
    "/settings",
    "/notifications",
    "/buzurg",
    "/kids",
  ];
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages: redirect logged-in users to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|og-image.png|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$).*)",
  ],
};
