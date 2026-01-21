import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook principal de autenticación
 * Proporciona estado de sesión y funciones de utilidad
 */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  /**
   * Cierra la sesión y redirige al login
   */
  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  }, [router]);

  /**
   * Actualiza la sesión (útil después de cambios en el usuario)
   */
  const refreshSession = useCallback(async () => {
    await update();
  }, [update]);

  return {
    session,
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
    status,
    logout,
    refreshSession,
  };
}

/**
 * Hook para obtener solo la sesión sin funciones adicionales
 * Útil cuando solo necesitas leer datos de la sesión
 */
export function useSessionData() {
  const { data: session, status } = useSession();

  return {
    session,
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
  };
}

/**
 * Hook para verificar si el usuario tiene un rol específico
 */
export function useHasRole(requiredRole: string) {
  const { user, isLoading, isAuthenticated } = useSessionData();
  
  return {
    hasRole: user?.role === requiredRole,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Hook para obtener el ID del usuario actual
 */
export function useUserId() {
  const { user } = useSessionData();
  return user?.id ?? null;
}
