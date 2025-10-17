"use client";

import { useState, useEffect, useRef, ComponentType, SVGProps } from 'react';
import { Filter, Loader2, Calendar, TrendingUp, Clock, Users } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { AppointmentStatus } from '@prisma/client';
import { DatePicker } from '@/components/ui/date-picker';
import PracticaClinicaTab from '@/components/indicadores-profesional/PracticaClinicaTab';
import MisPacientesTab from '@/components/indicadores-profesional/MisPacientesTab';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

// Helper function para convertir Date a string ISO local
const toISODateLocal = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  dailyCounts: Array<{
    date: string;
    count: number;
  }>;
};

const getDefaultDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  return { from, to: today };
};

// KPI Card Component (similar to gerencia)
type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: string;
};

const KpiCard = ({ title, value, subtitle, Icon, accent = "bg-blue-50" }: KpiCardProps) => {
  const gradientMap: Record<string, string> = {
    "bg-blue-50": "from-blue-500 to-blue-600",
    "bg-emerald-50": "from-emerald-500 to-emerald-600",
    "bg-red-50": "from-red-500 to-red-600",
    "bg-purple-50": "from-purple-500 to-purple-600"
  };
  
  const gradient = gradientMap[accent] || "from-gray-500 to-gray-600";

  return (
    <div className="rounded-xl border border-emerald-100 bg-white/70 backdrop-blur-sm p-3.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">{title}</p>
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{subtitle}</p>
          )}
        </div>
        <div className={`h-9 w-9 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );
};

export default function ProfesionalPage() {
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [hiddenDatasets, setHiddenDatasets] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [allTime, setAllTime] = useState(false);
  const [activeTab, setActiveTab] = useState<'practice' | 'patients'>('practice');
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
            dateFrom: toISODateLocal(from),
            dateTo: toISODateLocal(to)
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

  // Funciones para manejar la leyenda interactiva del gráfico
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

        {/* Filtros de fecha - Diseño compacto y coherente */}
        <div className="rounded-2xl border border-emerald-100 bg-white/70 backdrop-blur-sm p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Selectores de fecha */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Período:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DatePicker
                  date={dateFrom}
                  onDateChange={handleDateFromChange}
                  placeholder="Desde"
                  captionLayout="dropdown"
                  fromYear={currentYear - 10}
                  toYear={currentYear + 5}
                  className="text-sm w-full sm:w-auto"
                />
                <span className="text-gray-400 hidden sm:inline">→</span>
                <DatePicker
                  date={dateTo}
                  onDateChange={handleDateToChange}
                  placeholder="Hasta"
                  captionLayout="dropdown"
                  fromYear={currentYear - 10}
                  toYear={currentYear + 5}
                  className="text-sm w-full sm:w-auto"
                />
              </div>
            </div>

            {/* Divisor: vertical en lg, horizontal en móvil */}
            <div className="h-px lg:h-8 lg:w-px bg-gray-200 shrink-0"></div>

            {/* Accesos rápidos */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm text-gray-600 font-medium shrink-0">Accesos rápidos:</span>
              <div className="flex gap-1.5 flex-wrap">
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => {
                    const today = new Date();
                    setAllTime(false);
                    setDateFrom(today);
                    setDateTo(today);
                    setRefreshKey(v => v + 1);
                  }}
                >
                  Hoy
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setAllTime(false);
                    setDateFrom(tomorrow);
                    setDateTo(tomorrow);
                    setRefreshKey(v => v + 1);
                  }}
                >
                  Mañana
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => {
                    const today = new Date();
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    setAllTime(false);
                    setDateFrom(lastWeek);
                    setDateTo(today);
                    setRefreshKey(v => v + 1);
                  }}
                >
                  Últ. 7d
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={resetDateFilters}
                >
                  Últ. mes
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => {
                    const today = new Date();
                    const last3Months = new Date();
                    last3Months.setMonth(last3Months.getMonth() - 3);
                    setAllTime(false);
                    setDateFrom(last3Months);
                    setDateTo(today);
                    setRefreshKey(v => v + 1);
                  }}
                >
                  Últ. 3m
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => {
                    const today = new Date();
                    const startOfYear = new Date(today.getFullYear(), 0, 1);
                    setAllTime(false);
                    setDateFrom(startOfYear);
                    setDateTo(today);
                    setRefreshKey(v => v + 1);
                  }}
                >
                  Este año
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => {
                    const lastYear = new Date().getFullYear() - 1;
                    const start = new Date(lastYear, 0, 1);
                    const end = new Date(lastYear, 11, 31);
                    setAllTime(false);
                    setDateFrom(start);
                    setDateTo(end);
                    setRefreshKey(v => v + 1);
                  }}
                >
                  Año ant.
                </button>
                <button 
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    allTime
                      ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  onClick={toggleAllTime}
                >
                  Todo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total de Turnos" 
            value={stats?.totalAppointments || 0} 
            subtitle={`Promedio diario: ${stats?.averageDaily || 0}`}
            Icon={Calendar} 
            accent="bg-blue-50" 
          />
          <KpiCard 
            title="Tasa de Completado" 
            value={`${stats?.completionRate || 0}%`}
            subtitle="Turnos completados exitosamente"
            Icon={TrendingUp} 
            accent="bg-emerald-50" 
          />
          <KpiCard 
            title="Tasa de Cancelación" 
            value={`${stats?.cancellationRate || 0}%`}
            subtitle="Cancelados y no asistieron"
            Icon={Clock} 
            accent="bg-red-50" 
          />
          <KpiCard 
            title="Pacientes Únicos" 
            value={stats?.recentAppointments ? new Set(stats.recentAppointments.map(a => a.paciente)).size : 0}
            subtitle="En el período seleccionado"
            Icon={Users} 
            accent="bg-purple-50" 
          />
        </div>

        {/* Tabs navigation */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'practice'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mi Práctica Clínica
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'patients'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mis Pacientes
            </button>
          </div>
        </div>

        {/* Practice tab content */}
        {activeTab === 'practice' && (
          <PracticaClinicaTab
            stats={stats}
            hiddenDatasets={hiddenDatasets}
            onToggleDataset={toggleDataset}
            onLegendHover={handleLegendHover}
            onLegendLeave={handleLegendLeave}
          />
        )}

        {/* Patients tab content */}
        {activeTab === 'patients' && (
          <MisPacientesTab stats={stats} />
        )}
      </div>
    </main>
  );
}
