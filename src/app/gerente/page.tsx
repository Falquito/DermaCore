"use client";

import { useState } from 'react';
import GerenciaSidebar from '@/components/ui/gerencia-sidebar';
import GerenciaTopbar from '@/components/ui/gerencia-topbar';
import { Construction, Clock, Wrench } from 'lucide-react';

export default function GerentePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <GerenciaSidebar 
        userRole="GERENTE" 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <GerenciaTopbar 
          userName="Administrador"
          userEmail="admin@carelink.com"
        />
        
        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Construction Message */}
            <div className="text-center py-16">
              <div className="mb-8">
                <Construction className="mx-auto h-24 w-24 text-emerald-500" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                En Construcción
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                El módulo de Gerencia está siendo desarrollado
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5" />
                  Funcionalidades en Desarrollo
                </h2>
                <div className="space-y-2 text-emerald-700">
                  <p>• Dashboard ejecutivo con KPIs</p>
                  <p>• Gestión de usuarios y roles</p>
                  <p>• Reportes y análisis</p>
                  <p>• Auditoría del sistema</p>
                  <p>• Configuración organizacional</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <Wrench className="h-5 w-5" />
                <span className="text-lg font-medium">
                  Pronto disponible
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
