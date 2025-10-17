"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
} from "chart.js";
import {
  Filter,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import ExperienciaPacienteTab from "@/components/indicadores-gerencia/ExperienciaPacienteTab";
import TendenciasCrecimientoTab from "@/components/indicadores-gerencia/TendenciasCrecimientoTab";

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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
const makeRange = (min: number, max: number): EdadRange => ({
  id: uid(),
  min,
  max,
  label: `${min}-${max}`,
});
const toISODateLocal = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Crear Date desde string YYYY-MM-DD en timezone local */
const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
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

/* ========= Página ========= */
export default function GerenteDashboard() {
  // Fechas default
  const today = new Date();
  const lastMonth = new Date(); lastMonth.setDate(lastMonth.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(toISODateLocal(lastMonth));
  const [dateTo, setDateTo] = useState(toISODateLocal(today));

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<'experiencia' | 'tendencias'>('experiencia');

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
    <main className="flex-1 p-5 md:p-8">
      <div className="w-full space-y-4">
        {/* Header section */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Gerencia</h1>
              <p className="text-lg text-gray-600">Análisis completo de consultas por especialidad y distribución etaria</p>
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
                  date={dateFrom ? createLocalDate(dateFrom) : undefined}
                  onDateChange={(date) => setDateFrom(date ? toISODateLocal(date) : '')}
                  placeholder="Desde"
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear() - 10}
                  toYear={new Date().getFullYear() + 5}
                  className="text-sm w-full sm:w-auto"
                />
                <span className="text-gray-400 hidden sm:inline">→</span>
                <DatePicker
                  date={dateTo ? createLocalDate(dateTo) : undefined}
                  onDateChange={(date) => setDateTo(date ? toISODateLocal(date) : '')}
                  placeholder="Hasta"
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear() - 10}
                  toYear={new Date().getFullYear() + 5}
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
                  onClick={() => applyPreset("hoy")}
                >
                  Hoy
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => applyPreset("manana")}
                >
                  Mañana
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => applyPreset("ultima_semana")}
                >
                  Últ. 7d
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => applyPreset("ultimo_mes")}
                >
                  Últ. mes
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => applyPreset("ultimo_trimestre")}
                >
                  Últ. 3m
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => applyPreset("este_anio")}
                >
                  Este año
                </button>
                <button 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200" 
                  onClick={() => applyPreset("anio_anterior")}
                >
                  Año ant.
                </button>
              </div>
            </div>
          </div>
        </div>


        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {errorMsg}
          </div>
        )}

        {/* Tabs navigation */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-2 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('experiencia')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'experiencia'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Experiencia del Paciente y Operaciones
            </button>
            <button
              onClick={() => setActiveTab('tendencias')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'tendencias'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tendencias y Crecimiento de Demanda
            </button>
          </div>
        </div>

        {/* Tab content - Experiencia del Paciente */}
        {activeTab === 'experiencia' && (
          <ExperienciaPacienteTab
            loading={loading}
            especialidades={especialidades}
            edadData={edadData}
            dateFrom={dateFrom}
            dateTo={dateTo}
            especialidadChart={especialidadChart}
            edadBarChart={edadBarChart}
            addDisabled={addDisabled}
            onEditRangos={() => { setEditModalOpen(true); setShowAdder(false); }}
            onAgregarRango={() => { setEditModalOpen(true); setShowAdder(true); }}
            onApplyPreset={applyPreset}
          />
        )}

        {/* Tab content - Tendencias y Crecimiento */}
        {activeTab === 'tendencias' && (
          <TendenciasCrecimientoTab 
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        )}
      </div>

      {/* MODAL EDICIÓN RANGOS */}
      {editModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { if (isValidRanges(ranges)) setEditModalOpen(false); }}
          />
          {/* Dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Contenedor modal */}
            <div className="w-full max-w-5xl lg:max-w-6xl max-h-[90vh] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-200 flex flex-col">
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
          10%  { transform: translateX(-4px); }
          20%  { transform: translateX(4px); }
          30%  { transform: translateX(-4px); }
          40%  { transform: translateX(4px); }
          50%  { transform: translateX(-2px); }
          60%  { transform: translateX(2px); }
          70%  { transform: translateX(-2px); }
          80%  { transform: translateX(2px); }
          90%  { transform: translateX(-1px); }
          100% { transform: translateX(0); }
        }
        .animate-shake-strong {
          animation: shake-strong 0.6s ease-in-out;
        }
      `}</style>
    </main>
  );
}
