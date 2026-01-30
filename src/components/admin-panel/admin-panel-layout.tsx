"use client";

import { Footer } from "@/components/admin-panel/footer";
import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export default function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useSidebar, (x) => x);
  
  // No renderizar hasta que el estado esté hidratado
  if (!sidebar) return null;
  
  const { getOpenState, settings } = sidebar;
  const openState = getOpenState();
  
  return (
    <>
      <Sidebar />
      <main
        className={cn(
          // CAMBIO: Ajustamos el min-h para restar la altura del header (16/4rem) y quizas el footer si tienes
          "min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-900 transition-[margin-left] ease-in-out duration-300",
          !settings.disabled && (!openState ? "lg:ml-[90px]" : "lg:ml-72")
        )}
      >
        {children}
      </main>
      <footer
        className={cn(
          "transition-[margin-left] ease-in-out duration-300",
          !settings.disabled && (!openState ? "lg:ml-[90px]" : "lg:ml-72")
        )}
      >
        <Footer />
      </footer>
    </>
  );
}
