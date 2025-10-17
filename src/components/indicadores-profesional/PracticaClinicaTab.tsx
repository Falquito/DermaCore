'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import type { Chart } from 'chart.js'

import { Pie, Bar, Line } from 'react-chartjs-2'
import { AppointmentStatus } from '@prisma/client'
import { getStatusLabel } from '@/lib/appointment-status'
import type { TooltipItem } from 'chart.js'

// --- Tipos y Constantes (Fuera del componente para evitar re-creación) ---

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
  dailyCounts: Array<{
    date: string // formato 'YYYY-MM-DD'
    count: number
  }>
  // Se asume que la API devuelve los appointments completos para el filtrado
  appointments?: AppointmentForStats[]
}

type AppointmentForStats = {
  id: string
  fecha: string // ISO string
  estado: AppointmentStatus
  tipoConsulta: string
  obraSocial?: { id: string; nombre: string } | null
  paciente: { id: string; nombre: string; apellido: string; fechaNacimiento?: string }
}

interface PracticaClinicaTabProps {
  stats: ProfessionalStats | null
  hiddenDatasets: Set<number>
  onToggleDataset: (index: number) => void
  onLegendHover: (index: number) => void
  onLegendLeave: () => void
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PROGRAMADO: '#93C5FD',
  CONFIRMADO: '#5EEAD4',
  EN_SALA_DE_ESPERA: '#FBBF24',
  COMPLETADO: '#22C55E',
  CANCELADO: '#EF4444',
  NO_ASISTIO: '#9CA3AF',
}

const rangosEtarios = [
  { label: 'Todos', value: '' },
  { label: '0-17 años', value: '0-17' },
  { label: '18-39 años', value: '18-39' },
  { label: '40-64 años', value: '40-64' },
  { label: '65+ años', value: '65+' }
]

const periodoLabelES: Record<string, string> = {
  day: 'día', 
  week: 'semana', 
  month: 'mes', 
  year: 'año',
}

// --- Funciones de Utilidad (Fuera del componente) ---

const generateColors = (count: number) => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]
  return Array.from({ length: count }, (_, i) => colors[i % colors.length])
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function groupCounts(
  data: Array<{ date: string; count: number }>,
  by: 'day' | 'week' | 'month' | 'year'
) {
  const result: Record<string, number> = {}
  if (by === 'day') {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    dias.forEach(dia => { result[dia] = 0 }) // Inicializar para mantener el orden
    for (const item of data) {
      const d = new Date(item.date)
      const key = dias[d.getUTCDay()]
      result[key] = (result[key] || 0) + item.count
    }
    return dias.map(dia => [dia, result[dia]])
  } else {
    for (const item of data) {
      const d = new Date(item.date)
      let key = ''
      if (by === 'week') {
        const year = d.getFullYear()
        const week = getWeekNumber(d)
        key = `${year}-W${String(week).padStart(2, '0')}`
      } else if (by === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      } else if (by === 'year') {
        key = `${d.getFullYear()}`
      }
      result[key] = (result[key] || 0) + item.count
    }
    return Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  }
}

function formatLabel(key: string, groupBy: 'day' | 'week' | 'month' | 'year'): string {
  if (groupBy === 'day') return key
  if (groupBy === 'week') {
    const [year, week] = key.split('-W')
    return `Semana ${week}, ${year}`
  }
  if (groupBy === 'month') {
    const [year, month] = key.split('-')
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    return `${meses[parseInt(month,10)-1]} ${year}`
  }
  return key // para 'year'
}

// --- Componente Principal ---

