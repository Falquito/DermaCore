import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasRole } from '@/lib/auth'

interface ObraSocialData {
  obraSocial: string
  consultas: number
  pacientes: number
  crecimiento: number
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
    const vista = searchParams.get('vista') || 'top10'

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Faltan parámetros de fecha' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)

    // Calcular período anterior para comparación
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
    const prevEndDate = new Date(startDate)
    prevEndDate.setHours(23, 59, 59, 999)

    // Obtener datos del período actual
    const currentAppointments = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
        estado: 'COMPLETADO',
        obraSocialId: {
          not: null,
        },
      },
      include: {
        obraSocial: true,
        paciente: true,
      },
    })

    // Obtener datos del período anterior
    const previousAppointments = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
        estado: 'COMPLETADO',
        obraSocialId: {
          not: null,
        },
      },
      include: {
        obraSocial: true,
      },
    })

    // Agrupar datos actuales
    const currentData: Record<string, { consultas: number; pacientes: Set<string> }> = {}
    currentAppointments.forEach((apt) => {
      const obraSocialNombre = apt.obraSocial?.nombre || 'Sin obra social'
      if (!currentData[obraSocialNombre]) {
        currentData[obraSocialNombre] = { consultas: 0, pacientes: new Set() }
      }
      currentData[obraSocialNombre].consultas++
      currentData[obraSocialNombre].pacientes.add(apt.pacienteId)
    })

    // Agrupar datos anteriores
    const previousData: Record<string, number> = {}
    previousAppointments.forEach((apt) => {
      const obraSocialNombre = apt.obraSocial?.nombre || 'Sin obra social'
      previousData[obraSocialNombre] = (previousData[obraSocialNombre] || 0) + 1
    })

    // Calcular resultados con crecimiento
    const results: ObraSocialData[] = Object.entries(currentData).map(([obraSocial, data]) => {
      const consultasActuales = data.consultas
      const consultasAnteriores = previousData[obraSocial] || 0
      const crecimiento = consultasAnteriores > 0
        ? ((consultasActuales - consultasAnteriores) / consultasAnteriores) * 100
        : consultasActuales > 0 ? 100 : 0

      return {
        obraSocial,
        consultas: consultasActuales,
        pacientes: data.pacientes.size,
        crecimiento,
      }
    })

    // Ordenar por número de consultas descendente
    results.sort((a, b) => b.consultas - a.consultas)

    // Aplicar filtro de vista
    let filteredResults = results
    if (vista === 'top5') {
      filteredResults = results.slice(0, 5)
    } else if (vista === 'top10') {
      filteredResults = results.slice(0, 10)
    }

    return NextResponse.json({
      success: true,
      data: filteredResults,
    })
  } catch (error) {
    console.error('Error en reporte de obras sociales:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte de obras sociales' },
      { status: 500 }
    )
  }
}
