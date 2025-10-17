"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Target,
  Zap,
  Filter,
  RefreshCw,
  Settings2,
  Minus,
  Clock,
  Stethoscope
} from "lucide-react";

interface TendenciasCrecimientoTabProps {
  dateFrom: string;
  dateTo: string;
}

// Definición de tipos para los datos
interface TurnoMes {
  mes: string;
  total: number;
  completados: number;
  cancelados: number;
}

interface TurnoHora {
  hora: string;
  cantidad: number;
}

interface TurnoDia {
  dia: string;
  cantidad: number;
}

interface CrecimientoPaciente {
  mes: string;
  nuevos: number;
  total: number;
}

interface DistribucionEspecialidad {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

interface TiempoEspecialidad {
  especialidad: string;
  minutos: number;
}

interface TasaAsistencia {
  mes: string;
  asistencia: number;
  noAsistio: number;
}

interface EstadisticasResumen {
  tendenciaMensual: number;
  horasMasConcurridas: string[];
  diasMasConcurridos: string[];
  especialidadMasPopular: string;
  tasaAsistenciaPromedio: number;
  crecimientoPacientesUltimoMes: number;
  eficienciaOperativa: number;
  prediccionProximoMes: number;
}

interface ApiResponse {
  turnosPorMes: TurnoMes[];
  turnosPorHora: TurnoHora[];
  turnosPorDia: TurnoDia[];
  crecimientoPacientes: CrecimientoPaciente[];
  distribucionEspecialidades: DistribucionEspecialidad[];
  tiempoPromedioPorEspecialidad: TiempoEspecialidad[];
  tasaAsistencia: TasaAsistencia[];
  estadisticasResumen: EstadisticasResumen;
}

// Estados de filtros modulares avanzados
interface FiltrosAvanzados {
  evolucionTemporal: {
    periodo: 'dia' | 'semana' | 'mes' | 'cuatrimestre' | 'año';
    profesional: string | 'todos';
    especialidad: string | 'todas';
    estado: 'todos' | 'completados' | 'cancelados' | 'pendientes';
  };
  especialidades: {
    especialidadesSeleccionadas: string[];
    periodo: 'semana' | 'mes' | 'cuatrimestre';
  };
  profesionales: {
    profesionalesSeleccionados: string[];
    metrica: 'consultas' | 'pacientes' | 'duracion' | 'asistencia';
    periodo: 'dia' | 'semana' | 'mes';
    especialidad: string | 'todas';
    vistaGrafico: 'barras' | 'linea' | 'ranking';
  };
  patrones: {
    dimension: 'horario' | 'diasemana';
    profesional: string | 'todos';
    especialidad: string | 'todas';
    periodo: 'mes' | 'cuatrimestre' | 'año';
  };
}

// Tipos de datos modulares
interface DatoProfesional {
  id: string;
  nombre: string;
  especialidad: string;
  consultas: number;
  pacientesUnicos: number;
  duracionPromedio: number;
  tasaAsistencia: number;
}



// Componente para métricas con animaciones
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  Icon: React.ComponentType<{ className?: string }>;
  delay?: number;
}

const MetricCard = ({ title, value, change, subtitle, Icon, delay = 0 }: MetricCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const changeColor = change && change > 0 ? 'text-emerald-600' : change && change < 0 ? 'text-red-500' : 'text-gray-500';
  const changeBg = change && change > 0 ? 'bg-emerald-50' : change && change < 0 ? 'bg-red-50' : 'bg-gray-50';

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
  );
};

// Componente para panel de filtros modulares avanzados
interface PanelFiltrosAvanzadosProps {
  tipo: 'evolucion' | 'especialidades' | 'profesionales' | 'patrones';
  filtros: FiltrosAvanzados;
  setFiltros: (filtros: FiltrosAvanzados) => void;
  opciones: {
    especialidades?: string[];
    profesionales?: DatoProfesional[];
  };
}

