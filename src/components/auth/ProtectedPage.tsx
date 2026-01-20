"use client";

import { ReactNode } from "react";
// import { useAuth } from "@/hooks/useAuth";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

interface ProtectedPageProps {
  children: ReactNode;
}

/**
 * Componente para proteger páginas que requieren autenticación
 * Muestra un spinner de carga mientras verifica la sesión
 * 
 * TODO: Descomentar la validación cuando se complete la autenticación
 */
export function ProtectedPage({ children }: ProtectedPageProps) {
  // TODO: Descomentar cuando se active la autenticación
  // const { isLoading, isAuthenticated } = useAuth();
  // const router = useRouter();

  // // Si no está autenticado después de cargar, redirigir
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push("/auth/login");
  //   }
  // }, [isLoading, isAuthenticated, router]);

  // // Mientras se verifica la sesión
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-cyan-900 via-cyan-950 to-cyan-950">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="w-12 h-12 border-4 border-cyan-400 border-t-cyan-200 rounded-full animate-spin"></div>
  //         <p className="text-cyan-200 font-medium tracking-wide">Cargando Dermacor...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // // Si no está autenticado, no mostrar nada (el efecto lo redirigirá)
  // if (!isAuthenticated) {
  //   return null;
  // }

  // Por el momento, mostrar contenido sin validación
  return <>{children}</>;
}
