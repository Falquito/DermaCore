'use client'

import { useRef } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import { AppointmentStatus } from '@prisma/client'
import { getStatusLabel } from '@/lib/appointment-status'

type ProfessionalStats = {
  dateRange: {
    from: Date
    to: Date
  }
  totalAppointments: number
  statusCounts: Record<AppointmentStatus, number>
  obraSocialPercentages: Array<{
    name: string
    count: number
    percentage: number
  }>
  completionRate: number
  cancellationRate: number
  recentAppointments: Array<{
    id: string
    fecha: Date
    paciente: string
    estado: AppointmentStatus
    motivo?: string
    obraSocial: string
  }>
  averageDaily: number
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PROGRAMADO: '#93C5FD',
  CONFIRMADO: '#5EEAD4',
  EN_SALA_DE_ESPERA: '#FBBF24',
  COMPLETADO: '#22C55E',
  CANCELADO: '#EF4444',
  NO_ASISTIO: '#9CA3AF',
}

// Generate colors for obra social pie chart
const generateColors = (count: number) => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]
  return Array.from({ length: count }, (_, i) => colors[i % colors.length])
}

interface PracticaClinicaTabProps {
  stats: ProfessionalStats | null
  hiddenDatasets: Set<number>
  onToggleDataset: (index: number) => void
  onLegendHover: (index: number) => void
  onLegendLeave: () => void
}

export default function PracticaClinicaTab({
  stats,
  hiddenDatasets,
  onToggleDataset,
  onLegendHover,
  onLegendLeave
}: PracticaClinicaTabProps) {
  const chartRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

  // Prepare chart data
  const obraSocialChartData = stats ? {
    labels: stats.obraSocialPercentages.map(item => item.name),
    datasets: [{
      data: stats.obraSocialPercentages.map((item, index) => 
        hiddenDatasets.has(index) ? 0 : item.percentage
      ),
      backgroundColor: generateColors(stats.obraSocialPercentages.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  } : null

  const statusChartData = stats ? {
    labels: Object.keys(stats.statusCounts).map(status => getStatusLabel(status as AppointmentStatus)),
    datasets: [{
      label: 'Turnos',
      data: Object.values(stats.statusCounts),
      backgroundColor: Object.keys(stats.statusCounts).map(status => STATUS_COLORS[status as AppointmentStatus]),
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Usaremos leyenda personalizada
      },
      tooltip: {
        callbacks: {
          label: function(context: { label: string; parsed: number; dataset: { data: number[] } }) {
            const label = context.label || ''
            const value = context.parsed || 0
            const dataset = context.dataset
            const total = dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          }
        }
      }
    },
    onHover: (event: unknown, elements: unknown[], chart: unknown) => {
      const canvas = (chart as any)?.canvas // eslint-disable-line @typescript-eslint/no-explicit-any
      if (canvas) {
        canvas.style.cursor = (elements as any[]).length > 0 ? 'pointer' : 'default' // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: { label: string; parsed: { y: number } }) {
            return `${context.label}: ${context.parsed.y} turnos`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  return (
    <>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Obra Social Pie Chart */}
        <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Obras Sociales
          </h3>
          {obraSocialChartData && stats?.totalAppointments ? (
            <div className="flex flex-col">
              {/* Chart container - más espacio */}
              <div className="h-56 mb-3">
                <Pie 
                  ref={chartRef}
                  data={obraSocialChartData} 
                  options={chartOptions} 
                />
              </div>
              
              {/* Leyenda personalizada con botones - menos espacio */}
              <div className="flex flex-wrap gap-1 justify-center">
                {stats.obraSocialPercentages.map((item: { name: string; percentage: number }, index: number) => {
                  const isHidden = hiddenDatasets.has(index)
                  const colors = generateColors(stats.obraSocialPercentages.length)
                  const backgroundColor = colors[index]
                  
                  return (
                    <button
                      key={index}
                      onClick={() => onToggleDataset(index)}
                      onMouseEnter={() => onLegendHover(index)}
                      onMouseLeave={onLegendLeave}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        isHidden 
                          ? 'bg-gray-100 text-gray-400 border-gray-200' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:scale-105 shadow-sm'
                      } border`}
                      style={{
                        opacity: isHidden ? 0.5 : 1
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                        style={{ backgroundColor: isHidden ? '#9CA3AF' : backgroundColor }}
                      />
                      <span className="truncate max-w-16">{item.name}</span>
                      <span className="ml-1 text-gray-500">({item.percentage.toFixed(1)}%)</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No hay datos para mostrar</p>
            </div>
          )}
        </div>

        {/* Status Bar Chart */}
        <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estados de turnos
          </h3>
          {statusChartData && stats?.totalAppointments ? (
            <div className="flex-1 min-h-[260px]">
              <Bar data={statusChartData} options={barChartOptions} />
            </div>
          ) : (
            <div className="flex-1 min-h-[200px] flex items-center justify-center text-gray-500">
              <p>No hay datos para mostrar</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
