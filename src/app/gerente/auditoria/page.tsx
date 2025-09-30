"use client";

import { useState } from 'react';
import GerenciaSidebar from '@/components/ui/gerencia-sidebar';
import GerenciaTopbar from '@/components/ui/gerencia-topbar';
import { Construction, Clock, Wrench } from 'lucide-react';

export default function AuditoriaPage() {
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
        <main className="flex-1 flex items-center justify-center p-4 md:p-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 border-l-4 border-l-emerald-500">
              <div className="flex justify-center mb-4">
                <div className="bg-emerald-100 p-4 rounded-full">
                  <Construction className="h-12 w-12 text-emerald-600" />
                </div>
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Auditoría en Construcción
              </h1>
              
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Estamos trabajando en el módulo de auditoría. Esta funcionalidad estará disponible próximamente.
              </p>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-emerald-600" />
                  En desarrollo
                </div>
                <div className="flex items-center">
                  <Wrench className="h-4 w-4 mr-1 text-emerald-600" />
                  Próximamente
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}