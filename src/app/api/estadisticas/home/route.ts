import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EstadisticasHomeResponse } from "./dto/estadisticas-home.dto";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}
function formatYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    const now = new Date();

    // Rangos
    const monthStart = startOfMonth(now);
    const nextMonthStart = startOfNextMonth(now);

    const prevMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStart = startOfMonth(prevMonthRef);
    const prevNextMonthStart = startOfNextMonth(prevMonthRef);

    const last30Start = startOfDay(addDays(now, -29)); // incluye hoy (30 días)
    const tomorrowStart = startOfDay(addDays(now, 1)); // para <= hoy

    // 1) Pacientes activos / inactivos
    const [activos, inactivos] = await Promise.all([
      prisma.paciente.count({ where: { estadoPaciente: true } }),
      prisma.paciente.count({ where: { estadoPaciente: false } }),
    ]);

    // 2) Consultas mes actual / anterior (comparación mensual)
    const [mesActual, mesAnterior] = await Promise.all([
      prisma.consultas.count({
        where: { fechaHoraConsulta: { gte: monthStart, lt: nextMonthStart } },
      }),
      prisma.consultas.count({
        where: { fechaHoraConsulta: { gte: prevMonthStart, lt: prevNextMonthStart } },
      }),
    ]);

    const variacionPct =
      mesAnterior === 0
        ? null
        : Math.round(((mesActual - mesAnterior) / mesAnterior) * 100);

    // Helper para armar serie diaria completa (rellenando 0)
    function buildEmptySeries30d() {
      const arr: Array<{ date: string; count: number }> = [];
      for (let i = 0; i < 30; i++) {
        const day = addDays(last30Start, i);
        arr.push({ date: formatYYYYMMDD(day), count: 0 });
      }
      return arr;
    }

    // 3) Serie consultas últimos 30 días
    const consultas30Raw = await prisma.consultas.findMany({
      where: { fechaHoraConsulta: { gte: last30Start, lt: tomorrowStart } },
      select: { fechaHoraConsulta: true },
    });

    const consultasMap = new Map<string, number>();
    for (const r of consultas30Raw) {
      const key = formatYYYYMMDD(startOfDay(r.fechaHoraConsulta));
      consultasMap.set(key, (consultasMap.get(key) ?? 0) + 1);
    }

    const consultasUltimos30Dias = buildEmptySeries30d().map((p) => ({
      ...p,
      count: consultasMap.get(p.date) ?? 0,
    }));

    // ✅ NUEVO: métricas “últimos 30 días” (para que no repita el mesActual)
    const totalUltimos30d = consultasUltimos30Dias.reduce((acc, x) => acc + (x.count ?? 0), 0);
    const promedioDiario30d = totalUltimos30d / 30;
    const maxDiario30d = consultasUltimos30Dias.reduce((m, x) => Math.max(m, x.count ?? 0), 0);

    // Tendencia últimos 7 días vs 7 anteriores (ritmo reciente)
    const counts = consultasUltimos30Dias.map((x) => x.count ?? 0);
    const last7 = counts.slice(-7);
    const prev7 = counts.slice(-14, -7);

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const last7Avg = avg(last7);
    const prev7Avg = avg(prev7);

    const tendencia7dPct =
      prev7.length < 7
        ? null
        : prev7Avg === 0
        ? last7Avg === 0
          ? 0
          : 100
        : Math.round(((last7Avg - prev7Avg) / prev7Avg) * 100);

    // 4) Pacientes nuevos últimos 30 días
    const pacientes30Raw = await prisma.paciente.findMany({
      where: { fechaHoraPaciente: { gte: last30Start, lt: tomorrowStart } },
      select: { fechaHoraPaciente: true },
    });

    const pacientesMap = new Map<string, number>();
    for (const r of pacientes30Raw) {
      const key = formatYYYYMMDD(startOfDay(r.fechaHoraPaciente));
      pacientesMap.set(key, (pacientesMap.get(key) ?? 0) + 1);
    }

    const pacientesNuevosUltimos30Dias = buildEmptySeries30d().map((p) => ({
      ...p,
      count: pacientesMap.get(p.date) ?? 0,
    }));

    const totalNuevos30d = pacientes30Raw.length;

    const response: EstadisticasHomeResponse = {
      pacientes: {
        activos,
        inactivos,
        total: activos + inactivos,
      },
      consultas: {
        mesActual,
        mesAnterior,
        variacionPct, // mensual
        totalUltimos30d, // ✅ nuevo
        promedioDiario30d: Number(promedioDiario30d.toFixed(2)), // ✅ nuevo
        maxDiario30d, // ✅ nuevo
        tendencia7dPct, // ✅ nuevo
      },
      series: {
        consultasUltimos30Dias,
        pacientesNuevosUltimos30Dias,
      },
      resumen: {
        pacientesNuevos30d: totalNuevos30d,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/estadisticas/home error:", error);
    return NextResponse.json({ message: "Error obteniendo estadísticas" }, { status: 500 });
  }
}
