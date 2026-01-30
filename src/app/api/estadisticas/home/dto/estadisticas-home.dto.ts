export type EstadisticasHomeResponse = {
  pacientes: {
    activos: number;
    inactivos: number;
    total: number;
  };
  consultas: {
    mesActual: number;
    mesAnterior: number;
    variacionPct: number | null;

    // ✅ nuevos (últimos 30 días)
    totalUltimos30d: number;
    promedioDiario30d: number;
    maxDiario30d: number;
    tendencia7dPct: number | null;
  };
  series: {
    consultasUltimos30Dias: Array<{ date: string; count: number }>;
    pacientesNuevosUltimos30Dias: Array<{ date: string; count: number }>;
  };
  resumen: {
    pacientesNuevos30d: number;
  };
};
