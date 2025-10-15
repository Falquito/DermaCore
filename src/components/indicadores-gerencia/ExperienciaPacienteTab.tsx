'use client'

import { Fragment } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import { Loader2, Plus } from 'lucide-react'
import type { TooltipItem } from 'chart.js'
import { Button } from '@/components/ui/button'

/* ========= Tipos ========= */
interface EspecialidadData {
  nombre: string
  total: number
}

interface EdadReportData {
  rango: string
  total: number
}

interface ExperienciaPacienteTabProps {
  loading: boolean
  especialidades: EspecialidadData[]
  edadData: EdadReportData[]
  dateFrom: string
  dateTo: string
  especialidadChart: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor: string[]
      borderWidth: number
    }>
  }
  edadBarChart: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor: string[]
      borderWidth: number
    }>
  }
  addDisabled: boolean
  onEditRangos: () => void
  onAgregarRango: () => void
  onApplyPreset: (preset: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
}

const formatDateAR = (iso: string): string => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const NoData = ({ text, onQuick }: { text: string; onQuick: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <p className="text-gray-500 text-center mb-4">{text}</p>
    <Button variant="outline" size="sm" onClick={onQuick}>
      Ver último mes
    </Button>
  </div>
)

export default function ExperienciaPacienteTab({
  loading,
  especialidades,
  edadData,
  dateFrom,
  dateTo,
  especialidadChart,
  edadBarChart,
  addDisabled,
  onEditRangos,
  onAgregarRango,
  onApplyPreset,
}: ExperienciaPacienteTabProps) {
  return (
    <>
      {loading ? (
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Cargando reportes...</span>
          </div>
        </div>
      ) : (
        <Fragment>
          {/* CHARTS side-by-side, MISMO ALTO */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PASTEL - Consultas por Especialidad */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900">Consultas por Especialidad</h2>
              <p className="text-sm text-gray-500 mb-4">
                Periodo: {formatDateAR(dateFrom)} → {formatDateAR(dateTo)}
              </p>

              {especialidades.length > 0 ? (
                <div className="h-96">
                  <Pie
                    data={especialidadChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { usePointStyle: true, pointStyle: 'circle' },
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx: TooltipItem<'pie'>) => {
                              const ds = ctx.dataset.data as number[]
                              const total = ds.reduce((a, b) => a + (b as number), 0)
                              const value = Number(ctx.raw)
                              const pct = total ? (value * 100) / total : 0
                              return `${ctx.label}: ${value} (${pct.toFixed(1)}%)`
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <NoData
                  text="No hay consultas por especialidad para el período seleccionado. Probá ajustar los filtros o usar un acceso rápido."
                  onQuick={() => onApplyPreset('ultimo_mes')}
                />
              )}
            </div>

            {/* BARRAS - Distribución Etaria */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Distribución Etaria</h2>
                  <p className="text-sm text-gray-500">Rango mínimo 1 año, máximo 100 años</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onEditRangos}>
                    Editar rangos
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={onAgregarRango}
                    disabled={addDisabled}
                    title={addDisabled ? 'No se puede agregar más' : 'Agregar un nuevo rango'}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Agregar rango
                  </Button>
                </div>
              </div>

              {edadData.length > 0 ? (
                <div className="h-96">
                  <Bar
                    data={edadBarChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                    }}
                  />
                </div>
              ) : (
                <NoData
                  text="No hay pacientes por rango etario en este período. Cambiá el rango de fechas o los rangos etarios."
                  onQuick={() => onApplyPreset('ultimo_mes')}
                />
              )}
            </div>
          </section>
        </Fragment>
      )}
    </>
  )
}
