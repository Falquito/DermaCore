'use client'

import { TrendingUp } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TendenciasCrecimientoTabProps {
  // Aquí irán las props necesarias cuando se implementen los indicadores
}

export default function TendenciasCrecimientoTab({}: TendenciasCrecimientoTabProps) {
  // TODO: Aquí irán los indicadores de tendencias y crecimiento de demanda
  
  return (
    <>
      {/* Placeholder para indicadores de tendencias */}
      <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-8 shadow-sm">
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Tendencias y Crecimiento de Demanda
          </h3>
          <p className="text-gray-600 mb-4">
            Esta sección mostrará análisis de tendencias y proyecciones de crecimiento.
          </p>

          {/* Información de desarrollo */}
          <div className="mt-8 max-w-2xl mx-auto text-left bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3">💡 Sugerencias de indicadores:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Evolución mensual de consultas por especialidad</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Comparación año a año de volumen de atención</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Proyección de demanda basada en tendencias históricas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Tasa de crecimiento de pacientes nuevos vs. recurrentes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Análisis de estacionalidad en consultas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Crecimiento por obra social y su impacto en la demanda</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
