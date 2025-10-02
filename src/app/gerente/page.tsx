"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  type TooltipItem,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import {
  Filter,
  Loader2,
  CalendarDays,
  Award,
  Users,
  PieChart as PieChartIcon,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle
);

/* ========= Tipos ========= */
interface EspecialidadData { nombre: string; total: number; }

interface EdadRange {
  id: string;     // clave estable
  min: number;
  max: number;
  label: string;
}

interface EdadReportData { rango: string; total: number; }

type PresetKey =
  | "hoy"
  | "manana"
  | "ultima_semana"
  | "ultimo_mes"
  | "ultimo_trimestre"
  | "ultimos_90"
  | "este_anio"
  | "anio_anterior";

/* ========= Config ========= */
const MAX_RANGES = 10;

/* ========= Utils ========= */
const PIE_COLORS = [
  "#2563EB","#059669","#D97706","#DC2626","#7C3AED","#0EA5E9",
  "#65A30D","#EA580C","#BE185D","#374151","#14B8A6","#A855F7",
  "#EF4444","#22C55E","#F59E0B","#3B82F6","#8B5CF6","#06B6D4",
  "#84CC16","#F97316","#EC4899","#6B7280","#10B981","#F43F5E",
  "#60A5FA","#34D399","#EAB308","#F87171",
];
const generateColors = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => PIE_COLORS[i % PIE_COLORS.length]);

const sum = (ns: number[]): number => ns.reduce((a, b) => a + b, 0);
const fmtPct = (x: number) => `${Number.isFinite(x) ? x.toFixed(1) : "0.0"}%`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
const makeRange = (min: number, max: number): EdadRange => ({
  id: uid(),
  min,
  max,
  label: `${min}-${max}`,
});
const formatDateAR = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const toISODateLocal = (d: Date): string => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

/** Validación: 1–100 y sin solapamientos */
const isValidRanges = (ranges: EdadRange[]): boolean => {
  if (ranges.length === 0) return false;
  const sorted = [...ranges].sort((a, b) => a.min - b.min);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.min < 1 || r.max > 100 || r.min >= r.max) return false;
    if (i > 0) {
      const prev = sorted[i - 1];
      if (r.min <= prev.max) return false;
    }
  }
  return true;
};

/** ====== Helpers para sugerir rangos ====== */
/** Primer hueco disponible (ancho ≤10). Si no hay, null. */
const computeNextRangeInGaps = (ranges: EdadRange[]): EdadRange | null => {
  const sorted = [...ranges].sort((a, b) => a.min - b.min);
  let cursor = 1;
  for (const r of sorted) {
    if (cursor < r.min) {
      const min = cursor;
      const max = Math.min(100, min + 9, r.min - 1);
      if (min < max) return makeRange(min, max);
    }
    cursor = Math.max(cursor, r.max + 1);
    if (cursor > 100) return null;
  }
  if (cursor < 100) {
    const min = cursor;
    const max = Math.min(100, min + 9);
    if (min < max) return makeRange(min, max);
  }
  return null;
};


/** Parte el rango más ancho en dos contiguos válidos (NO ordena) */
const splitWidestRange = (ranges: EdadRange[]): EdadRange[] | null => {
  if (ranges.length === 0) return null;
  const widest = ranges
    .map((r, i) => ({ i, span: r.max - r.min }))
    .sort((a, b) => b.span - a.span)[0];
  const target = ranges[widest.i];
  if ((target.max - target.min) < 3) return null;

  const mid = Math.floor((target.min + target.max) / 2);
  const left = makeRange(target.min, mid);
  const right = makeRange(mid + 1, target.max);

  const next = [...ranges];
  next.splice(widest.i, 1, left, right);
  return next; // sin ordenar
};

/** Rangos rápidos (Argentina) */
const computePreset = (key: PresetKey): { from: string; to: string } => {
  const today = new Date();
  const iso = (d: Date) => toISODateLocal(d);

  const startOfYear = new Date(today.getFullYear(), 0, 1);

  switch (key) {
    case "hoy": {
      const d = new Date();
      const s = iso(d);
      return { from: s, to: s };
    }
    case "manana": {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const s = iso(d);
      return { from: s, to: s };
    }
    case "ultima_semana": {
      const to = iso(today);
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const from = iso(d);
      return { from, to };
    }
    case "ultimo_mes": {
      const to = iso(today);
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      const from = iso(d);
      return { from, to };
    }
    case "ultimo_trimestre": {
      const to = iso(today);
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      const from = iso(d);
      return { from, to };
    }
    case "ultimos_90": {
      const to = iso(today);
      const d = new Date();
      d.setDate(d.getDate() - 90);
      const from = iso(d);
      return { from, to };
    }
    case "este_anio": {
      return { from: iso(startOfYear), to: iso(today) };
    }
    case "anio_anterior": {
      const y = today.getFullYear() - 1;
      return { from: toISODateLocal(new Date(y, 0, 1)), to: toISODateLocal(new Date(y, 11, 31)) };
    }
  }
};