export default function PracticaClinicaTab({
  stats,
  hiddenDatasets,
  onToggleDataset,
  onLegendHover,
  onLegendLeave
}: PracticaClinicaTabProps) {
  const chartRef = useRef<Chart<'pie', number[], string> | null>(null)

  // --- Estados para los filtros ---
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('')
  const [obraSocialFiltro, setObraSocialFiltro] = useState<string>('')
  const [rangoEtarioFiltro, setRangoEtarioFiltro] = useState<string>('')
  
  const [distribucionRangoEtarioFiltro, setDistribucionRangoEtarioFiltro] = useState<string>('');

  const [hiddenVsParticular, setHiddenVsParticular] = useState(new Set<number>());
  
  const obrasSocialesDisponibles = useMemo(() => {
    if (!stats?.obraSocialPercentages) return [];
    return stats.obraSocialPercentages
      .map(item => item.name)
      .filter(name => name !== 'Particular');
  }, [stats?.obraSocialPercentages]);

  const [selectedVsParticularOS, setSelectedVsParticularOS] = useState<Set<string>>(new Set(obrasSocialesDisponibles));

  useEffect(() => {
    setSelectedVsParticularOS(new Set(obrasSocialesDisponibles));
  }, [obrasSocialesDisponibles]);


  const appointments = stats?.appointments

  // --- Lógica y Datos para Gráfico: Obras Sociales vs Particular (con filtro de selección) ---
  const { totalObraSocial, totalParticular } = useMemo(() => {
    if (!stats?.obraSocialPercentages) {
      return { totalObraSocial: 0, totalParticular: 0 };
    }
    return stats.obraSocialPercentages.reduce(
      (acc, item) => {
        if (item.name === 'Particular') {
          acc.totalParticular += item.count;
        } else if (selectedVsParticularOS.has(item.name)) { 
          acc.totalObraSocial += item.count;
        }
        return acc;
      },
      { totalObraSocial: 0, totalParticular: 0 }
    );
  }, [stats?.obraSocialPercentages, selectedVsParticularOS]); 
  
  const handleToggleVsParticular = (index: number) => {
    setHiddenVsParticular(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleToggleVsParticularOS = (name: string) => {
    setSelectedVsParticularOS(prev => {
        const newSet = new Set(prev);
        if (newSet.has(name)) {
            newSet.delete(name);
        } else {
            newSet.add(name);
        }
        return newSet;
    });
  };

  const obrasVsParticularDataFiltered = useMemo(() => {
    const originalData = [totalObraSocial, totalParticular];
    const originalLabels = ['Obras Sociales', 'Particular'];
    const originalColors = ['#10B981', '#3B82F6'];

    const data = originalData.filter((_, i) => !hiddenVsParticular.has(i));
    const labels = originalLabels.filter((_, i) => !hiddenVsParticular.has(i));
    const backgroundColor = originalColors.filter((_, i) => !hiddenVsParticular.has(i));

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: '#fff',
        borderWidth: 2
      }]
    };
  }, [totalObraSocial, totalParticular, hiddenVsParticular]);

  // --- Lógica y Datos para Gráfico: Distribución de Obras Sociales (con filtro de edad) ---
  const obraSocialChartData = useMemo(() => {
    if (!stats?.appointments) return null;
    
    const filteredAppointments = stats.appointments.filter(a => {
      if (!distribucionRangoEtarioFiltro || !a.paciente?.fechaNacimiento) {
        return true; 
      }
      const edad = new Date().getFullYear() - new Date(a.paciente.fechaNacimiento).getFullYear();
      if (distribucionRangoEtarioFiltro === '0-17') return edad <= 17;
      if (distribucionRangoEtarioFiltro === '18-39') return edad >= 18 && edad <= 39;
      if (distribucionRangoEtarioFiltro === '40-64') return edad >= 40 && edad <= 64;
      if (distribucionRangoEtarioFiltro === '65+') return edad >= 65;
      return true;
    });

    const counts = filteredAppointments.reduce((acc, appointment) => {
      const name = appointment.obraSocial?.nombre || 'Particular';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = filteredAppointments.length;
    if (total === 0) return null;

    const percentages = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: (count / total) * 100,
    })).sort((a,b) => b.count - a.count);

    return {
      labels: percentages.map(item => item.name),
      percentages,
      datasets: [{
        data: percentages.map(item => item.count),
        backgroundColor: generateColors(percentages.length),
        borderColor: '#fff',
        borderWidth: 2,
      }]
    };
  }, [stats?.appointments, distribucionRangoEtarioFiltro]); 
  
  // --- Lógica y Datos para Gráfico de Estados de Turnos (con filtros) ---
  const obrasSocialesUnicas = useMemo(() => {
    if (!appointments) return []
    const nombres = appointments.map(a => a.obraSocial?.nombre || 'Particular')
    const set = new Set(nombres)
    if (!set.has('Particular')) set.add('Particular')
    return Array.from(set)
  }, [appointments])

  const appointmentsEstadosFiltrados = useMemo(() => {
    if (!appointments) return []
    return appointments.filter(a => {
      const obraSocialNombre = a.obraSocial?.nombre || 'Particular'
      let obraSocialOk = true
      if (obraSocialFiltro !== undefined) {
        if (obraSocialFiltro === '') {
          obraSocialOk = true
        } else if (obraSocialFiltro === 'Particular') {
          obraSocialOk = obraSocialNombre === 'Particular'
        } else {
          obraSocialOk = obraSocialNombre === obraSocialFiltro
        }
      }

      let rangoOk = true
      if (rangoEtarioFiltro && a.paciente?.fechaNacimiento) {
        const edad = new Date().getFullYear() - new Date(a.paciente.fechaNacimiento).getFullYear()
        if (rangoEtarioFiltro === '0-17') rangoOk = edad <= 17
        else if (rangoEtarioFiltro === '18-39') rangoOk = edad >= 18 && edad <= 39
        else if (rangoEtarioFiltro === '40-64') rangoOk = edad >= 40 && edad <= 64
        else if (rangoEtarioFiltro === '65+') rangoOk = edad >= 65
      }
      return obraSocialOk && rangoOk
    })
  }, [appointments, obraSocialFiltro, rangoEtarioFiltro])

  const statusCountsFiltrados = useMemo(() => {
    const counts: Record<AppointmentStatus, number> = {
      PROGRAMADO: 0, CONFIRMADO: 0, EN_SALA_DE_ESPERA: 0,
      COMPLETADO: 0, CANCELADO: 0, NO_ASISTIO: 0
    }
    for (const a of appointmentsEstadosFiltrados) {
      counts[a.estado] = (counts[a.estado] || 0) + 1
    }
    return counts
  }, [appointmentsEstadosFiltrados])

  const statusChartDataFiltrado = {
    labels: Object.keys(statusCountsFiltrados).map(status => getStatusLabel(status as AppointmentStatus)),
    datasets: [{
      label: 'Turnos',
      data: Object.values(statusCountsFiltrados),
      backgroundColor: Object.keys(statusCountsFiltrados).map(status => STATUS_COLORS[status as AppointmentStatus]),
    }]
  }

  // --- Lógica y Datos para Gráfico de Consultas por Período (con filtros) ---
  const estadosUnicos = useMemo(() => {
    if (!appointments) return []
    return Array.from(new Set(appointments.map(a => a.estado))).filter(Boolean)
  }, [appointments])

  const appointmentsFiltrados = useMemo(() => {
    if (!appointments) return []
    return appointments.filter(a =>
      (estadoFiltro ? a.estado === estadoFiltro : true) &&
      (tipoFiltro ? a.tipoConsulta === tipoFiltro : true)
    )
  }, [appointments, estadoFiltro, tipoFiltro])

  const dailyCountsFiltrados = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of appointmentsFiltrados) {
      const date = a.fecha.slice(0, 10) // YYYY-MM-DD
      counts[date] = (counts[date] || 0) + 1
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  }, [appointmentsFiltrados])

  const groupedCounts = useMemo(() => {
    return dailyCountsFiltrados.length
      ? groupCounts(dailyCountsFiltrados, groupBy)
      : []
  }, [dailyCountsFiltrados, groupBy]);

  const consultasPorPeriodoChartData = useMemo(() => groupedCounts.length ? {
    labels: groupedCounts.map(([key]) => formatLabel(String(key), groupBy)),
    datasets: [{
      label: `Consultas por ${periodoLabelES[groupBy] || groupBy}`,
      data: groupedCounts.map(([, value]) => value),
      backgroundColor: 'rgba(59,130,246,0.2)',
      borderColor: '#22C55E',
      borderWidth: 2,
      fill: { target: 'origin', above: 'rgba(34,197,94,0.15)' },
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#22C55E',
    }]
  } : null, [groupedCounts, groupBy]);

  // --- Opciones de Gráficos (CON FUENTES AUMENTADAS SIGNIFICATIVAMENTE) ---
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'bottom' as const,
        labels: {
            font: {
                size: 16 // Tamaño de la leyenda
            }
        }
      },
      tooltip: {
        titleFont: {
            size: 16 // Tamaño del título del tooltip
        },
        bodyFont: {
            size: 14 // Tamaño del cuerpo del tooltip
        },
        callbacks: {
          label: function(context: TooltipItem<'pie'>) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return `${label}: ${value} (${percentage}%)`
          }
        }
      }
    }
  }

  const customPieChartOptions = {
    ...pieChartOptions,
    plugins: { ...pieChartOptions.plugins, legend: { display: false } }
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (context: TooltipItem<'bar'>) => `${context.label}: ${context.parsed.y} turnos`
        }
      }
    },
    scales: { 
        y: { 
            beginAtZero: true, 
            ticks: { 
                stepSize: 1,
                font: { size: 14 } // Tamaño de los ticks del eje Y
            } 
        },
        x: {
            ticks: {
                font: { size: 14 } // Tamaño de los ticks del eje X
            }
        }
    }
  }
  
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top' as const,
        labels: {
            font: { size: 16 } // Tamaño de la leyenda
        }
      },
      tooltip: {
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (item: TooltipItem<'line'>) => `${item.dataset.label || ''}: ${item.parsed.y} consultas`
        }
      }
    },
    scales: { 
        y: { 
            beginAtZero: true, 
            ticks: { 
                stepSize: 1,
                font: { size: 14 } // Tamaño de los ticks del eje Y
            } 
        },
        x: {
            ticks: {
                font: { size: 14 } // Tamaño de los ticks del eje X
            }
        }
    }
  }

  // --- Renderizado del Componente ---
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {/* 1. Evolución de Consultas */}
        <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-xl font-semibold text-gray-900">Evolución de Consultas</h3>
            <div className="flex gap-2 flex-wrap">
              <select className="border rounded px-2 py-1 text-base bg-white" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
                <option value="">Todos los tipos</option>
                {(() => {
                  if (!appointments) return null;
                  const tipos = Array.from(new Set(appointments.map(a => a.tipoConsulta))).filter(Boolean);
                  const tipoLabel = (tipo: string) => {
                    if (tipo === 'OBRA_SOCIAL') return 'Obra social';
                    if (tipo === 'PARTICULAR') return 'Particular';
                    return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
                  };
                  return tipos.map(tipo => <option key={tipo} value={tipo}>{tipoLabel(tipo)}</option>);
                })()}
              </select>
              <select className="border rounded px-2 py-1 text-base bg-white" value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}>
                <option value="">Todos los estados</option>
                {estadosUnicos.map(estado => <option key={estado} value={estado}>{getStatusLabel(estado)}</option>)}
              </select>
              <select className="border rounded px-2 py-1 text-base bg-white" value={groupBy} onChange={e => setGroupBy(e.target.value as 'day' | 'week' | 'month' | 'year')}>
                <option value="day">Por Día de Semana</option>
                <option value="week">Por Semana</option>
                <option value="month">Por Mes</option>
                <option value="year">Por Año</option>
              </select>
            </div>
          </div>
          <div className="mb-2 text-base text-gray-600">Cantidad de consultas realizadas a lo largo del tiempo.</div>
          {consultasPorPeriodoChartData && consultasPorPeriodoChartData.datasets[0].data.some(v => typeof v === 'number' && v > 0) ? (
            <div className="h-64">
              <Line data={consultasPorPeriodoChartData} options={lineChartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No hay datos para mostrar con los filtros aplicados</p>
            </div>
          )}
        </div>

        {/* 2. Distribución por Obra Social | Obras Sociales vs Particular */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Distribución por Obra Social */}
          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">Distribución por Obra Social</h3>
              <select className="border rounded px-2 py-1 text-base bg-white mt-2 sm:mt-0" value={distribucionRangoEtarioFiltro} onChange={e => setDistribucionRangoEtarioFiltro(e.target.value)}>
                {rangosEtarios.map(rango => <option key={rango.value} value={rango.value}>{rango.label}</option>)}
              </select>
            </div>
            <div className="mb-4 text-base text-gray-600">Proporción de pacientes por obra social.</div>
            {obraSocialChartData ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-56 w-56 flex-shrink-0">
                  <Pie ref={chartRef} data={obraSocialChartData} options={customPieChartOptions} />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {obraSocialChartData.percentages.map((item, index) => {
                    const isHidden = hiddenDatasets.has(index)
                    const backgroundColor = generateColors(obraSocialChartData.percentages.length)[index]
                    return (
                      <button
                        key={index}
                        onClick={() => onToggleDataset(index)}
                        onMouseEnter={() => onLegendHover(index)}
                        onMouseLeave={onLegendLeave}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 border ${
                          isHidden
                            ? 'bg-gray-100 text-gray-400 border-gray-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm'
                        }`}
                        style={{ opacity: isHidden ? 0.5 : 1 }}
                      >
                        <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: isHidden ? '#9CA3AF' : backgroundColor }} />
                        <span className="truncate">{item.name}</span>
                        <span className="ml-1 text-gray-500">({item.percentage.toFixed(1)}%)</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No hay datos para mostrar con los filtros aplicados</p>
              </div>
            )}
          </div>
          {/* Obras Sociales vs Particular */}
          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Obras Sociales vs Particular</h3>
            <div className="mb-2 text-base text-gray-600">Volumen total de pacientes con obra social frente a los particulares.</div>
            
            <div className='mb-4 p-2 border rounded-lg bg-gray-50/50'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm font-semibold text-gray-700 uppercase'>Filtrar Obras Sociales</p>
                <div className='flex gap-2'>
                  <button onClick={() => setSelectedVsParticularOS(new Set(obrasSocialesDisponibles))} className='text-sm text-blue-600 hover:underline'>Todas</button>
                  <button onClick={() => setSelectedVsParticularOS(new Set())} className='text-sm text-red-600 hover:underline'>Ninguna</button>
                </div>
              </div>
              <div className='flex flex-wrap gap-1.5 max-h-20 overflow-y-auto'>
                {obrasSocialesDisponibles.map(os => {
                  const isSelected = selectedVsParticularOS.has(os);
                  return (
                    <button 
                      key={os}
                      onClick={() => handleToggleVsParticularOS(os)}
                      className={`px-2 py-0.5 rounded text-sm font-medium transition-colors border ${
                        isSelected 
                          ? 'bg-emerald-500 border-emerald-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {os}
                    </button>
                  )
                })}
              </div>
            </div>

            {(totalObraSocial + totalParticular) > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6 h-64 justify-center">
                <div className="h-56 w-56 flex-shrink-0">
                  <Pie data={obrasVsParticularDataFiltered} options={customPieChartOptions} />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Obras Sociales', 'Particular'].map((name, index) => {
                    const backgroundColor = ['#10B981', '#3B82F6'][index]
                    const value = index === 0 ? totalObraSocial : totalParticular
                    const percentage = (totalObraSocial + totalParticular) > 0 ? (value / (totalObraSocial + totalParticular)) * 100 : 0
                    const isHidden = hiddenVsParticular.has(index);

                    return (
                      <button
                        key={name}
                        onClick={() => handleToggleVsParticular(index)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-200 border ${
                          isHidden
                            ? 'bg-gray-100 text-gray-400 border-gray-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm'
                        }`}
                        style={{ opacity: isHidden ? 0.5 : 1 }}
                      >
                        <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: isHidden ? '#9CA3AF' : backgroundColor }} />
                        <span className="truncate">{name}</span>
                        <span className="ml-1 text-gray-500">({percentage.toFixed(1)}%)</span>
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
        </div>

        {/* 3. Estados de turnos */}
        <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900">Estados de turnos</h3>
          <div className="mb-2 text-base text-gray-600">Cantidad total de turnos agrupados por su estado.</div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
            <div className="flex gap-2 flex-wrap">
              <select className="border rounded px-2 py-1 text-base bg-white" value={obraSocialFiltro} onChange={e => setObraSocialFiltro(e.target.value)}>
                <option value="">Todas las obras sociales</option>
                <option value="Particular">Particular</option>
                {obrasSocialesUnicas.filter(nombre => nombre !== 'Particular').map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
              </select>
              <select className="border rounded px-2 py-1 text-base bg-white" value={rangoEtarioFiltro} onChange={e => setRangoEtarioFiltro(e.target.value)}>
                {rangosEtarios.map(rango => <option key={rango.value} value={rango.value}>{rango.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-[260px]">
            <Bar data={statusChartDataFiltrado} options={barChartOptions} />
          </div>
        </div>
      </div>
    </>
  )
}