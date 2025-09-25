"use client";
import React, { useState } from "react";
import ProfesionalSidebar from '@/components/ui/profesional-sidebar';
import ProfesionalTopbar from '@/components/ui/profesional-topbar';

export default function ConsultaPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ProfesionalSidebar 
        userRole="PROFESIONAL" 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <ProfesionalTopbar 
          userName="Dr. Profesional"
          userEmail="doctor@carelink.com"
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        <main className="p-8">
          <h1 className="text-2xl font-bold mb-4">Consulta</h1>
          <p>Aquí podrás agregar observaciones y finalizar la consulta. (Placeholder)</p>
        </main>
      </div>
    </div>
  );
}
