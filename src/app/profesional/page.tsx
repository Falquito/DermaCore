"use client";

import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, TrendingUp, Filter, Loader2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { AppointmentStatus } from '@prisma/client';
import { APPOINTMENT_STATUS_META, getStatusLabel } from '@/lib/appointment-status';
import { DatePicker } from '@/components/ui/date-picker';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Types
type ProfessionalStats = {
  dateRange: {
    from: Date;
    to: Date;
  };
  totalAppointments: number;
  statusCounts: Record<AppointmentStatus, number>;
  obraSocialPercentages: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  completionRate: number;
  cancellationRate: number;
  recentAppointments: Array<{
    id: string;
    fecha: Date;
    paciente: string;
    estado: AppointmentStatus;
    motivo?: string;
    obraSocial: string;
  }>;
  averageDaily: number;
};

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
  ];
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

const getDefaultDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  return { from, to: today };
};

export default function ProfesionalPage() {
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [hiddenDatasets, setHiddenDatasets] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [allTime, setAllTime] = useState(false);
  const chartRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const currentYear = new Date().getFullYear();

  // Initialize default dates (last 30 days)
  useEffect(() => {
    const { from, to } = getDefaultDateRange();
    setDateFrom(from);
    setDateTo(to);
  }, []);

  const resetDateFilters = () => {
    const { from, to } = getDefaultDateRange();
    setAllTime(false);
    setDateFrom(new Date(from));
    setDateTo(new Date(to));
    setRefreshKey((value) => value + 1);
  };

  const toggleAllTime = () => {
    if (allTime) {
      // Turning off: restore default last 30 days window
      const { from, to } = getDefaultDateRange();
      setAllTime(false);
      setDateFrom(from);
      setDateTo(to);
      setRefreshKey(v => v + 1);
    } else {
      // Turning on: clear dates and fetch all time
      setAllTime(true);
      setDateFrom(undefined);
      setDateTo(undefined);
      setRefreshKey(v => v + 1);
    }
  };

  // When user sets any date manually, exit allTime mode automatically
  const handleDateFromChange = (d?: Date) => {
    if (d) setAllTime(false);
    setDateFrom(d);
  };
  const handleDateToChange = (d?: Date) => {
    if (d) setAllTime(false);
    setDateTo(d);
  };

  // Fetch stats when dates change
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        let params = new URLSearchParams();

        if (allTime) {
          params.set('allTime', '1');
        } else {
          if (!dateFrom || !dateTo) return;

          const from = new Date(dateFrom);
          // Normalizamos inicio de día
          from.setHours(0, 0, 0, 0);

          const to = new Date(dateTo);
          // Importante: fin de día para incluir todos los turnos de la fecha seleccionada
          to.setHours(23, 59, 59, 999);

          if (to < from) {
            return;
          }

          params = new URLSearchParams({
            dateFrom: from.toISOString().split('T')[0],
            dateTo: to.toISOString().split('T')[0]
          });
        }

  const qs = params.toString();
  const response = await fetch(`/api/professional-stats${qs ? `?${qs}` : ''}`);
        if (!response.ok) throw new Error('Error fetching stats');

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateFrom, dateTo, refreshKey, allTime]);

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
  } : null;

  const statusChartData = stats ? {
    labels: Object.keys(stats.statusCounts).map(status => getStatusLabel(status as AppointmentStatus)),
    datasets: [{
      label: 'Turnos',
      data: Object.values(stats.statusCounts),
      backgroundColor: Object.keys(stats.statusCounts).map(status => STATUS_COLORS[status as AppointmentStatus]),
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  } : null;

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
            const label = context.label || '';
            const value = context.parsed || 0;
            const dataset = context.dataset;
            const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    onHover: (event: unknown, elements: unknown[], chart: unknown) => {
      const canvas = (chart as any)?.canvas; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (canvas) {
        canvas.style.cursor = (elements as any[]).length > 0 ? 'pointer' : 'default'; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
  };

  // Funciones para manejar la leyenda interactiva
  const toggleDataset = (index: number) => {
    const newHiddenDatasets = new Set(hiddenDatasets);
    if (newHiddenDatasets.has(index)) {
      newHiddenDatasets.delete(index);
    } else {
      newHiddenDatasets.add(index);
    }
    setHiddenDatasets(newHiddenDatasets);
  };

  const handleLegendHover = (index: number) => {
    if (chartRef.current) {
      const chart = chartRef.current;
      chart.setActiveElements([{ datasetIndex: 0, index }]);
      chart.update('none');
    }
  };

  const handleLegendLeave = () => {
    if (chartRef.current) {
      const chart = chartRef.current;
      chart.setActiveElements([]);
      chart.update('none');
    }
  };

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
            return `${context.label}: ${context.parsed.y} turnos`;
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
  };

  if (loading) {
    return (
      <main className="flex-1 p-5 md:p-8">
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-5 md:p-8">
      <div className="w-full space-y-4">
        {/* Header section */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de control</h1>
              <p className="text-lg text-gray-600">Resumen de tu actividad profesional y métricas de desempeño</p>
            </div>
          </div>
        </section>

        {/* Date filters section */}
        <div className="flex justify-end">
          
          <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 text-gray-500" />
              <span>Filtrar por fecha</span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Desde</label>
                <DatePicker
                  date={dateFrom}
                  onDateChange={handleDateFromChange}
                  placeholder="Selecciona una fecha"
                  captionLayout="dropdown"
                  fromYear={currentYear - 10}
                  toYear={currentYear + 5}
                  className="text-sm w-full"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Hasta</label>
                <DatePicker
                  date={dateTo}
                  onDateChange={handleDateToChange}
                  placeholder="Selecciona una fecha"
                  captionLayout="dropdown"
                  fromYear={currentYear - 10}
                  toYear={currentYear + 5}
                  className="text-sm w-full"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={resetDateFilters}
                className="w-full rounded-md border border-emerald-200 px-4 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 sm:w-auto"
              >
                Limpiar filtro
              </button>
              <button
                type="button"
                onClick={toggleAllTime}
                aria-pressed={allTime}
                className={`w-full rounded-md px-4 py-1.5 text-sm font-medium transition sm:w-auto border
                  ${allTime
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow hover:bg-emerald-500'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'}
                `}
              >
                Todos los tiempos
              </button>
            </div>
          </div>
        </div>

        {/* Key metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Turnos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalAppointments || 0}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Promedio diario: {stats?.averageDaily || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Completado</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.completionRate || 0}%</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Turnos completados exitosamente
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Cancelación</p>
                <p className="text-2xl font-bold text-red-600">{stats?.cancellationRate || 0}%</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Cancelados y no asistieron
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pacientes Únicos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats?.recentAppointments ? new Set(stats.recentAppointments.map(a => a.paciente)).size : 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              En el período seleccionado
            </p>
          </div>
        </div>

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
                    const isHidden = hiddenDatasets.has(index);
                    const colors = generateColors(stats.obraSocialPercentages.length);
                    const backgroundColor = colors[index];
                    
                    return (
                      <button
                        key={index}
                        onClick={() => toggleDataset(index)}
                        onMouseEnter={() => handleLegendHover(index)}
                        onMouseLeave={handleLegendLeave}
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
                    );
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

        {/* Recent appointments table */}
        <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="p-6 border-b border-emerald-200/50">
            <h3 className="text-lg font-semibold text-gray-900">
              Turnos Recientes
            </h3>
            <p className="text-gray-600">Últimos 5 turnos registrados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obra Social
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recentAppointments?.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(appointment.fecha).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {appointment.paciente}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${APPOINTMENT_STATUS_META[appointment.estado].badgeClass}`}>
                        {getStatusLabel(appointment.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {appointment.obraSocial}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {appointment.motivo || '-'}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                      No hay turnos recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
