import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_ONLY_ROUTES = ["/auth/login", "/auth/register"];
const PROTECTED_ROUTE_PREFIXES = ["/pacientes", "/obras-sociales"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isAuthenticated && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const isProtectedRoute =
    pathname === "/" ||
    PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", req.url);
    const callbackUrl = pathname + search;
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/:path*", "/pacientes/:path*", "/obras-sociales/:path*"],
};
