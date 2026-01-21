import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Rutas que solo se muestran a usuarios NO autenticados (login/register)
const AUTH_ONLY_ROUTES = ["/auth/login", "/auth/register"];

// Rutas protegidas que requieren autenticación
const PROTECTED_ROUTE_PREFIXES = ["/obras-sociales", "/pacientes"];

/**
 * Middleware de autenticación usando next-auth/jwt
 * - Protege rutas que requieren autenticación
 * - Redirige usuarios autenticados lejos de páginas de login/register
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Obtener token de sesión
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Verificar si es ruta de auth (login/register)
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Usuario AUTENTICADO intentando acceder a login/register -> redirigir a home
  if (isAuthenticated && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Verificar si es ruta protegida
  const isProtectedRoute = 
    pathname === "/" || 
    PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Usuario NO autenticado intentando acceder a ruta protegida
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (api/)
     * - static files (_next/static, _next/image)
     * - favicon.ico
     * - public files (public/)
     */
    "/",
    "/auth/:path*",
    "/pacientes/:path*",
    "/obras-sociales/:path*",
  ],
};
