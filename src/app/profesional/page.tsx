"use client";

import { Construction, Clock, Wrench } from 'lucide-react';

export default function ProfesionalPage() {
  return (
    <main className="flex-1 p-5 md:p-8">
      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          {/* Icono */}
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <Construction className="w-10 h-10 text-orange-600" />
          </div>
          
          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Módulo en Desarrollo
          </h1>
          
          {/* Descripción */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            El área de trabajo para profesionales está siendo desarrollada. 
            Pronto tendrá acceso a todas las herramientas para gestionar sus pacientes, 
            historias clínicas, prescripciones y más.
          </p>
          
          {/* Features próximas */}
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="text-center p-4">
              <Clock className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-gray-900 mb-2">Agenda</h3>
              <p className="text-sm text-gray-600">
                Gestión de turnos y horarios de atención
              </p>
            </div>
            
            <div className="text-center p-4">
              <Wrench className="w-8 h-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold text-gray-900 mb-2">Herramientas</h3>
              <p className="text-sm text-gray-600">
                Prescripciones, estudios e informes médicos
              </p>
            </div>
            
            <div className="text-center p-4">
              <Construction className="w-8 h-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold text-gray-900 mb-2">Historias</h3>
              <p className="text-sm text-gray-600">
                Acceso completo a historias clínicas
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
