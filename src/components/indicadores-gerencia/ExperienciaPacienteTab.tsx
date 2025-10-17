'use client'

import React, { Fragment, useEffect, useState, useCallback } from 'react'
import { Pie, Bar, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  RadarController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Loader2, Plus, X, Activity, Clock, Users, BarChart3, Target, Percent } from 'lucide-react'
import type { TooltipItem, ScriptableContext, ChartOptions, PointStyle } from 'chart.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  RadarController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
)

/* ========= Tipos ========= */
interface EspecialidadData {
  nombre: string
  total: number
}

interface EdadReportData {
  rango: string
  total: number
}

interface ObraSocialRow {
  obraSocial: string
  cantidadPacientes: number
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
  onApplyPreset: (preset: string) => void
}

interface PatientDto {
  id: string
  nombre: string
  apellido: string
  dni: string | null
}

interface ApiRow {
  obraSocialId?: string | null
  obraSocial: string
  cantidadPacientes: number
  pacientes: PatientDto[]
}

interface DistBarDataset {
  data: number[]
  backgroundColor: string[]
  borderColor?: string[]
  borderWidth?: number
}

interface DistBarChartData {
  labels: string[]
  datasets: DistBarDataset[]
}

/* palette */
const PIE_COLORS = [
  '#2563EB','#059669','#D97706','#DC2626','#7C3AED','#0EA5E9',
  '#65A30D','#EA580C','#BE185D','#374151','#14B8A6','#A855F7',
  '#EF4444','#22C55E','#F59E0B','#3B82F6','#8B5CF6','#06B6D4',
]

const generateColors = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => PIE_COLORS[i % PIE_COLORS.length])

