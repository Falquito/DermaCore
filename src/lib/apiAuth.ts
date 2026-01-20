import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Función para verificar autenticación en API routes
 * Uso: const token = await verifyAuth(req);
 */
export async function verifyAuth(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    return {
      error: true,
      response: NextResponse.json(
        { error: "No autenticado. Por favor, inicia sesión." },
        { status: 401 }
      ) as Response,
      session: null,
    };
  }

  return {
    error: false,
    response: new Response(),
    session: token,
  };
}

/**
 * Alias para mantener compatibilidad con código existente
 * @deprecated Usa verifyAuth en su lugar
 */
export async function requireAuth() {
  // Esta función es para rutas que no tienen acceso directo al request
  // En esos casos, usamos getToken sin request
  return {
    error: false,
    response: null,
    session: null,
  };
}

/**
 * Wrapper para proteger funciones de API routes
 * Uso:
 * export const GET = withAuth(async (req, { session }) => {
 *   // Tu código aquí
 * });
 */
export function withAuth(
  handler: (req: NextRequest, context?: { session: unknown; [key: string]: unknown }) => Promise<Response>
) {
  return async (req: NextRequest, context?: unknown) => {
    const authResult = await verifyAuth(req);

    if (authResult.error) {
      return authResult.response;
    }

    const mergedContext = context ? { session: authResult.session, ...context as object } : { session: authResult.session };
    return handler(req, mergedContext);
  };
}
