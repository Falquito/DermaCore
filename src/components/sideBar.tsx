"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Users, ChevronLeft, ChevronRight, IdCard, X, LogOut, LogIn, UserPlus, User, Home } from "lucide-react";
import { Footer } from "@/components/footer";
import { useSession, signOut } from "next-auth/react";
import { useSidebarContext } from "@/components/ui/sidebar-context"; // Importamos el hook

const MENU_ITEMS = [
    { name: "Inicio", url: "/", icon: Home },
  { name: "Pacientes", url: "/pacientes", icon: Users },
  { name: "Obras Sociales", url: "/obras-sociales", icon: IdCard },
];

interface SideBarProps {
  children: React.ReactNode;
}

export default function SideBar({ children }: SideBarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Usamos el contexto en lugar de un estado local para el mobile
  const { isMobileOpen, closeMobileMenu } = useSidebarContext();
  
  // Estado local SOLO para el colapso en Desktop
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        className={cn(
            // 1. CLASES BASE (Posicionamiento y Flex)
            "fixed left-0 z-50 flex flex-col border-r bg-white transition-transform duration-300 ease-in-out",

            // 2. CORRECCIÓN MOBILE:
            // En lugar de h-full, le decimos: "Empieza en el top-16 (debajo del header) y termina en bottom-0 (final de pantalla)"
            // Esto obliga al contenedor a tener la altura exacta disponible, permitiendo que el scroll interno funcione.
            "top-16 bottom-0", 
            
            // 3. RESET DESKTOP:
            // En PC, quitamos el anclaje top/bottom y dejamos que se comporte normal
            "md:relative md:top-0 md:bottom-auto md:h-full",

            // 4. LÓGICA DE APERTURA/CIERRE
            isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            
            // 5. ANCHO
            (isCollapsed && !isMobileOpen) ? "md:w-20" : "w-64"
        )}
      >
        {/* CABECERA SIDEBAR MOBILE (Opcional, ya que tenemos botón cerrar) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
            <span className="font-bold text-lg text-cyan-700">Menú</span>
            <button onClick={closeMobileMenu} className="p-1 text-gray-500 hover:bg-gray-100 rounded-md">
                <X size={24} />
            </button>
        </div>

        {/* BOTÓN COLAPSAR DESKTOP */}
        <div className="hidden md:block absolute -right-3 top-6 z-10">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-md hover:bg-gray-100 transition-colors"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </div>

        {/* LINKS */}
        <div className="flex flex-col gap-2 p-4 py-6 overflow-y-auto overflow-x-hidden flex-1">
            {/* ... lógica de items igual ... */}
             <p className={cn("px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2", isCollapsed ? "hidden" : "block")}>Páginas</p>
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
                            "flex items-center py-3 rounded-lg transition-all duration-200 group relative",
                            isCollapsed ? "justify-center px-0" : "px-4 gap-3",
                            isActive ? "bg-cyan-50 text-cyan-700" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Icon size={22} className={cn("flex-shrink-0", isActive ? "text-cyan-600" : "text-gray-500")} />
                        <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-300 font-medium", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                            {tab.name}
                        </span>
                        {isActive && !isCollapsed && <div className="absolute right-0 top-0 h-full w-1 bg-cyan-600 rounded-l-full" />}
                    </Link>
                );
            })}
        </div>

        {/* LOGIN / LOGOUT EN SIDEBAR (SOLO MOBILE) */}
        {/* Usamos md:hidden para que en desktop NO se vea esto duplicado, ya que está en el header */}
        <div className="p-4 border-t bg-gray-50 md:hidden">
            {session ? (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700">
                            <User size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{session.user?.name || "Usuario"}</span>
                            <span className="text-xs text-gray-500 truncate max-w-[140px]">{session.user?.email}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/auth/login' })}
                        className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded-md w-full"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <Link href="/auth/login" className="flex items-center gap-3 text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 p-2 rounded-md">
                        <LogIn size={20} />
                        <span className="text-sm font-medium">Iniciar Sesión</span>
                    </Link>
                    <Link href="/auth/register" className="flex items-center gap-3 text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 p-2 rounded-md">
                        <UserPlus size={20} />
                        <span className="text-sm font-medium">Registrarse</span>
                    </Link>
                </div>
            )}
        </div>
        
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-slate-50 transition-all duration-300 flex flex-col relative">
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            {children}
        </div>
        <Footer />
      </main>

    </div>
  );
}