import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasRole } from '@/lib/auth'

interface ScoreboardMetrics {
  crecimientoConsultas: number
  crecimientoPacientes: number
  consultasPromedioDia: number
  tasaRetencion: number
}

export async function GET(request: Request) {
  try {
    // Validar autenticación y autorización
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (!userHasRole(user.roles, 'GERENTE')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Faltan parámetros de fecha' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)

    // Calcular período anterior
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
    const prevEndDate = new Date(startDate)
    prevEndDate.setDate(prevEndDate.getDate() - 1)
    prevEndDate.setHours(23, 59, 59, 999)

    // Consultas período actual
    const currentConsultas = await prisma.appointment.count({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
        estado: 'COMPLETADO',
      },
    })

    // Consultas período anterior
    const previousConsultas = await prisma.appointment.count({
      where: {
        fecha: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        estado: 'COMPLETADO',
      },
    })

    // Pacientes únicos período actual
    const currentPacientes = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
        estado: 'COMPLETADO',
      },
      select: {
        pacienteId: true,
      },
      distinct: ['pacienteId'],
    })

    // Pacientes únicos período anterior
    const previousPacientes = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        estado: 'COMPLETADO',
      },
      select: {
        pacienteId: true,
      },
      distinct: ['pacienteId'],
    })

    // Calcular crecimiento
    const crecimientoConsultas = previousConsultas > 0
      ? ((currentConsultas - previousConsultas) / previousConsultas) * 100
      : currentConsultas > 0 ? 100 : 0

    const crecimientoPacientes = previousPacientes.length > 0
      ? ((currentPacientes.length - previousPacientes.length) / previousPacientes.length) * 100
      : currentPacientes.length > 0 ? 100 : 0

    // Promedio de consultas por día
    const consultasPromedioDia = daysDiff > 0 ? currentConsultas / daysDiff : 0

    // Tasa de retención (pacientes que tuvieron más de una consulta)
    const pacientesConMultiplesConsultas = await prisma.appointment.groupBy({
      by: ['pacienteId'],
      where: {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
        estado: 'COMPLETADO',
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    })

    const tasaRetencion = currentPacientes.length > 0
      ? (pacientesConMultiplesConsultas.length / currentPacientes.length) * 100
      : 0

    const metrics: ScoreboardMetrics = {
      crecimientoConsultas,
      crecimientoPacientes,
      consultasPromedioDia: Math.round(consultasPromedioDia * 10) / 10,
      tasaRetencion,
    }

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error) {
    console.error('Error en scoreboard de crecimiento:', error)
    return NextResponse.json(
      { error: 'Error al generar scoreboard de crecimiento' },
      { status: 500 }
    )
  }
}
