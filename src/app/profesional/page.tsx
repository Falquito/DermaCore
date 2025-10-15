"use client";

import { useState, useEffect, useRef } from 'react';
import { Filter, Loader2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { AppointmentStatus } from '@prisma/client';
import { DatePicker } from '@/components/ui/date-picker';
import PracticaClinicaTab from '@/components/indicadores-profesional/PracticaClinicaTab';
import MisPacientesTab from '@/components/indicadores-profesional/MisPacientesTab';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