const hexToRgba = (hex: string, alpha = 1) => {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const transparentize = (hex: string, alpha = 0.5) => hexToRgba(hex, alpha)

const formatDateAR = (iso: string): string => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const NoData = ({ text, onQuick }: { text: string; onQuick: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <p className="text-gray-500 text-center mb-4 text-base">{text}</p>
    <Button variant="outline" size="sm" onClick={onQuick}>
      Ver último mes
    </Button>
  </div>
)

// Componente para métricas con animaciones (igual que TendenciasCrecimientoTab)
interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  subtitle?: string
  Icon: React.ComponentType<{ className?: string }>
  delay?: number
}

const MetricCard = ({ title, value, change, subtitle, Icon, delay = 0 }: MetricCardProps) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const changeColor = change && change > 0 ? 'text-emerald-600' : change && change < 0 ? 'text-red-500' : 'text-gray-500'
  const changeBg = change && change > 0 ? 'bg-emerald-50' : change && change < 0 ? 'bg-red-50' : 'bg-gray-50'

  return (
    <div 
      className={`
        rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 
        p-6 shadow-sm hover:shadow-lg transition-all duration-500 hover:border-emerald-200
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
                {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change).toFixed(1)}%
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [loadingObras, setLoadingObras] = useState<boolean>(false)
  const [, setObrasRows] = useState<ObraSocialRow[] | null>(null)
  const [obraChartData, setObraChartData] = useState<{
    labels: string[]
    datasets: Array<{ data: number[]; backgroundColor: string[] }>
  } | null>(null)

  // modal para ampliar el gráfico
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (!dateFrom || !dateTo) {
      setObrasRows(null)
      setObraChartData(null)
      return
    }

    let mounted = true
    setLoadingObras(true)

    fetch('/api/reportes/obra-sociales/paciente-por-obra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: dateFrom, endDate: dateTo }),
    })
      .then(async (res) => {
        if (!mounted) return
        const json = await res.json()
        if (!res.ok) {
          console.error('Reporte obras sociales error:', json)
          setObrasRows(null)
          setObraChartData(null)
          return
        }
        if (!Array.isArray(json)) {
          setObrasRows(null)
          setObraChartData(null)
          return
        }

        const rowsApi = json as ApiRow[]

        const merged = new Map<string, { label: string; count: number }>()
        for (const r of rowsApi) {
          const rawLabel = String(r.obraSocial ?? 'Particular').trim()
          const key = rawLabel.toLowerCase()
          const count = Number(r.cantidadPacientes) || 0
          const entry = merged.get(key)
          if (entry) {
            entry.count += count
          } else {
            merged.set(key, { label: rawLabel, count })
          }
        }

        const mergedArr = Array.from(merged.values()).sort((a, b) => b.count - a.count)
        setObrasRows(mergedArr.map(m => ({ obraSocial: m.label, cantidadPacientes: m.count })))

        const labels = mergedArr.map(m => m.label)
        const data = mergedArr.map(m => m.count)
        const colors = generateColors(labels.length)
        const bg = colors.map((c) => transparentize(c, 0.18))
        setObraChartData({ labels, datasets: [{ data, backgroundColor: bg }] })
      })
      .catch((err) => {
        console.error('Fetch obras sociales falló', err)
        if (mounted) {
          setObrasRows(null)
          setObraChartData(null)
        }
      })
      .finally(() => { if (mounted) setLoadingObras(false) })

    return () => { mounted = false }
  }, [dateFrom, dateTo])

  /* --- Radar helpers typed correctamente (sin any) --- */
  function getLineColor(ctx: ScriptableContext<'radar'>): string {
    const idx = ctx.datasetIndex ?? 0
    return generateColors(Math.max(1, idx + 1))[idx] ?? PIE_COLORS[0]
  }

  function alternatePointStyles(ctx: ScriptableContext<'radar'>): PointStyle {
    const index = ctx.dataIndex ?? 0
    return (index % 2 === 0 ? 'circle' : 'rect') as PointStyle
  }

  function makeHalfAsOpaque(ctx: ScriptableContext<'radar'>): string {
    const c = getLineColor(ctx)
    return transparentize(c, 0.5)
  }

  function make20PercentOpaque(ctx: ScriptableContext<'radar'>): string {
    const c = getLineColor(ctx)
    return transparentize(c, 0.2)
  }

  function adjustRadiusBasedOnData(ctx: ScriptableContext<'radar'>): number {
    const v = Number(ctx.raw ?? 0)
    return v < 10 ? 5
      : v < 25 ? 7
      : v < 50 ? 9
      : v < 75 ? 11
      : 15
  }

  const radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 8 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      title: { display: true, text: 'Distribución por Obras Sociales (radar)' },
    },
    elements: {
      line: {
        backgroundColor: make20PercentOpaque,
        borderColor: getLineColor,
        borderWidth: 2,
      },
      point: {
        backgroundColor: getLineColor,
        hoverBackgroundColor: makeHalfAsOpaque,
        radius: adjustRadiusBasedOnData,
        pointStyle: alternatePointStyles,
        hoverRadius: 14,
      },
    },
    scales: {
      r: {
        min: 0,
        pointLabels: {
          font: { size: 12 },
        },
      },
    },
  }

  const radarData = obraChartData
    ? {
        labels: obraChartData.labels,
        datasets: [
          {
            label: 'Pacientes únicos',
            data: obraChartData.datasets[0].data,
            backgroundColor: obraChartData.datasets[0].backgroundColor,
            borderColor: generateColors(1)[0],
            borderWidth: 1,
            pointBackgroundColor: generateColors(obraChartData.labels.length),
          },
        ],
      }
    : { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] }

  // --- Distribución Horaria (HU 39) ---
  type DistribRow = { hour: number; count: number }

  const [distLoading, setDistLoading] = useState<boolean>(false)
  const [distData, setDistData] = useState<DistBarChartData | null>(null)

  // Inicializar con dateFrom o fecha actual si no está disponible
  const [distDate, setDistDate] = useState<string>(() => {
    if (dateFrom) return dateFrom
    // Si no hay dateFrom, usar la fecha actual
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [distEspecialidad, setDistEspecialidad] = useState<string>('Todas')
  const [distDuracion, setDistDuracion] = useState<string>('cualquiera')

  // --- Estados de Citas (HU 37) ---
  interface AppointmentStatusData {
    totals: {
      COMPLETADO: number
      CANCELADO: number
      NO_ASISTIO: number
    }
    totalAppointments: number
    ausentismoRate: number
  }

  const [statusLoading, setStatusLoading] = useState<boolean>(false)
  const [statusData, setStatusData] = useState<AppointmentStatusData | null>(null)
  const [statusEspecialidad, setStatusEspecialidad] = useState<string>('Todas')

  useEffect(() => {
    // Actualizar distDate cuando cambie dateFrom, pero solo si dateFrom no está vacío
    if (dateFrom && dateFrom !== distDate) {
      console.log('Updating distDate from dateFrom', { dateFrom, currentDistDate: distDate })
      setDistDate(dateFrom)
    }
  }, [dateFrom, distDate])

  const fetchDistribucion = useCallback(async () => {
    if (!distDate) {
      console.log('fetchDistribucion: No distDate provided', { distDate })
      return
    }
    
    console.log('fetchDistribucion: Starting fetch', { 
      distDate, 
      distEspecialidad, 
      distDuracion 
    })
    
    setDistLoading(true)
    try {
      const body = {
        date: distDate,
        especialidad: distEspecialidad === 'Todas' ? null : distEspecialidad,
        duracion: distDuracion,
      }
      
      console.log('fetchDistribucion: Request body', body)
      
      const res = await fetch('/api/reportes/distribucion-horaria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      console.log('fetchDistribucion: Response status', res.status)
      
      if (!res.ok) {
        console.error('fetchDistribucion: Response not ok', {
          status: res.status,
          statusText: res.statusText
        })
        setDistData(null)
        return
      }
      const json = await res.json() as DistribRow[]
      console.log('fetchDistribucion: Response data', json)
      
      const startHour = 8
      const endHour = 18
      const labels = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
        const h = startHour + i
        return `${String(h).padStart(2,'0')}:00`
      })
      const counts = labels.map((_, idx) => {
        const hour = startHour + idx
        const found = json.find(r => r.hour === hour)
        return found ? Number(found.count) : 0
      })
      const colors = labels.map((_, i) => PIE_COLORS[i % PIE_COLORS.length])
      const bg = colors.map(c => transparentize(c, 0.9))
      const borders = labels.map(() => '#000000')
      
      const chartData = {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: bg,
          borderColor: borders,
          borderWidth: 1.5,
        }],
      }
      
      console.log('fetchDistribucion: Chart data prepared', { chartData, counts })
      setDistData(chartData)
    } catch (err) {
      console.error('fetchDistribucion: Error', err)
      setDistData(null)
    } finally {
      setDistLoading(false)
    }
  }, [distDate, distEspecialidad, distDuracion])

  useEffect(() => {
    console.log('useEffect triggered for fetchDistribucion', { 
      distDate, 
      distEspecialidad, 
      distDuracion,
      hasDistDate: !!distDate 
    })
    if (distDate) {
      void fetchDistribucion()
    }
  }, [distDate, distEspecialidad, distDuracion, fetchDistribucion])

  // --- Fetch Estados de Citas (HU 37) ---
  const fetchAppointmentStatus = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setStatusLoading(true)
    try {
      const body = {
        startDate: dateFrom,
        endDate: dateTo,
        especialidad: statusEspecialidad === 'Todas' ? null : statusEspecialidad,
        obraSocial: null,
      }
      const res = await fetch('/api/reportes/appointment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setStatusData(null)
        return
      }
      const json = await res.json()
      setStatusData(json)
    } catch (err) {
      console.error('Error estados de citas', err)
      setStatusData(null)
    } finally {
      setStatusLoading(false)
    }
  }, [dateFrom, dateTo, statusEspecialidad])

  useEffect(() => {
    void fetchAppointmentStatus()
  }, [fetchAppointmentStatus])

  // Calcular métricas clave
  const totalConsultas = especialidades.reduce((sum, esp) => sum + esp.total, 0)
  
  // Calcular tasa de asistencia basada en statusData
  const tasaAsistencia = statusData 
    ? statusData.totalAppointments > 0 
      ? ((statusData.totals.COMPLETADO * 100) / statusData.totalAppointments)
      : 0
    : 0

  // Calcular total de obras sociales únicas
  const totalObrasSociales = obraChartData ? obraChartData.labels.length : 0

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-lg text-gray-600">Cargando análisis de experiencia del paciente...</span>
          </div>
        </div>
      ) : (
        <Fragment>
          {/* Header con información del período */}
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-emerald-800 mb-2">Experiencia del Paciente</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📊 Análisis integral de la atención y demografía</p>
                  <p>📅 Período: {formatDateAR(dateFrom)} → {formatDateAR(dateTo)}</p>
                  <p>🏥 Distribución por especialidades, edades y obras sociales</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Resumen del Período</div>
                <div className="flex flex-wrap gap-1 justify-end">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                    {totalConsultas} consultas
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {tasaAsistencia.toFixed(1)}% asistencia
                  </span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                    {totalObrasSociales} coberturas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Consultas"
              value={totalConsultas}
              subtitle="En el período seleccionado"
              Icon={BarChart3}
              delay={0}
            />
            
            <MetricCard
              title="Tasa de Asistencia"
              value={`${tasaAsistencia.toFixed(1)}%`}
              subtitle={statusData ? `${statusData.totals.COMPLETADO} de ${statusData.totalAppointments} citas` : "Calculando..."}
              Icon={Percent}
              delay={100}
            />
            
            <MetricCard
              title="Cobertura Médica"
              value={`${totalObrasSociales} obras sociales`}
              subtitle={obraChartData && obraChartData.labels.length > 0 ? `Incluyendo ${obraChartData.labels[0]}` : "Analizando cobertura"}
              Icon={Target}
              delay={200}
            />
          </div>

          {/* SECCIÓN 1: Gráficos principales con Cards */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PASTEL - Consultas por Especialidad */}
            <Card className="rounded-3xl border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-3 text-emerald-800">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Consultas por Especialidad</div>
                    <div className="text-sm font-normal text-gray-600">
                      Distribución de atención médica especializada
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                            labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
                          },
                          tooltip: {
                            titleFont: { size: 14 },
                            bodyFont: { size: 13 },
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
                  <NoData text="No hay consultas por especialidad para el período seleccionado." onQuick={() => onApplyPreset('ultimo_mes')} />
                )}
              </CardContent>
            </Card>

            {/* BARRAS - Distribución Etaria */}
            <Card className="rounded-3xl border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-3 text-blue-800">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold">Distribución Demográfica</div>
                    <div className="text-sm font-normal text-gray-600">
                      Rango mínimo 1 año, máximo 100 años
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onEditRangos}>Editar rangos</Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onAgregarRango} disabled={addDisabled}>
                      <Plus className="h-4 w-4 mr-1" /> Agregar rango
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {edadData.length > 0 ? (
                  <div className="h-96">
                    <Bar 
                      data={edadBarChart} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            titleFont: { size: 14 },
                            bodyFont: { size: 13 },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, font: { size: 12 } },
                            title: { display: true, text: 'Cantidad', font: { size: 14 } },
                          },
                          x: {
                            ticks: { font: { size: 12 } },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <NoData text="No hay pacientes por rango etario en este período." onQuick={() => onApplyPreset('ultimo_mes')} />
                )}
              </CardContent>
            </Card>
          </section>

          {/* SECCIÓN 2: Distribución Horaria y Obras Sociales con Cards */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución Horaria */}
            <Card className="rounded-3xl border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="flex items-center gap-3 text-purple-800">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Distribución Horaria</div>
                    <div className="text-sm font-normal text-gray-600">
                      Carga de citas por franja horaria
                    </div>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  <input
                    type="date"
                    value={distDate}
                    onChange={(e) => setDistDate(e.target.value)}
                    className="border rounded p-1.5 text-sm"
                  />
                  <select value={distEspecialidad} onChange={(e) => setDistEspecialidad(e.target.value)} className="border rounded p-1.5 text-sm">
                    <option>Todas</option>
                    {especialidades.map((s) => <option key={s.nombre}>{s.nombre}</option>)}
                  </select>
                  <select value={distDuracion} onChange={(e) => setDistDuracion(e.target.value)} className="border rounded p-1.5 text-sm">
                    <option value="cualquiera">Cualquier duración</option>
                    <option value="<=15">≤ 15 min</option>
                    <option value="<=30">≤ 30 min</option>
                    <option value=">30">&gt; 30 min</option>
                  </select>
                  <Button size="sm" onClick={fetchDistribucion}>Generar</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {distLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : distData ? (
                  <div className="h-96">
                    <Bar
                      data={distData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            titleFont: { size: 14 },
                            bodyFont: { size: 13 },
                            callbacks: {
                              label: (ctx) => {
                                const value = Number(ctx.raw) || 0
                                return `${value} turnos`
                              },
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { font: { size: 12 } },
                            title: { display: true, text: 'Cantidad de Citas', font: { size: 14 } },
                          },
                          x: {
                            ticks: { font: { size: 12 } },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-center mb-4 text-base">
                      {!distDate 
                        ? "Selecciona una fecha para ver la distribución horaria" 
                        : "No hay datos de distribución horaria para esta selección"}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDistDate(dateFrom || new Date().toISOString().split('T')[0])}>
                        Usar fecha del período
                      </Button>
                      <Button variant="outline" size="sm" onClick={fetchDistribucion}>
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Obras Sociales */}
            <Card className="rounded-3xl border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100">
                <CardTitle className="flex items-center gap-3 text-orange-800">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold">Distribución por Obra Social</div>
                    <div className="text-sm font-normal text-gray-600">
                      Análisis de cobertura médica
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>Ampliar</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingObras ? (
                  <div className="h-96 flex items-center justify-center">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : obraChartData && obraChartData.labels.length ? (
                  <div className="h-96">
                    <Radar data={radarData} options={radarOptions} />
                  </div>
                ) : (
                  <NoData text="No se encontraron obras sociales en el periodo seleccionado" onQuick={() => onApplyPreset('ultimo_mes')} />
                )}
              </CardContent>
            </Card>
          </section>

          {/* SECCIÓN 3: Estados de Citas con Card mejorado */}
          <Card className="rounded-3xl border-teal-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
              <CardTitle className="flex items-center gap-3 text-teal-800">
                <div className="p-2 rounded-lg bg-teal-100">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold">Estados de Citas</div>
                  <div className="text-sm font-normal text-gray-600">
                    Análisis de completados, cancelados y ausentismo
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={statusEspecialidad} 
                    onChange={(e) => setStatusEspecialidad(e.target.value)} 
                    className="border rounded p-1.5 text-sm"
                  >
                    <option>Todas</option>
                    {especialidades.map((s) => <option key={s.nombre}>{s.nombre}</option>)}
                  </select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {statusLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin" />
                </div>
              ) : statusData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de dona */}
                  <div className="h-96">
                    <Pie
                      data={{
                        labels: ['Completado', 'Cancelado', 'No Asistió'],
                        datasets: [{
                          data: [
                            statusData.totals.COMPLETADO,
                            statusData.totals.CANCELADO,
                            statusData.totals.NO_ASISTIO,
                          ],
                          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                          borderColor: '#fff',
                          borderWidth: 2,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
                          },
                          tooltip: {
                            titleFont: { size: 14 },
                            bodyFont: { size: 13 },
                            callbacks: {
                              label: (ctx: TooltipItem<'pie'>) => {
                                const value = Number(ctx.raw)
                                const pct = statusData.totalAppointments 
                                  ? (value * 100) / statusData.totalAppointments 
                                  : 0
                                return `${ctx.label}: ${value} (${pct.toFixed(1)}%)`
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Métricas clave */}
                  <div className="flex flex-col justify-center gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                      <p className="text-sm text-gray-600 mb-1">Total de Citas</p>
                      <p className="text-3xl font-bold text-gray-900">{statusData.totalAppointments}</p>
                      <p className="text-xs text-gray-500 mt-1">Periodo: {formatDateAR(dateFrom)} → {formatDateAR(dateTo)}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Completadas</p>
                      <p className="text-3xl font-bold text-green-700">{statusData.totals.COMPLETADO}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {statusData.totalAppointments 
                          ? ((statusData.totals.COMPLETADO * 100) / statusData.totalAppointments).toFixed(1)
                          : '0.0'}% del total
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
                      <p className="text-sm text-gray-600 mb-1">Tasa de Ausentismo</p>
                      <p className="text-3xl font-bold text-red-700">{statusData.ausentismoRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {statusData.totals.NO_ASISTIO} pacientes no asistieron
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <NoData 
                  text="No hay datos de estados de citas para el periodo seleccionado" 
                  onQuick={() => onApplyPreset('ultimo_mes')} 
                />
              )}
            </CardContent>
          </Card>

          {/* Modal ampliado */}
          {modalOpen && obraChartData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
              <div className="relative w-[95vw] max-w-4xl h-[80vh] bg-white rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Obras Sociales — detalle</h3>
                  <button className="p-1 rounded hover:bg-gray-100" onClick={() => setModalOpen(false)} aria-label="Cerrar">
                    <X />
                  </button>
                </div>
                <div className="h-full">
                  <Radar data={radarData} options={{ ...radarOptions, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>
          )}
        </Fragment>
      )}
    </div>
  )
}