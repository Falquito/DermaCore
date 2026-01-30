"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Users,
  ChevronLeft,
  IdCard,
  X,
  LogOut,
  LogIn,
  UserPlus,
  User,
  Home,
  ShieldPlus,
  Settings,
  ChevronUp,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarContext } from "@/components/ui/sidebar-context";
import { UserSettingsModal } from "@/components/user/UserSettingsModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MENU_ITEMS = [
  { name: "Inicio", url: "/", icon: Home },
  { name: "Pacientes", url: "/pacientes", icon: Users },
  { name: "Obras Sociales", url: "/obras-sociales", icon: IdCard },
  { name: "Coseguros", url: "/coseguros", icon: ShieldPlus },
];

interface SideBarProps {
  children: React.ReactNode;
}

export default function SideBar({ children }: SideBarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // Usamos el contexto para mobile y colapso desktop
  const { isMobileOpen, closeMobileMenu, isCollapsed, toggleCollapsed, isReady } = useSidebarContext();

  // Estado para el modal de configuración
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Calcular el ancho del sidebar
  const sidebarWidth = isCollapsed && !isMobileOpen ? "md:w-20" : "w-64";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* BACKDROP MOBILE */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        style={{
          // Desactivar transición hasta que esté listo para evitar animación inicial
          transitionProperty: isReady ? "all" : "none",
        }}
        className={cn(
          // 1. CLASES BASE
          "fixed left-0 z-50 flex flex-col border-r bg-white duration-300 ease-out",

          // 2. MOBILE: posición fija debajo del header
          "top-16 bottom-0",

          // 3. DESKTOP: posición relativa
          "md:relative md:top-0 md:bottom-auto md:h-full",

          // 4. APERTURA/CIERRE mobile
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",

          // 5. ANCHO
          sidebarWidth
        )}
      >
        {/* CABECERA SIDEBAR MOBILE */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <span className="font-bold text-lg text-cyan-700">Menú</span>
          <button
            onClick={closeMobileMenu}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* BOTÓN COLAPSAR DESKTOP - Movido fuera del aside para evitar la línea */}
        <div 
          className="hidden md:flex absolute -right-4 top-6 z-60 items-center justify-center"
        >
          <button
            onClick={toggleCollapsed}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 hover:shadow-lg transition-shadow duration-200"
          >
            <ChevronLeft 
              size={14} 
              className={cn(
                "text-gray-600 transition-transform duration-300 ease-out",
                isCollapsed ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </div>

        {/* LINKS */}
        <div className="flex flex-col gap-2 p-4 py-6 overflow-y-auto overflow-x-hidden flex-1">
          <p
            className={cn(
              "px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-all duration-300 ease-out",
              isCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
            )}
          >
            Páginas
          </p>

          {MENU_ITEMS.map((tab, index) => {
            const isActive = pathname === tab.url;
            const Icon = tab.icon;

            return (
              <Link
                key={index}
                href={tab.url}
                onClick={closeMobileMenu} // Cierra el menú al hacer click en mobile
                title={isCollapsed ? tab.name : ""}
                className={cn(
                  "flex items-center py-3 rounded-lg transition-all duration-200 ease-out group relative",
                  isCollapsed ? "justify-center px-0" : "px-4 gap-3",
                  isActive ? "bg-cyan-50 text-cyan-700" : "text-gray-600 hover:bg-gray-50 hover:translate-x-1"
                )}
              >
                <Icon
                  size={22}
                  className={cn(
                    "shrink-0 transition-all duration-200",
                    isActive ? "text-cyan-600" : "text-gray-500 group-hover:text-cyan-600"
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-300 ease-out font-medium",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  {tab.name}
                </span>
                {isActive && (
                  <div className={cn(
                    "absolute right-0 top-0 h-full w-1 bg-cyan-600 rounded-l-full transition-all duration-300",
                    isCollapsed ? "opacity-0" : "opacity-100"
                  )} />
                )}
              </Link>
            );
          })}
        </div>

        {/* SECCIÓN DE USUARIO - MOBILE Y DESKTOP */}
        <div className={cn(
          "border-t bg-gray-50 transition-all duration-300",
          isCollapsed && !isMobileOpen ? "p-2" : "p-4"
        )}>
          {isAuthenticated ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center w-full rounded-lg transition-all duration-200 hover:bg-gray-100 group",
                    isCollapsed && !isMobileOpen ? "justify-center p-2" : "gap-3 p-2"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "rounded-full bg-linear-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white shadow-sm shrink-0 transition-all duration-300",
                    isCollapsed && !isMobileOpen ? "h-9 w-9" : "h-10 w-10"
                  )}>
                    <User size={isCollapsed && !isMobileOpen ? 18 : 20} />
                  </div>
                  {/* Info del usuario */}
                  <div className={cn(
                    "flex flex-col flex-1 min-w-0 text-left transition-all duration-300",
                    isCollapsed && !isMobileOpen ? "w-0 opacity-0 hidden" : "opacity-100"
                  )}>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {user?.name || "Usuario"}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{user?.email}</span>
                  </div>
                  {/* Chevron */}
                  <ChevronUp 
                    size={16} 
                    className={cn(
                      "text-gray-400 group-hover:text-cyan-600 transition-all shrink-0",
                      isCollapsed && !isMobileOpen ? "hidden" : "block"
                    )} 
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align={isCollapsed && !isMobileOpen ? "center" : "start"}
                className="w-56 p-2"
              >
                <div className="flex flex-col gap-1">
                  {/* Info del usuario en el popover */}
                  <div className="px-2 py-2 border-b mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "Usuario"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  
                  {/* Botón de Configuración */}
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      setSettingsOpen(true);
                    }}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 p-2 rounded-md transition-all w-full"
                  >
                    <Settings size={16} />
                    <span className="font-medium">Configuración de cuenta</span>
                  </button>
                  
                  {/* Botón de Cerrar Sesión */}
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 p-2 rounded-md w-full transition-all"
                  >
                    <LogOut size={16} />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className={cn(
              "flex flex-col",
              isCollapsed && !isMobileOpen ? "gap-2 items-center" : "gap-2"
            )}>
              <Link
                href="/auth/login"
                onClick={closeMobileMenu}
                title={isCollapsed && !isMobileOpen ? "Iniciar Sesión" : ""}
                className={cn(
                  "flex items-center text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-all",
                  isCollapsed && !isMobileOpen ? "justify-center p-2" : "gap-3 p-2.5"
                )}
              >
                <LogIn size={20} className="shrink-0" />
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap transition-all duration-300",
                  isCollapsed && !isMobileOpen ? "w-0 opacity-0 hidden" : "opacity-100"
                )}>
                  Iniciar Sesión
                </span>
              </Link>
              <Link
                href="/auth/register"
                onClick={closeMobileMenu}
                title={isCollapsed && !isMobileOpen ? "Registrarse" : ""}
                className={cn(
                  "flex items-center text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-all",
                  isCollapsed && !isMobileOpen ? "justify-center p-2" : "gap-3 p-2.5"
                )}
              >
                <UserPlus size={20} className="shrink-0" />
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap transition-all duration-300",
                  isCollapsed && !isMobileOpen ? "w-0 opacity-0 hidden" : "opacity-100"
                )}>
                  Registrarse
                </span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Modal de configuración */}
      <UserSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-slate-50 transition-all duration-300 flex flex-col relative">
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