const PanelFiltrosAvanzados = ({ tipo, filtros, setFiltros, opciones }: PanelFiltrosAvanzadosProps) => {
  const [abierto, setAbierto] = useState(false);

  const updateFiltro = (seccion: keyof FiltrosAvanzados, campo: string, valor: unknown) => {
    const nuevosFiltros = {
      ...filtros,
      [seccion]: {
        ...filtros[seccion],
        [campo]: valor
      }
    };
    setFiltros(nuevosFiltros);
  };

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 mb-2"
      >
        <Settings2 className="h-4 w-4" />
        Filtros Avanzados
        {abierto ? <Minus className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
      </Button>
      
      {abierto && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {tipo === 'evolucion' && (
            <>
              {/* Selector de Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Período de Análisis:</label>
                <div className="flex flex-wrap gap-2">
                  {(['dia', 'semana', 'mes', 'cuatrimestre', 'año'] as const).map(periodo => (
                    <Button
                      key={periodo}
                      variant={filtros.evolucionTemporal.periodo === periodo ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('evolucionTemporal', 'periodo', periodo)}
                      className="text-xs"
                    >
                      {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selector de Profesional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Profesional:</label>
                <select 
                  value={filtros.evolucionTemporal.profesional}
                  onChange={(e) => updateFiltro('evolucionTemporal', 'profesional', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todos">Todos los profesionales</option>
                  {opciones.profesionales?.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} - {prof.especialidad}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Especialidad */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Especialidad:</label>
                <select 
                  value={filtros.evolucionTemporal.especialidad}
                  onChange={(e) => updateFiltro('evolucionTemporal', 'especialidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todas">Todas las especialidades</option>
                  {opciones.especialidades?.map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              {/* Estado de Turnos */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado:</label>
                <div className="flex flex-wrap gap-2">
                  {(['todos', 'completados', 'cancelados', 'pendientes'] as const).map(estado => (
                    <Button
                      key={estado}
                      variant={filtros.evolucionTemporal.estado === estado ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('evolucionTemporal', 'estado', estado)}
                      className="text-xs"
                    >
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tipo === 'especialidades' && (
            <>
              {/* Especialidades Seleccionadas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Especialidades a incluir:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={filtros.especialidades.especialidadesSeleccionadas.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFiltro('especialidades', 'especialidadesSeleccionadas', []);
                        }
                      }}
                      className="rounded"
                    />
                    Todas las especialidades
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1 border-t pt-2">
                    {opciones.especialidades && opciones.especialidades.length > 0 ? (
                      opciones.especialidades.map(esp => (
                        <label key={esp} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filtros.especialidades.especialidadesSeleccionadas.includes(esp)}
                            onChange={(e) => {
                              const selected = filtros.especialidades.especialidadesSeleccionadas;
                              const newSelected = e.target.checked 
                                ? [...selected, esp]
                                : selected.filter(id => id !== esp);
                              updateFiltro('especialidades', 'especialidadesSeleccionadas', newSelected);
                            }}
                            className="rounded"
                          />
                          {esp}
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No hay especialidades disponibles</p>
                    )}
                  </div>
                </div>
              </div>

          
            </>
          )}

          {tipo === 'profesionales' && (
            <>
              {/* Métrica */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Métrica a analizar:</label>
                <div className="flex flex-wrap gap-2">
                  {(['consultas', 'pacientes', 'duracion', 'asistencia'] as const).map(metrica => (
                    <Button
                      key={metrica}
                      variant={filtros.profesionales.metrica === metrica ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('profesionales', 'metrica', metrica)}
                      className="text-xs"
                    >
                      {metrica === 'consultas' ? 'Consultas' : 
                       metrica === 'pacientes' ? 'Pacientes Únicos' :
                       metrica === 'duracion' ? 'Duración Promedio' : 'Tasa Asistencia'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Profesionales */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Profesionales a comparar:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={filtros.profesionales.profesionalesSeleccionados.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFiltro('profesionales', 'profesionalesSeleccionados', []);
                        }
                      }}
                      className="rounded"
                    />
                    Todos los profesionales
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1 border-t pt-2">
                    {opciones.profesionales && opciones.profesionales.length > 0 ? (
                      opciones.profesionales.map(prof => (
                        <label key={prof.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={filtros.profesionales.profesionalesSeleccionados.includes(prof.id)}
                            onChange={(e) => {
                              const selected = filtros.profesionales.profesionalesSeleccionados;
                              const newSelected = e.target.checked 
                                ? [...selected, prof.id]
                                : selected.filter(id => id !== prof.id);
                              updateFiltro('profesionales', 'profesionalesSeleccionados', newSelected);
                            }}
                            className="rounded"
                          />
                          {prof.nombre} - {prof.especialidad}
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No hay profesionales disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {tipo === 'patrones' && (
            <>
              {/* Dimensión */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Analizar por:</label>
                <div className="flex flex-wrap gap-2">
                  {(['horario', 'diasemana'] as const).map(dim => (
                    <Button
                      key={dim}
                      variant={filtros.patrones.dimension === dim ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFiltro('patrones', 'dimension', dim)}
                      className="text-xs"
                    >
                      {dim === 'horario' ? 'Horario' : 'Día Semana'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Profesional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Profesional:</label>
                <select 
                  value={filtros.patrones.profesional}
                  onChange={(e) => updateFiltro('patrones', 'profesional', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todos">Todos los profesionales</option>
                  {opciones.profesionales?.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} - {prof.especialidad}</option>
                  ))}
                </select>
              </div>

              {/* Especialidad */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Especialidad:</label>
                <select 
                  value={filtros.patrones.especialidad}
                  onChange={(e) => updateFiltro('patrones', 'especialidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="todas">Todas las especialidades</option>
                  {opciones.especialidades?.map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default function TendenciasCrecimientoTab({ dateFrom, dateTo }: TendenciasCrecimientoTabProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Datos adicionales para filtros
  const [profesionales, setProfesionales] = useState<DatoProfesional[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);

  // Función para obtener especialidades combinadas (API + las que vienen de la BD)
  const getEspecialidadesCombinadas = () => {
    const especialidadesDelAPI = data?.distribucionEspecialidades?.map(e => e.nombre) || [];
    const especialidadesUnicas = new Set([...especialidadesDelAPI, ...especialidades]);
    return Array.from(especialidadesUnicas).sort();
  };

  // Estados de filtros avanzados - Simplificados y funcionales
  const [filtros, setFiltros] = useState<FiltrosAvanzados>({
    evolucionTemporal: {
      periodo: 'mes',
      profesional: 'todos',
      especialidad: 'todas',
      estado: 'todos',
    },
    especialidades: {
      especialidadesSeleccionadas: [],
      periodo: 'mes',
    },
    profesionales: {
      profesionalesSeleccionados: [],
      metrica: 'consultas',
      periodo: 'mes',
      especialidad: 'todas',
      vistaGrafico: 'barras',
    },
    patrones: {
      dimension: 'horario',
      profesional: 'todos',
      especialidad: 'todas',
      periodo: 'mes',
    },
  });

  // Función para carga de datos con filtros reales
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir parámetros con filtros aplicados
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        periodo: filtros.evolucionTemporal.periodo,
        profesional: filtros.evolucionTemporal.profesional,
        especialidad: filtros.evolucionTemporal.especialidad,
        estado: filtros.evolucionTemporal.estado,
      });

      const response = await fetch(`/api/reportes/tendencias-crecimiento?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }
      
      const apiData = await response.json();
      setData(apiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filtros.evolucionTemporal]);

  // Función para cargar profesionales reales
  const fetchProfesionales = useCallback(async () => {
    try {
      const response = await fetch('/api/profesionales/stats');
      if (response.ok) {
        const data = await response.json();
        setProfesionales(data.profesionales);
      }
    } catch (err) {
      console.error('Error al cargar profesionales:', err);
    }
  }, []);

  // Función para cargar especialidades reales
  const fetchEspecialidades = useCallback(async () => {
    try {
      const response = await fetch('/api/especialidades');
      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data.especialidades.map((esp: { nombre: string }) => esp.nombre));
      }
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchProfesionales();
    fetchEspecialidades();
  }, [fetchData, fetchProfesionales, fetchEspecialidades]);

  // Actualizar datos cuando cambien los filtros
  useEffect(() => {
    fetchData();
  }, [filtros.evolucionTemporal, fetchData]);

  // Actualizar datos cuando cambien los filtros - Conectado al backend
  const handleFiltroChange = (nuevosFiltros: FiltrosAvanzados) => {
    setFiltros(nuevosFiltros);
    // Los datos se actualizarán automáticamente via useEffect
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-lg text-gray-600">Cargando análisis modular...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Error al cargar los datos</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const { 
    turnosPorMes, 
    crecimientoPacientes,
    // turnosPorHora, // Datos disponibles para futuras funcionalidades
    // turnosPorDia,  // Datos disponibles para futuras funcionalidades
    // distribucionEspecialidades, // No utilizado tras eliminar carta de especialidades
    estadisticasResumen 
  } = data;

  // Datos reales para especialidades según filtros (no utilizado tras eliminar la carta de especialidades)
  // const especialidadesFiltradas = filtros.especialidades.especialidadesSeleccionadas.length > 0
  //   ? distribucionEspecialidades?.filter(esp => filtros.especialidades.especialidadesSeleccionadas.includes(esp.nombre)) || []
  //   : distribucionEspecialidades || [];

  // Datos para gráficos (ya filtrados por el backend)
  const datosEvolucion = turnosPorMes || [];
  
  // Combinar datos para la gráfica comparativa de crecimiento
  const datosComparativos = turnosPorMes?.map(turno => {
    const crecimiento = crecimientoPacientes?.find(c => c.mes === turno.mes);
    return {
      mes: turno.mes,
      consultas: turno.total,
      pacientesNuevos: crecimiento?.nuevos || 0,
      totalPacientes: crecimiento?.total || 0,
      consultasCompletadas: turno.completados
    };
  }) || [];

  // Análisis de patrones reales basado en datos existentes
  const patronesReales = {
    mejorMes: turnosPorMes?.reduce((max, mes) => 
      mes.total > (max?.total || 0) ? mes : max, turnosPorMes[0]),
    peorMes: turnosPorMes?.reduce((min, mes) => 
      mes.total < (min?.total || Infinity) ? mes : min, turnosPorMes[0]),
    promedioMensual: turnosPorMes?.reduce((sum, mes) => sum + mes.total, 0) / (turnosPorMes?.length || 1) || 0,
    variabilidad: turnosPorMes?.length > 1 ? 
      Math.sqrt(turnosPorMes.reduce((sum, mes) => {
        const promedio = turnosPorMes.reduce((s, m) => s + m.total, 0) / turnosPorMes.length;
        return sum + Math.pow(mes.total - promedio, 2);
      }, 0) / turnosPorMes.length) : 0
  };
  
  // Los datos se cargan desde la API al montar el componente

  // Tooltip personalizado para gráficos
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number; dataKey?: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.dataKey?.includes('porcentaje') && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Fórmula de proyección explicada
  const proyeccionExplicacion = `
    Proyección basada en tendencia actual (${estadisticasResumen.tendenciaMensual.toFixed(1)}%) 
    ajustada con factor de estacionalidad para período: ${filtros.evolucionTemporal.periodo}. 
    Profesional: ${filtros.evolucionTemporal.profesional === 'todos' ? 'Todos' : profesionales.find(p => p.id === filtros.evolucionTemporal.profesional)?.nombre || 'N/A'}
  `;

  return (
    <div className="space-y-8">
      {/* Header con información de filtros activos */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">Análisis Modular de Tendencias</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Período:</strong> {filtros.evolucionTemporal.periodo.charAt(0).toUpperCase() + filtros.evolucionTemporal.periodo.slice(1)}</p>
              <p><strong>Profesional:</strong> {filtros.evolucionTemporal.profesional === 'todos' ? 'Todos' : profesionales.find(p => p.id === filtros.evolucionTemporal.profesional)?.nombre || 'N/A'}</p>
              <p><strong>Especialidad:</strong> {filtros.evolucionTemporal.especialidad === 'todas' ? 'Todas' : filtros.evolucionTemporal.especialidad}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Filtros Activos</div>
            <div className="flex flex-wrap gap-1 justify-end">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                {filtros.evolucionTemporal.periodo}
              </span>
              {filtros.evolucionTemporal.profesional !== 'todos' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Profesional específico
                </span>
              )}
              {filtros.evolucionTemporal.especialidad !== 'todas' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  Especialidad específica
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Variación de Consultas"
          value={`${estadisticasResumen.tendenciaMensual > 0 ? '+' : ''}${estadisticasResumen.tendenciaMensual.toFixed(1)}%`}
          change={estadisticasResumen.tendenciaMensual}
          subtitle={`Período: ${filtros.evolucionTemporal.periodo}`}
          Icon={TrendingUp}
          delay={0}
        />
        
        <MetricCard
          title="Pacientes Nuevos"
          value={estadisticasResumen.crecimientoPacientesUltimoMes}
          subtitle={`Crecimiento mensual`}
          Icon={Users}
          delay={100}
        />
        
        <MetricCard
          title="Consultas Resueltas"
          value={`${(() => {
            const completados = turnosPorMes?.reduce((sum, mes) => sum + mes.completados, 0) || 0;
            const cancelados = turnosPorMes?.reduce((sum, mes) => sum + mes.cancelados, 0) || 0;
            const total = turnosPorMes?.reduce((sum, mes) => sum + mes.total, 0) || 0;
            return total > 0 ? (((completados + cancelados) / total) * 100).toFixed(1) : '0';
          })()}%`}
          subtitle={`Del total de consultas`}
          Icon={Target}
          delay={200}
        />

        <MetricCard
          title="Saturación de Agenda"
          value={`${(() => {
            const totalConsultas = turnosPorMes?.reduce((sum, mes) => sum + mes.total, 0) || 0;
            const mesesConDatos = turnosPorMes?.length || 1;
            const promedioMensual = totalConsultas / mesesConDatos;
            // Asumiendo capacidad máxima promedio de 200 consultas por mes
            const capacidadMaxima = 200;
            return ((promedioMensual / capacidadMaxima) * 100).toFixed(1);
          })()}%`}
          subtitle="Uso de capacidad disponible"
          Icon={Zap}
          delay={300}
        />
      </div>

      {/* Proyección con explicación */}
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-emerald-100">
              <Zap className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-800">Proyección Modular</h3>
              <p className="text-sm text-gray-600">Análisis predictivo personalizable</p>
            </div>
          </div>
          <div className="text-right lg:text-center">
            <div className="text-3xl font-bold text-emerald-700 mb-1">
              {estadisticasResumen.prediccionProximoMes > 0 ? '+' : ''}
              {estadisticasResumen.prediccionProximoMes.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 max-w-md" title={proyeccionExplicacion}>
              Para {filtros.evolucionTemporal.periodo} | {filtros.evolucionTemporal.profesional === 'todos' ? 'Global' : 'Específico'}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales modulares */}
      <div className="space-y-8">
        {/* Evolución Temporal Modular */}
        <Card className="rounded-3xl border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-3 text-emerald-800">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-lg">Evolución Temporal Modular</span>
                <p className="text-sm text-gray-600 font-normal">
                  Por {filtros.evolucionTemporal.periodo} | {filtros.evolucionTemporal.estado} | 
                  {filtros.evolucionTemporal.profesional === 'todos' ? ' Todos' : ' Específico'}
                </p>
              </div>
            </CardTitle>
            <PanelFiltrosAvanzados 
              tipo="evolucion" 
              filtros={filtros} 
              setFiltros={handleFiltroChange}
              opciones={{ especialidades: getEspecialidadesCombinadas(), profesionales }}
            />
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={datosEvolucion} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradientModular" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Area
                  type="monotone"
                  dataKey="total"
                  fill="url(#gradientModular)"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Total"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="completados"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Completados"
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelados"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Cancelados"
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica Comparativa de Crecimiento */}
        <Card className="rounded-3xl border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-3 text-blue-800">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <span className="text-lg">Análisis Comparativo de Crecimiento</span>
                <p className="text-sm text-gray-600 font-normal">
                  Evolución de consultas vs. crecimiento de pacientes
                </p>
              </div>
              {/* Indicadores de las líneas */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Consultas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                  <span>Nuevos</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Total</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Estadísticas de comparación */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Métricas del Período</h4>
                
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="text-xl font-bold text-blue-700">
                    {datosComparativos.reduce((sum, item) => sum + item.consultas, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Consultas</div>
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="text-xl font-bold text-emerald-700">
                    {datosComparativos.reduce((sum, item) => sum + item.pacientesNuevos, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Pacientes Nuevos</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="text-xl font-bold text-purple-700">
                    {datosComparativos.length > 0 ? 
                      Math.round((datosComparativos.reduce((sum, item) => sum + item.pacientesNuevos, 0) / 
                      datosComparativos.reduce((sum, item) => sum + item.consultas, 0)) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Ratio Nuevos/Consultas</div>
                </div>
              </div>
              
              {/* Gráfica principal */}
              <div className="lg:col-span-3">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={datosComparativos} margin={{ top: 20, right: 50, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gradientConsultas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} label={{ value: 'Consultas', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} label={{ value: 'Pacientes', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-700 mb-2">{`${label}`}</p>
                              {payload.map((entry, index) => (
                                <p key={index} style={{ color: entry.color }}>
                                  {`${entry.name}: ${entry.value}`}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Área para consultas totales */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="consultas"
                      fill="url(#gradientConsultas)"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Consultas Totales"
                    />
                    
                    {/* Línea para pacientes nuevos */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pacientesNuevos"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Pacientes Nuevos"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                    
                    {/* Línea para total de pacientes */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalPacientes"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Total Pacientes Atendidos"
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights de Datos - Reestructurado y Responsive */}
      <Card className="rounded-3xl border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <CardTitle className="flex items-center gap-3 text-emerald-800">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-lg">Insights de Datos</span>
              <p className="text-sm text-gray-600 font-normal">Análisis basado en información real</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* Estadísticas Principales */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Estadísticas Principales</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-shadow">
                  <div className="text-sm text-gray-600 mb-1">Mejor Período</div>
                  <div className="text-2xl font-bold text-emerald-700 mb-1">
                    {patronesReales.mejorMes?.mes || 'N/A'}
                  </div>
                  <div className="text-sm text-emerald-600">
                    {patronesReales.mejorMes?.total || 0} consultas
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-shadow">
                  <div className="text-sm text-gray-600 mb-1">Promedio</div>
                  <div className="text-2xl font-bold text-blue-700 mb-1">
                    {Math.round(patronesReales.promedioMensual)}
                  </div>
                  <div className="text-sm text-blue-600">
                    consultas/período
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow">
                  <div className="text-sm text-gray-600 mb-1">Total Consultas</div>
                  <div className="text-2xl font-bold text-purple-700 mb-1">
                    {turnosPorMes?.reduce((sum, mes) => sum + mes.total, 0) || 0}
                  </div>
                  <div className="text-sm text-purple-600">
                    en período seleccionado
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-shadow">
                  <div className="text-sm text-gray-600 mb-1">Variabilidad</div>
                  <div className="text-2xl font-bold text-orange-700 mb-1">
                    {patronesReales.variabilidad ? Math.round(patronesReales.variabilidad) : 0}
                  </div>
                  <div className="text-sm text-orange-600">
                    desviación estándar
                  </div>
                </div>
              </div>
            </div>

            {/* Patrones Operativos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Patrones Operativos</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Hora más concurrida</div>
                      <div className="text-xl font-bold text-blue-700">
                        {estadisticasResumen.horasMasConcurridas?.[0] || 'Analizando...'}
                      </div>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Día más activo</div>
                      <div className="text-xl font-bold text-green-700">
                        {estadisticasResumen.diasMasConcurridos?.[0] || 'Analizando...'}
                      </div>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-600 mb-1">Especialidad líder</div>
                      <div className="text-lg font-bold text-purple-700 truncate" title={estadisticasResumen.especialidadMasPopular}>
                        {estadisticasResumen.especialidadMasPopular || 'Analizando...'}
                      </div>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg ml-2">
                      <Stethoscope className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado de Consultas */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Estado de Consultas</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Desglose de Estados */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución por Estado</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                      <div className="text-2xl font-bold text-green-700 mb-1">
                        {turnosPorMes?.reduce((sum, mes) => sum + mes.completados, 0) || 0}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">Completadas</div>
                      <div className="text-sm font-semibold text-green-600">
                        {turnosPorMes && turnosPorMes.length > 0 ? 
                          ((turnosPorMes.reduce((sum, mes) => sum + mes.completados, 0) / 
                            turnosPorMes.reduce((sum, mes) => sum + mes.total, 0)) * 100).toFixed(1) 
                          : '0'}%
                      </div>
                    </div>
                    
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
                      <div className="text-2xl font-bold text-red-700 mb-1">
                        {turnosPorMes?.reduce((sum, mes) => sum + mes.cancelados, 0) || 0}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">Canceladas</div>
                      <div className="text-sm font-semibold text-red-600">
                        {turnosPorMes && turnosPorMes.length > 0 ? 
                          ((turnosPorMes.reduce((sum, mes) => sum + mes.cancelados, 0) / 
                            turnosPorMes.reduce((sum, mes) => sum + mes.total, 0)) * 100).toFixed(1) 
                          : '0'}%
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                      <div className="text-2xl font-bold text-amber-700 mb-1">
                        {(turnosPorMes?.reduce((sum, mes) => sum + mes.total, 0) || 0) - 
                         (turnosPorMes?.reduce((sum, mes) => sum + mes.completados + mes.cancelados, 0) || 0)}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">Programadas</div>
                      <div className="text-sm font-semibold text-amber-600">
                        {turnosPorMes && turnosPorMes.length > 0 ? 
                          (((turnosPorMes.reduce((sum, mes) => sum + mes.total, 0) - 
                             turnosPorMes.reduce((sum, mes) => sum + mes.completados + mes.cancelados, 0)) / 
                            turnosPorMes.reduce((sum, mes) => sum + mes.total, 0)) * 100).toFixed(1) 
                          : '0'}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Eficiencia de Resolución */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Eficiencia de resolución</span>
                      <span className="text-lg font-bold text-green-700">
                        {(() => {
                          const completados = turnosPorMes?.reduce((sum, mes) => sum + mes.completados, 0) || 0;
                          const cancelados = turnosPorMes?.reduce((sum, mes) => sum + mes.cancelados, 0) || 0;
                          const resueltos = completados + cancelados;
                          return resueltos > 0 ? ((completados / resueltos) * 100).toFixed(1) : '0';
                        })()}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${(() => {
                            const completados = turnosPorMes?.reduce((sum, mes) => sum + mes.completados, 0) || 0;
                            const cancelados = turnosPorMes?.reduce((sum, mes) => sum + mes.cancelados, 0) || 0;
                            const resueltos = completados + cancelados;
                            return resueltos > 0 ? (completados / resueltos) * 100 : 0;
                          })()}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 text-center">
                      De las consultas resueltas, qué porcentaje fue exitoso
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </CardContent>
            </Card>
          </div>
  );
}