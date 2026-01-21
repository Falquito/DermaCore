import Link from "next/link";
import { Users, IdCard, ArrowRight, Activity, Calendar, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">¡Bienvenido a Dermacor!</h1>
        <p className="text-cyan-100 text-lg">
          Sistema de gestión para consultorios dermatológicos
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/pacientes"
          className="group bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-50 rounded-lg group-hover:bg-cyan-100 transition-colors">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                Pacientes
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h2>
              <p className="text-gray-500 text-sm">
                Gestiona la información de tus pacientes, historial de consultas y datos de contacto.
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/obras-sociales"
          className="group bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <IdCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                Obras Sociales
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h2>
              <p className="text-gray-500 text-sm">
                Administra las obras sociales y prepagas con las que trabajas.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Características */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Características del sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Activity className="w-5 h-5 text-cyan-600" />
            <span className="text-sm text-gray-700">Historial de consultas</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-cyan-600" />
            <span className="text-sm text-gray-700">Registro de fechas</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-cyan-600" />
            <span className="text-sm text-gray-700">Datos seguros</span>
          </div>
        </div>
      </div>
    </div>
  );
}