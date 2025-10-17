import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { AppointmentStatus } from '@prisma/client';
import { startOfMonth, subMonths, format, getHours } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    // 1. Turnos por mes (últimos 6 meses)
    const mesesMap = new Map<string, { total: number; completados: number; cancelados: number }>();
    
    for (let i = 5; i >= 0; i--) {
      const mesDate = subMonths(now, i);
      const mesKey = format(mesDate, 'MMM', { locale: es });
      mesesMap.set(mesKey, { total: 0, completados: 0, cancelados: 0 });
    }

    const turnosDetallados = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        fecha: true,
        estado: true,
      },
    });

    turnosDetallados.forEach((turno) => {
      const mesKey = format(turno.fecha, 'MMM', { locale: es });
      const data = mesesMap.get(mesKey);
      if (data) {
        data.total++;
        if (turno.estado === AppointmentStatus.COMPLETADO) {
          data.completados++;
        } else if (turno.estado === AppointmentStatus.CANCELADO) {
          data.cancelados++;
        }
      }
    });

    const turnosPorMesArray = Array.from(mesesMap.entries()).map(([mes, datos]) => ({
      mes,
      ...datos,
    }));

    // 2. Turnos por hora del día
    const todosTurnos = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: subMonths(now, 3),
        },
        estado: {
          notIn: [AppointmentStatus.CANCELADO],
        },
      },
      select: {
        fecha: true,
      },
    });

    const horasMap = new Map<number, number>();
    for (let h = 8; h <= 20; h++) {
      horasMap.set(h, 0);
    }

    todosTurnos.forEach((turno) => {
      const hora = getHours(turno.fecha);
      if (hora >= 8 && hora <= 20) {
        horasMap.set(hora, (horasMap.get(hora) || 0) + 1);
      }
    });

    const turnosPorHora = Array.from(horasMap.entries())
      .map(([hora, cantidad]) => ({
        hora: `${hora}:00`,
        cantidad,
      }))
      .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

    // 3. Turnos por día de la semana
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const diasMap = new Map<number, number>();
    for (let d = 0; d < 7; d++) {
      diasMap.set(d, 0);
    }

    todosTurnos.forEach((turno) => {
      const diaSemana = (turno.fecha.getDay() + 6) % 7; // Ajustar para que Lunes sea 0
      diasMap.set(diaSemana, (diasMap.get(diaSemana) || 0) + 1);
    });

    const turnosPorDia = Array.from(diasMap.entries()).map(([dia, cantidad]) => ({
      dia: diasSemana[dia],
      cantidad,
    }));

    // 4. Crecimiento de pacientes
    const pacientesMap = new Map<string, { nuevos: number; total: number }>();
    let acumulado = await prisma.patient.count({
      where: {
        createdAt: {
          lt: sixMonthsAgo,
        },
      },
    });

    for (let i = 5; i >= 0; i--) {
      const mesDate = subMonths(now, i);
      const mesKey = format(mesDate, 'MMM', { locale: es });
      const inicioMes = startOfMonth(mesDate);
      const finMes = startOfMonth(subMonths(mesDate, -1));

      const nuevos = await prisma.patient.count({
        where: {
          createdAt: {
            gte: inicioMes,
            lt: finMes,
          },
        },
      });

      acumulado += nuevos;
      pacientesMap.set(mesKey, { nuevos, total: acumulado });
    }

    const crecimientoPacientes = Array.from(pacientesMap.entries()).map(([mes, datos]) => ({
      mes,
      ...datos,
    }));

    // 5. Distribución por especialidades
    const turnosPorEspecialidad = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: subMonths(now, 3),
        },
        estado: {
          notIn: [AppointmentStatus.CANCELADO],
        },
      },
      select: {
        profesional: {
          select: {
            especialidad: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
    });

    const especialidadesMap = new Map<string, number>();
    let totalTurnos = 0;

    turnosPorEspecialidad.forEach((turno) => {
      const especialidad = turno.profesional.especialidad?.nombre || 'Sin especialidad';
      especialidadesMap.set(especialidad, (especialidadesMap.get(especialidad) || 0) + 1);
      totalTurnos++;
    });

    const distribucionEspecialidades = Array.from(especialidadesMap.entries())
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: totalTurnos > 0 ? (cantidad / totalTurnos) * 100 : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);

    // 6. Tiempo promedio por especialidad
    const tiemposPorEspecialidad = await prisma.appointment.groupBy({
      by: ['profesionalId'],
      where: {
        fecha: {
          gte: subMonths(now, 3),
        },
        estado: AppointmentStatus.COMPLETADO,
      },
      _avg: {
        duracion: true,
      },
    });

    const profesionalesEspecialidades = await prisma.user.findMany({
      where: {
        id: {
          in: tiemposPorEspecialidad.map((t) => t.profesionalId),
        },
      },
      select: {
        id: true,
        especialidad: {
          select: {
            nombre: true,
          },
        },
      },
    });

    const tiemposPorEspecialidadMap = new Map<string, { total: number; count: number }>();

    tiemposPorEspecialidad.forEach((tiempo) => {
      const profesional = profesionalesEspecialidades.find((p) => p.id === tiempo.profesionalId);
      const especialidad = profesional?.especialidad?.nombre || 'Sin especialidad';
      const duracion = tiempo._avg.duracion || 30;

      const data = tiemposPorEspecialidadMap.get(especialidad) || { total: 0, count: 0 };
      data.total += duracion;
      data.count++;
      tiemposPorEspecialidadMap.set(especialidad, data);
    });

    const tiempoPromedioPorEspecialidad = Array.from(tiemposPorEspecialidadMap.entries())
      .map(([especialidad, datos]) => ({
        especialidad,
        minutos: Math.round(datos.total / datos.count),
      }))
      .sort((a, b) => b.minutos - a.minutos)
      .slice(0, 6);

    // 7. Tasa de asistencia mensual
    const asistenciaPorMes = new Map<string, { asistencia: number; noAsistio: number }>();

    for (let i = 5; i >= 0; i--) {
      const mesDate = subMonths(now, i);
      const mesKey = format(mesDate, 'MMM', { locale: es });
      asistenciaPorMes.set(mesKey, { asistencia: 0, noAsistio: 0 });
    }

    turnosDetallados.forEach((turno) => {
      const mesKey = format(turno.fecha, 'MMM', { locale: es });
      const data = asistenciaPorMes.get(mesKey);
      if (data) {
        if (turno.estado === AppointmentStatus.COMPLETADO || turno.estado === AppointmentStatus.CONFIRMADO) {
          data.asistencia++;
        } else if (turno.estado === AppointmentStatus.NO_ASISTIO) {
          data.noAsistio++;
        }
      }
    });

    const tasaAsistencia = Array.from(asistenciaPorMes.entries()).map(([mes, datos]) => ({
      mes,
      ...datos,
    }));

    // 8. Estadísticas resumen
    const mesActual = turnosPorMesArray[turnosPorMesArray.length - 1]?.total || 0;
    const mesAnterior = turnosPorMesArray[turnosPorMesArray.length - 2]?.total || 1;
    const tendenciaMensual = ((mesActual - mesAnterior) / mesAnterior) * 100;

    const horasOrdenadas = [...turnosPorHora].sort((a, b) => b.cantidad - a.cantidad);
    const horasMasConcurridas = horasOrdenadas.slice(0, 3).map((h) => h.hora);

    const diasOrdenados = [...turnosPorDia].sort((a, b) => b.cantidad - a.cantidad);
    const diasMasConcurridos = diasOrdenados.slice(0, 3).map((d) => d.dia);

    const especialidadMasPopular = distribucionEspecialidades[0]?.nombre || 'N/A';

    const totalAsistencia = tasaAsistencia.reduce((sum, t) => sum + t.asistencia, 0);
    const totalNoAsistio = tasaAsistencia.reduce((sum, t) => sum + t.noAsistio, 0);
    const tasaAsistenciaPromedio =
      totalAsistencia + totalNoAsistio > 0
        ? (totalAsistencia / (totalAsistencia + totalNoAsistio)) * 100
        : 0;

    // Métricas adicionales de valor
    const crecimientoPacientesUltimoMes = crecimientoPacientes[crecimientoPacientes.length - 1]?.nuevos || 0;
    const promedioHoraPeak = horasOrdenadas[0]?.cantidad || 0;
    const ingresosPotencialesHoraPeak = promedioHoraPeak * 45; // Estimado $45 por consulta
    const eficienciaOperativa = Math.min(95, 70 + (tasaAsistenciaPromedio * 0.3)); // Fórmula basada en asistencia
    const prediccionProximoMes = tendenciaMensual * 1.1; // Proyección conservadora

    return NextResponse.json({
      turnosPorMes: turnosPorMesArray,
      turnosPorHora,
      turnosPorDia,
      crecimientoPacientes,
      distribucionEspecialidades,
      tiempoPromedioPorEspecialidad,
      tasaAsistencia,
      estadisticasResumen: {
        tendenciaMensual,
        horasMasConcurridas,
        diasMasConcurridos,
        especialidadMasPopular,
        tasaAsistenciaPromedio,
        crecimientoPacientesUltimoMes,
        ingresosPotencialesHoraPeak,
        eficienciaOperativa,
        prediccionProximoMes,
      },
    });
  } catch (error) {
    console.error('Error al obtener tendencias:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de tendencias' },
      { status: 500 }
    );
  }
}
