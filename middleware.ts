import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/auth/login", "/auth/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Obtener token del request
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // TODO: Descomentar cuando se complete la autenticación
  // Si el usuario no está autenticado y trata de acceder a una ruta privada
  // if (!token && !isPublicRoute) {
  //   return NextResponse.redirect(new URL("/auth/login", req.url));
  // }

  // TODO: Descomentar cuando se complete la autenticación
  // Si el usuario está autenticado y trata de acceder a rutas de autenticación
  // if (token && isPublicRoute) {
  //   return NextResponse.redirect(new URL("/", req.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto públicas, static files, API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
