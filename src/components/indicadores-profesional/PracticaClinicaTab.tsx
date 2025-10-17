'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import type { Chart } from 'chart.js'

import { Pie, Bar, Line } from 'react-chartjs-2'
import { AppointmentStatus } from '@prisma/client'
import { getStatusLabel } from '@/lib/appointment-status'
import type { TooltipItem } from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Loader2
} from 'lucide-react'

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

// Componente para métricas con animaciones (similar a las otras pestañas)
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

// --- Componente Principal ---

export default function PracticaClinicaTab({
  stats
}: Pick<PracticaClinicaTabProps, 'stats'>) {
  const chartRef = useRef<Chart<'pie', number[], string> | null>(null)

  // --- Estados para los filtros ---
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('')
  const [obraSocialFiltro, setObraSocialFiltro] = useState<string>('')
  const [rangoEtarioFiltro, setRangoEtarioFiltro] = useState<string>('')
  
  const [distribucionRangoEtarioFiltro, setDistribucionRangoEtarioFiltro] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  
  // Estados para el buscador de pacientes
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState<boolean>(false);
  const [filteredPatients, setFilteredPatients] = useState<Array<{id: string, name: string}>>([]);
  
  const obrasSocialesDisponibles = useMemo(() => {
    if (!stats?.appointments) return [];
    const uniqueObrasSociales = new Set<string>();
    stats.appointments.forEach(appointment => {
      const obraSocialName = appointment.obraSocial?.nombre || 'Particular';
      uniqueObrasSociales.add(obraSocialName);
    });
    return Array.from(uniqueObrasSociales).sort();
  }, [stats?.appointments]);

  const [selectedDistribucionOS, setSelectedDistribucionOS] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    // Inicializar con todas las obras sociales disponibles
    setSelectedDistribucionOS(new Set(obrasSocialesDisponibles));
  }, [obrasSocialesDisponibles]);

  const handleToggleDistribucionOS = (name: string) => {
    setSelectedDistribucionOS(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  // Lista de pacientes únicos para el selector
  const availablePatients = useMemo(() => {
    if (!stats?.appointments) return [];
    const uniquePatients = new Map();
    
    stats.appointments.forEach(appointment => {
      if (appointment.paciente && appointment.paciente.id) {
        const patientId = appointment.paciente.id;
        if (!uniquePatients.has(patientId)) {
          uniquePatients.set(patientId, {
            id: patientId,
            name: `${appointment.paciente.nombre || 'Sin nombre'} ${appointment.paciente.apellido || 'Sin apellido'}`,
            // Agregamos más información para mejor búsqueda
            searchTerm: `${appointment.paciente.nombre || ''} ${appointment.paciente.apellido || ''} ${appointment.paciente.id || ''}`.toLowerCase()
          });
        }
      }
    });
    
    return Array.from(uniquePatients.values())
      .filter(patient => patient.id) // Asegurar que todos tengan ID válido
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stats?.appointments]);

  // Filtrar pacientes basado en el término de búsqueda
  useEffect(() => {
    if (!patientSearchTerm.trim()) {
      setFilteredPatients(availablePatients.slice(0, 10)); // Mostrar solo 10 inicialmente
    } else {
      const filtered = availablePatients
        .filter(patient => 
          patient.searchTerm.includes(patientSearchTerm.toLowerCase())
        )
        .slice(0, 10); // Limitar a 10 resultados
      setFilteredPatients(filtered);
    }
  }, [patientSearchTerm, availablePatients]);

  // Función para seleccionar un paciente
  const handleSelectPatient = (patient: { id: string, name: string } | null) => {
    if (patient) {
      setSelectedPatientId(patient.id);
      setSelectedPatientName(patient.name);
      setPatientSearchTerm(patient.name);
    } else {
      setSelectedPatientId('all');
      setSelectedPatientName('');
      setPatientSearchTerm('');
    }
    setIsPatientDropdownOpen(false);
  };

  // Función para limpiar la selección
  const handleClearPatientSelection = () => {
    handleSelectPatient(null);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.patient-search-container')) {
        setIsPatientDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const appointments = stats?.appointments

  // --- Lógica y Datos para Gráfico: Distribución de Obras Sociales (con filtro de edad) ---
  const obraSocialChartData = useMemo(() => {
    if (!stats?.appointments) return null;
    
    let filteredAppointments = stats.appointments;

    // Filtro por paciente específico
    if (selectedPatientId !== 'all') {
      filteredAppointments = filteredAppointments.filter(a => a.paciente?.id === selectedPatientId);
    }
    
    // Filtro por rango etario (solo si no hay paciente específico seleccionado)
    if (selectedPatientId === 'all' && distribucionRangoEtarioFiltro) {
      filteredAppointments = filteredAppointments.filter(a => {
        if (!a.paciente?.fechaNacimiento) return true;
        const edad = new Date().getFullYear() - new Date(a.paciente.fechaNacimiento).getFullYear();
        if (distribucionRangoEtarioFiltro === '0-17') return edad <= 17;
        if (distribucionRangoEtarioFiltro === '18-39') return edad >= 18 && edad <= 39;
        if (distribucionRangoEtarioFiltro === '40-64') return edad >= 40 && edad <= 64;
        if (distribucionRangoEtarioFiltro === '65+') return edad >= 65;
        return true;
      });
    }
    
    // Contar por obra social
    const counts = filteredAppointments.reduce((acc, appointment) => {
      const name = appointment.obraSocial?.nombre || 'Particular';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Filtrar por obras sociales seleccionadas
    const filteredCounts = Object.entries(counts)
      .filter(([name]) => selectedDistribucionOS.has(name))
      .sort(([,a], [,b]) => b - a);

    if (filteredCounts.length === 0) return null;

    const total = filteredCounts.reduce((sum, [, count]) => sum + count, 0);
    
    const percentages = filteredCounts.map(([name, count]) => ({
      name,
      count,
      percentage: (count / total) * 100,
    }));

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
  }, [stats?.appointments, distribucionRangoEtarioFiltro, selectedDistribucionOS, selectedPatientId]); 
  
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
      <div className="space-y-8">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-lg text-gray-600">Cargando análisis de práctica clínica...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header con información del período */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">Análisis de Práctica Clínica</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📊 Evolución temporal, distribución por obra social y análisis de estados</p>
              <p>🔍 Período analizado: {new Date(stats.dateRange.from).toLocaleDateString()} hasta {new Date(stats.dateRange.to).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Resumen de Análisis</div>
            <div className="flex flex-wrap gap-1 justify-end">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                {stats.totalAppointments} turnos
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {stats.completionRate.toFixed(1)}% completados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Turnos"
          value={stats.totalAppointments}
          subtitle="En el período seleccionado"
          Icon={Calendar}
          delay={0}
        />
        
        <MetricCard
          title="Tasa Completados"
          value={`${stats.completionRate.toFixed(1)}%`}
          subtitle="Consultas finalizadas"
          Icon={Target}
          delay={100}
        />
        
        <MetricCard
          title="Promedio Diario"
          value={stats.averageDaily.toFixed(1)}
          subtitle="Consultas por día"
          Icon={TrendingUp}
          delay={200}
        />
        
        <MetricCard
          title="Obras Sociales"
          value={`${stats.obraSocialPercentages.length} tipos`}
          subtitle={stats.obraSocialPercentages.length > 0 ? `Incluyendo ${stats.obraSocialPercentages[0]?.name}` : "Sin datos"}
          Icon={Users}
          delay={300}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 1. Evolución de Consultas */}
        <Card className="rounded-3xl border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-3 text-emerald-800">
              <div className="p-2 rounded-lg bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold">Evolución de Consultas</div>
                <div className="text-sm font-normal text-gray-600">
                  Cantidad de consultas realizadas a lo largo del tiempo
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
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
            {consultasPorPeriodoChartData && consultasPorPeriodoChartData.datasets[0].data.some(v => typeof v === 'number' && v > 0) ? (
              <div className="h-64">
                <Line data={consultasPorPeriodoChartData} options={lineChartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No hay datos para mostrar con los filtros aplicados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Distribución por Obra Social Integrado */}
        <Card className="rounded-3xl border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-3 text-blue-800">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold">Distribución por Obra Social</div>
                <div className="text-sm font-normal text-gray-600">
                  Análisis general o por paciente específico
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de controles */}
              <div className="space-y-4">
                {/* Selector de Paciente con Búsqueda */}
                <div className='p-4 border rounded-lg bg-blue-50/30'>
                  <div className='flex items-center justify-between mb-3'>
                    <p className='text-sm font-semibold text-blue-700 uppercase tracking-wide'>👤 Buscar Paciente</p>
                    {selectedPatientId !== 'all' && (
                      <button
                        onClick={handleClearPatientSelection}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  
                  <div className="relative patient-search-container">
                    <input
                      type="text"
                      placeholder={selectedPatientId === 'all' ? "🔍 Buscar paciente por nombre..." : "Paciente seleccionado"}
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setIsPatientDropdownOpen(true);
                        if (!e.target.value) {
                          setSelectedPatientId('all');
                          setSelectedPatientName('');
                        }
                      }}
                      onFocus={() => setIsPatientDropdownOpen(true)}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Dropdown de resultados */}
                    {isPatientDropdownOpen && (patientSearchTerm || selectedPatientId === 'all') && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Opción "Todos los pacientes" */}
                        <button
                          onClick={() => handleSelectPatient(null)}
                          className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 text-sm ${
                            selectedPatientId === 'all' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                          }`}
                        >
                          📊 Todos los pacientes (Vista general)
                        </button>
                        
                        {/* Lista de pacientes filtrados */}
                        {filteredPatients.length > 0 ? (
                          filteredPatients.map((patient, index) => (
                            <button
                              key={`patient-search-${patient.id || index}`}
                              onClick={() => handleSelectPatient(patient)}
                              className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 text-sm last:border-b-0 ${
                                selectedPatientId === patient.id ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                              }`}
                            >
                              👤 {patient.name}
                            </button>
                          ))
                        ) : patientSearchTerm && (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron pacientes con &quot;{patientSearchTerm}&quot;
                          </div>
                        )}
                        
                        {/* Indicador si hay más resultados */}
                        {patientSearchTerm && availablePatients.length > filteredPatients.length && (
                          <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 text-center">
                            Mostrando {filteredPatients.length} de {availablePatients.length} pacientes. Refina tu búsqueda.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Botón para cerrar dropdown */}
                    {isPatientDropdownOpen && (
                      <button
                        onClick={() => setIsPatientDropdownOpen(false)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {selectedPatientId !== 'all' && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                      ✅ Mostrando consultas específicas de este paciente
                    </div>
                  )}
                  
                  {/* Información adicional */}
                  <div className="mt-2 text-xs text-gray-500">
                    {availablePatients.length > 0 ? (
                      `${availablePatients.length} paciente${availablePatients.length !== 1 ? 's' : ''} disponible${availablePatients.length !== 1 ? 's' : ''}`
                    ) : (
                      'No hay datos de pacientes disponibles'
                    )}
                  </div>
                </div>

                {/* Selector de Rango Etario (solo si no hay paciente específico) */}
                {selectedPatientId === 'all' && (
                  <div className='p-4 border rounded-lg bg-green-50/30'>
                    <div className='flex items-center justify-between mb-3'>
                      <p className='text-sm font-semibold text-green-700 uppercase tracking-wide'>📊 Rango Etario</p>
                    </div>
                    <select 
                      className="w-full border border-green-200 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                      value={distribucionRangoEtarioFiltro} 
                      onChange={e => setDistribucionRangoEtarioFiltro(e.target.value)}
                    >
                      {rangosEtarios.map(rango => (
                        <option key={rango.value} value={rango.value}>{rango.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtros de Obras Sociales */}
                <div className='p-4 border rounded-lg bg-gray-50/50'>
                  <div className='flex items-center justify-between mb-3'>
                    <p className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>🏥 Filtrar Obras Sociales</p>
                    <div className='flex gap-2'>
                      <button 
                        onClick={() => setSelectedDistribucionOS(new Set(obrasSocialesDisponibles))} 
                        className='text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium'
                      >
                        Todas
                      </button>
                      <span className="text-gray-300">|</span>
                      <button 
                        onClick={() => setSelectedDistribucionOS(new Set())} 
                        className='text-sm text-red-600 hover:text-red-800 hover:underline font-medium'
                      >
                        Ninguna
                      </button>
                    </div>
                  </div>
                  <div className='flex flex-wrap gap-2 max-h-32 overflow-y-auto'>
                    {obrasSocialesDisponibles.map(os => {
                      const isSelected = selectedDistribucionOS.has(os);
                      return (
                        <button 
                          key={os}
                          onClick={() => handleToggleDistribucionOS(os)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 shadow-sm' 
                              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                          }`}
                        >
                          {os === 'Particular' ? '💰 Particular' : `🏥 ${os}`}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    {selectedDistribucionOS.size} de {obrasSocialesDisponibles.length} obras sociales seleccionadas
                  </div>
                </div>

                {/* Información contextual */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>📈 Análisis actual:</strong>
                    <br />
                    {selectedPatientId === 'all' 
                      ? `Vista general de todos los pacientes${distribucionRangoEtarioFiltro ? ` (${rangosEtarios.find(r => r.value === distribucionRangoEtarioFiltro)?.label})` : ''}`
                      : `Consultas específicas del paciente: ${selectedPatientName || 'Seleccionado'}`
                    }
                  </div>
                </div>
              </div>

              {/* Gráfico */}
              <div className="flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Distribución por Obra Social</h3>
                  <p className="text-sm text-gray-600">
                    {obraSocialChartData ? 
                      `${obraSocialChartData.percentages.reduce((sum, item) => sum + item.count, 0)} consultas analizadas` : 
                      'Sin datos para mostrar'
                    }
                  </p>
                </div>
                
                {obraSocialChartData ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-80 w-80">
                      <Pie ref={chartRef} data={obraSocialChartData} options={customPieChartOptions} />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center p-8">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-lg font-medium">No hay datos para mostrar</p>
                      <p className="text-sm">Ajuste los filtros para ver información</p>
                    </div>
                  </div>
                )}

                {/* Leyenda personalizada */}
                {obraSocialChartData && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Distribución detallada:</h4>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {obraSocialChartData.percentages.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: obraSocialChartData.datasets[0].backgroundColor[index] }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{item.count}</span> ({item.percentage.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Estados de turnos */}
        <Card className="rounded-3xl border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <CardTitle className="flex items-center gap-3 text-green-800">
              <div className="p-2 rounded-lg bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold">Estados de turnos</div>
                <div className="text-sm font-normal text-gray-600">
                  Cantidad total de turnos agrupados por su estado
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}