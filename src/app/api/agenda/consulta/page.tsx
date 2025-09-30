"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ProfesionalSidebar from "@/components/ui/profesional-sidebar";
import ProfesionalTopbar from "@/components/ui/profesional-topbar";
import ObservacionesEditor from "@/components/ObservacionesEditor";

export default function ConsultaDesdeAgendaPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const search = useSearchParams();
  const appointmentId = search.get("id") ?? "";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ProfesionalSidebar
        userRole="PROFESIONAL"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <ProfesionalTopbar
          userName="Dr. Profesional"
          userEmail="doctor@carelink.com"
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 border-l-4 border-l-emerald-500">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Consulta</h1>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Aquí podrás agregar observaciones y finalizar la consulta.
            </p>

            {!appointmentId ? (
              <div className="text-sm text-red-600">
                Falta el parámetro <code>id</code> en la URL. Volvé a la{" "}
                <a className="underline text-emerald-700" href="/profesional/agenda">Agenda</a>.
              </div>
            ) : (
              <ObservacionesEditor appointmentId={appointmentId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
