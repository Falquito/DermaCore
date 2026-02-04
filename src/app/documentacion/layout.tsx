"use client"
import { ProtectedPage } from "@/components/auth/ProtectedPage";
import { Header } from "@/components/header";
import SideBar from "@/components/sideBar";
import { SidebarProvider } from "@/components/ui/sidebar-context";
import { useEffect } from "react";

export default function DocumentacionLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
  const handleRejection = (e: PromiseRejectionEvent) => {
    // Si el error contiene "provider destroyed", lo silenciamos porque es un falso positivo del desmontaje
    if (e.reason?.message?.includes("provider destroyed") || e.reason?.name === "AbortError") {
      e.preventDefault();
    }
  };

  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);

  return (
    <SidebarProvider> {/* El key fuerza a React a resetear el contexto si la ruta cambia drásticamente */}
      <ProtectedPage>
        <Header />
        <SideBar>
          {children}
        </SideBar>
      </ProtectedPage>
    </SidebarProvider>
  );
}