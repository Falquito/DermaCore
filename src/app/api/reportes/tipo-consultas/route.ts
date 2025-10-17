import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasRole } from '@/lib/auth'

interface TipoConsultaData {
  tipo: string
  cantidad: number
  porcentaje: number
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

    // Obtener datos de citas completadas
    const appointments = await prisma.appointment.findMany({
      where: {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
        estado: 'COMPLETADO',
      },
      select: {
        tipoConsulta: true,
      },
    })

    // Agrupar por tipo
    const grouped: Record<string, number> = {}
    appointments.forEach((apt) => {
      const tipo = apt.tipoConsulta === 'PARTICULAR' ? 'Particular' : 'Obra Social'
      grouped[tipo] = (grouped[tipo] || 0) + 1
    })

    const total = appointments.length

    // Convertir a array con porcentajes
    const results: TipoConsultaData[] = Object.entries(grouped).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
    }))

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Error en reporte de tipo de consultas:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte de tipo de consultas' },
      { status: 500 }
    )
  }
}
