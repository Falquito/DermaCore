"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isMobileOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  isReady: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = "sidebar-collapsed";

// Función para leer localStorage de forma segura
function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  } catch {
    return false;
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Inicializar con el valor de localStorage directamente para evitar flash
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => getStoredCollapsed());
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  // Marcar como listo después de la hidratación
  useEffect(() => {
    // Re-sincronizar con localStorage después de la hidratación
    const stored = getStoredCollapsed();
    setIsCollapsedState(stored);
    // Usar requestAnimationFrame para asegurar que el DOM está listo
    requestAnimationFrame(() => {
      setIsReady(true);
    });
  }, []);

  // Cerrar menú automáticamente al cambiar de ruta (solo mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsedState((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(newValue));
      } catch {
        // Ignorar errores de localStorage
      }
      return newValue;
    });
  }, []);

  const toggleMobileMenu = useCallback(() => setIsMobileOpen((prev) => !prev), []);
  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), []);

  const value = useMemo(() => ({
    isMobileOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed,
    isReady
  }), [isMobileOpen, toggleMobileMenu, closeMobileMenu, isCollapsed, setIsCollapsed, toggleCollapsed, isReady]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

// Hook personalizado para usarlo fácil
export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext debe usarse dentro de un SidebarProvider");
  }
  return context;
}