'use client'

import { Users } from 'lucide-react'

type ProfessionalStats = {
  dateRange: {
    from: Date
    to: Date
  }
  totalAppointments: number
  recentAppointments: Array<{
    id: string
    fecha: Date
    paciente: string
    estado: string
    motivo?: string
    obraSocial: string
  }>
  averageDaily: number
}

interface MisPacientesTabProps {
  stats: ProfessionalStats | null
}

export default function MisPacientesTab({ stats }: MisPacientesTabProps) {
  // TODO: Aquí irán los indicadores específicos de pacientes
  // Por ejemplo: distribución por edad, por género, frecuencia de visitas, etc.
  
  return (
    <>
      {/* Placeholder para indicadores de pacientes */}
      <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-8 shadow-sm">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Indicadores de Pacientes</h3>
          <p className="text-gray-600 mb-4">
            Esta sección mostrará métricas detalladas sobre tus pacientes.
          </p>
          
          {/* Información de desarrollo */}
          <div className="mt-8 max-w-2xl mx-auto text-left bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3">💡 Sugerencias de indicadores:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Distribución de pacientes por edad y género</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Frecuencia de visitas (pacientes nuevos vs. recurrentes)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Top 10 pacientes con más consultas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Distribución geográfica de pacientes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Tiempo promedio entre consultas por paciente</span>
              </li>
            </ul>
          </div>

          {/* Datos actuales disponibles */}
          {stats && (
            <div className="mt-6 text-sm text-gray-600">
              <p>Pacientes únicos en el período: <strong className="text-gray-900">
                {stats.recentAppointments ? new Set(stats.recentAppointments.map(a => a.paciente)).size : 0}
              </strong></p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
