import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook para verificar autenticación y redirigir si no hay sesión
 * Retorna la sesión actual y un estado de carga
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  return {
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}

/**
 * Hook para obtener solo la sesión sin redirigir
 */
export function useSessionData() {
  const { data: session, status } = useSession();

  return {
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