/* ========= KPIs Card ========= */
type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent?: string;
};

const KpiCard = ({ title, value, subtitle, Icon, accent = "bg-blue-50" }: KpiCardProps) => (
  <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
    <div className={`p-2 rounded-lg ${accent}`}>
      <Icon className="h-5 w-5 text-gray-700" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900 leading-tight">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

/** Mensaje “Sin datos” reutilizable */
const NoData = ({
  text,
  onQuick,
}: {
  text: string;
  onQuick: () => void;
}) => (
  <div className="h-96 w-full flex flex-col items-center justify-center gap-3 text-center">
    <div className="text-gray-600">
      {text}
    </div>
    <Button variant="outline" size="sm" onClick={onQuick}>
      Ver último mes
    </Button>
  </div>
);

/* ========= Página ========= */
export default function GerenteDashboard() {
  // Fechas default
  const today = new Date();
  const lastMonth = new Date(); lastMonth.setDate(lastMonth.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(toISODateLocal(lastMonth));
  const [dateTo, setDateTo] = useState(toISODateLocal(today));

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Datos Especialidades
  const [especialidades, setEspecialidades] = useState<EspecialidadData[]>([]);

  // Edades (con IDs estables)
  const [ranges, setRanges] = useState<EdadRange[]>([
    makeRange(1, 12),
    makeRange(13, 18),
    makeRange(19, 40),
    makeRange(41, 65),
    makeRange(66, 100),
  ]);
  const [edadData, setEdadData] = useState<EdadReportData[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Agregar con tile "+" en modal
  const [showAdder, setShowAdder] = useState(false);

  // Resaltar el último rango agregado (vibración se corta sola)
  const [highlightId, setHighlightId] = useState<string | null>(null);
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 2000);
    return () => clearTimeout(t);
  }, [highlightId]);

  // No ordenar durante edición
  const rangesForApi = useMemo(
    () => ranges.map(r => ({ min: r.min, max: r.max, label: `${r.min}-${r.max}` })),
    [ranges]
  );

  // Fetch con overrides opcionales (para presets rápidos)
  const fetchReports = useCallback(async (override?: {
    startDate?: string;
    endDate?: string;
    rangesForApiOverride?: { min: number; max: number; label: string }[];
  }) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const sDate = override?.startDate ?? dateFrom;
      const eDate = override?.endDate ?? dateTo;

      const resEsp = await fetch("/api/reportes/especialidades", {
        method: "POST",
        body: JSON.stringify({ startDate: sDate, endDate: eDate }),
        headers: { "Content-Type": "application/json" },
      });
      setEspecialidades(resEsp.ok ? (await resEsp.json() as EspecialidadData[]).filter(e => e.total > 0) : []);

      const resEdad = await fetch("/api/reportes/edades", {
        method: "POST",
        body: JSON.stringify({
          startDate: sDate,
          endDate: eDate,
          ranges: override?.rangesForApiOverride ?? rangesForApi,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setEdadData(resEdad.ok ? await resEdad.json() as EdadReportData[] : []);
    } catch (e) {
      console.error("Error cargando reportes:", e);
      setErrorMsg("Hubo un problema al cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, rangesForApi]);

  // Ejecuta una sola vez
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    void fetchReports();
  }, [fetchReports]);

  // Accesos rápidos
  const applyPreset = (key: PresetKey): void => {
    const { from, to } = computePreset(key);
    setDateFrom(from);
    setDateTo(to);
    void fetchReports({ startDate: from, endDate: to });
  };

  // KPIs
  const totalConsultas = sum(especialidades.map(e => e.total));
  const totalPacientes = sum(edadData.map(d => d.total));
  const topEsp = [...especialidades].sort((a,b)=>b.total-a.total)[0];
  const topEspPct = totalConsultas ? ((topEsp?.total ?? 0)*100)/totalConsultas : 0;
  const topEdad: EdadReportData | undefined =
  edadData.length ? [...edadData].sort((a, b) => b.total - a.total)[0] : undefined; // mantiene tu lógica original
  const topEdadPct = totalPacientes ? ((topEdad?.total ?? 0)*100)/totalPacientes : 0;
  const top3Sum = [...especialidades].sort((a,b)=>b.total-a.total).slice(0,3).reduce((acc,it)=>acc+it.total,0);
  const concTop3Pct = totalConsultas ? (top3Sum*100)/totalConsultas : 0;

  // Charts
  const especialidadChart = {
    labels: especialidades.map(e => e.nombre),
    datasets: [{
      data: especialidades.map(e => e.total),
      backgroundColor: generateColors(especialidades.length),
      borderColor: "#fff",
      borderWidth: 2,
    }],
  };

  const barColors = generateColors(edadData.length);
  const edadBarChart = {
    labels: edadData.map(d => d.rango),
    datasets: [{
      label: "Pacientes",
      data: edadData.map(d => d.total),
      backgroundColor: barColors,
      borderColor: "#fff",
      borderWidth: 1,
    }],
  };

  /** Agregar rango sugerido: hueco → split; se agrega al FINAL y vibra fuerte */
  const handleAddRange = (): void => {
    if (ranges.length >= MAX_RANGES) return;

    // 1) Intentar usar un hueco disponible
    const gap = computeNextRangeInGaps(ranges);
    if (gap) {
      setRanges(prev => [...prev, gap]);   // apendizar al final
      setHighlightId(gap.id);              // resaltar (vibración)
      return;
    }

    // 2) Si no hay hueco, partir el rango más ancho
    const split = splitWidestRange(ranges);
    if (split) {
      const oldIds = new Set(ranges.map(r => r.id));
      const created = split.filter(r => !oldIds.has(r.id));
      const newR = created[0] ?? null;

      if (newR) {
      // Sacamos el rango elegido de su posición en 'split' y lo mandamos al final (sin duplicar)
      const without = split.filter(r => r.id !== newR.id);
      setRanges([...without, newR]);             // ← no hay duplicado
      setHighlightId(newR.id);
    } else {
      // Por seguridad, si no detecta cuál es el nuevo, usamos split tal cual
      setRanges(split);                   // fallback
      }
    }
  };

  // Disable al llegar a 10
  const addDisabled = ranges.length >= MAX_RANGES;

  /* ======= Handlers de inputs con CLAMP y sin remount ======= */
  const updateRangeMin = (id: string, value: string) => {
    const vRaw = onlyDigits(value);
    const vNum = vRaw === "" ? 1 : Number(vRaw);
    setRanges(prev => prev.map(r => {
      if (r.id !== id) return r;
      const min = clamp(vNum, 1, 99);
      let max = r.max;
      if (min >= max) max = clamp(min + 1, 2, 100);
      return { ...r, min, max, label: `${min}-${max}` };
    }));
  };

  const updateRangeMax = (id: string, value: string) => {
    const vRaw = onlyDigits(value);
    const vNum = vRaw === "" ? 2 : Number(vRaw);
    setRanges(prev => prev.map(r => {
      if (r.id !== id) return r;
      const max = clamp(vNum, 2, 100);
      let min = r.min;
      if (max <= min) min = clamp(max - 1, 1, 99);
      return { ...r, min, max, label: `${min}-${max}` };
    }));
  };

  // No ordenar en render
  const displayedRanges = ranges;

  return (
    <main className="flex-1 p-6 md:p-10 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Filtros */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Reportes de Gerencia</h1>
              <p className="text-gray-600">Análisis de consultas por especialidad y distribución etaria</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Desde:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Hasta:</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <button
                onClick={() => void fetchReports()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow whitespace-nowrap"
              >
                Generar
              </button>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <span className="text-sm text-gray-600 mr-1">Accesos rápidos:</span>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("hoy")}>Hoy</button>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("manana")}>Mañana</button>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("ultima_semana")}>Últ. semana</button>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("ultimo_mes")}>Últ. mes</button>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("ultimo_trimestre")}>Últ. trimestre</button>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("ultimos_90")}>Últ. 90 días</button>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("este_anio")}>Este año</button>
            <button className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50" onClick={() => applyPreset("anio_anterior")}>Año anterior</button>
          </div>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total de consultas" value={totalConsultas} subtitle={`Periodo ${formatDateAR(dateFrom)} → ${formatDateAR(dateTo)}`} Icon={CalendarDays} accent="bg-emerald-50" />
          <KpiCard title="Especialidad líder" value={topEsp?.nombre ?? "—"} subtitle={`${fmtPct(topEspPct)} del total`} Icon={Award} accent="bg-blue-50" />
          <KpiCard title="Rango etario líder" value={topEdad?.rango ?? "—"} subtitle={`${fmtPct(topEdadPct)} de pacientes`} Icon={Users} accent="bg-indigo-50" />
          <KpiCard title="Concentración Top 3" value={fmtPct(concTop3Pct)} subtitle="Participación de las 3 especialidades principales" Icon={PieChartIcon} accent="bg-amber-50" />
        </section>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Cargando reportes...</span>
          </div>
        ) : (
          <Fragment>
            {/* CHARTS side-by-side, MISMO ALTO */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PASTEL */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900">Consultas por Especialidad</h2>
                <p className="text-sm text-gray-500 mb-4">Periodo: {formatDateAR(dateFrom)} → {formatDateAR(dateTo)}</p>

                {especialidades.length > 0 ? (
                  <div className="h-96">
                    <Pie
                      data={especialidadChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle" } },
                          tooltip: {
                            callbacks: {
                              label: (ctx: TooltipItem<"pie">) => {
                                const ds = ctx.dataset.data as number[];
                                const total = ds.reduce((a, b) => a + (b as number), 0);
                                const value = Number(ctx.raw);
                                const pct = total ? (value * 100) / total : 0;
                                return `${ctx.label}: ${value} (${pct.toFixed(1)}%)`;
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
                    onQuick={() => applyPreset("ultimo_mes")}
                  />
                )}
              </div>

              {/* BARRAS */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Distribución Etaria</h2>
                    <p className="text-sm text-gray-500">Rango mínimo 1 año, máximo 100 años</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditModalOpen(true); setShowAdder(false); }}>
                      Editar rangos
                    </Button>
                    {/* Botón Agregar rango fuera del modal: muestra el tile "+" dentro */}
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => { setEditModalOpen(true); setShowAdder(true); }}
                      disabled={addDisabled}
                      title={addDisabled ? "No se puede agregar más" : "Agregar un nuevo rango"}
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
                    onQuick={() => applyPreset("ultimo_mes")}
                  />
                )}
              </div>
            </section>
          </Fragment>
        )}
      </div>

      {/* MODAL EDICIÓN RANGOS */}
      {editModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => { if (isValidRanges(ranges)) setEditModalOpen(false); }}
          />
          {/* Dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Contenedor modal */}
            <div className="w-full max-w-5xl lg:max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Editar rangos etarios</h3>
                  <p className="text-sm text-gray-500">Evitar superposiciones. Valores entre 1 y 100.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{ranges.length}/{MAX_RANGES}</span>
                  {/* (sin botón Agregar dentro del modal) */}
                  <button
                    className="p-2 rounded hover:bg-gray-100"
                    onClick={() => { if (isValidRanges(ranges)) setEditModalOpen(false); }}
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Body con grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {/* Tile “+”: agrega rango sugerido al FINAL y vibra */}
                  {showAdder && !addDisabled && (
                    <button
                      type="button"
                      onClick={() => { handleAddRange(); setShowAdder(false); }}
                      className="p-4 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition flex flex-col items-center justify-center text-emerald-700"
                      title="Agregar rango"
                    >
                      <Plus className="h-6 w-6 mb-1" />
                      <span className="text-sm font-medium">Agregar rango</span>
                    </button>
                  )}

                  {displayedRanges.map((r) => {
                    const invalid = r.min < 1 || r.max > 100 || r.min >= r.max;
                    const isNew = r.id === highlightId;
                    return (
                      <div
                        key={r.id}
                        className={[
                          "p-3 rounded-xl border shadow-sm transition",
                          invalid ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50",
                          // súper visible: borde negro + ring y vibración fuerte
                          isNew ? "bg-amber-100 border-black ring-2 ring-black animate-shake-strong" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Rango {r.label}
                          </span>
                          <button
                            className="p-1 rounded hover:bg-gray-100"
                            onClick={() => setRanges(prev => prev.filter(x => x.id !== r.id))}
                            aria-label="Eliminar rango"
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="flex gap-3 mt-3">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500">Mín</label>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min={1}
                              max={100}
                              value={r.min}
                              onChange={(e) => updateRangeMin(r.id, e.target.value)}
                              className="mt-1 w-full border px-2 py-1 rounded text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500">Máx</label>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min={1}
                              max={100}
                              value={r.max}
                              onChange={(e) => updateRangeMax(r.id, e.target.value)}
                              className="mt-1 w-full border px-2 py-1 rounded text-sm"
                            />
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          Label: <span className="font-medium">{r.label}</span>
                        </p>
                        {invalid && (
                          <p className="mt-1 text-xs text-red-600">Fuera de rango o solapado.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setRanges([makeRange(1,12), makeRange(13,18), makeRange(19,40), makeRange(41,65), makeRange(66,100)])}
                >
                  Restaurar
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => isValidRanges(ranges) && setEditModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!isValidRanges(ranges)}
                    onClick={async () => {
                      // Ordena recién al guardar
                      const sortedForSave = [...ranges].sort((a,b)=>a.min-b.min);
                      await fetchReports({
                        rangesForApiOverride: sortedForSave.map(r => ({ min: r.min, max: r.max, label: `${r.min}-${r.max}` })),
                      });
                      setRanges(sortedForSave);
                      setEditModalOpen(false);
                    }}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vibración FUERTE para el rango nuevo */}
      <style jsx global>{`
        @keyframes shake-strong {
          0%   { transform: translateX(0); }
          10%  { transform: translateX(-4px); 
        }
        .animate-shake-strong {
          animation: shake-strong 0.12s linear infinite;
        }
      `}</style>
    </main>
  );
}
