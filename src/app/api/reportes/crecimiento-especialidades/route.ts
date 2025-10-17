import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasRole } from '@/lib/auth'

interface CrecimientoData {
  mes: string
  especialidad: string
  consultas: number
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
    const periodo = searchParams.get('periodo') || 'mes'
    const especialidad = searchParams.get('especialidad') || 'todas'

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
        ...(especialidad !== 'todas' && {
          profesional: {
            especialidad: {
              nombre: especialidad,
            },
          },
        }),
      },
      include: {
        profesional: {
          include: {
            especialidad: true,
          },
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    })

    // Agrupar datos por período y especialidad
    const groupedData: Record<string, Record<string, number>> = {}

    appointments.forEach((apt) => {
      const fecha = new Date(apt.fecha)
      let periodoKey: string

      // Determinar clave del período según agrupación
      switch (periodo) {
        case 'trimestre': {
          const trimestre = Math.floor(fecha.getMonth() / 3) + 1
          periodoKey = `${fecha.getFullYear()}-T${trimestre}`
          break
        }
        case 'semestre': {
          const semestre = fecha.getMonth() < 6 ? 1 : 2
          periodoKey = `${fecha.getFullYear()}-S${semestre}`
          break
        }
        default: { // mes
          periodoKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        }
      }

      const espNombre = apt.profesional.especialidad?.nombre || 'Sin especialidad'

      if (!groupedData[periodoKey]) {
        groupedData[periodoKey] = {}
      }
      if (!groupedData[periodoKey][espNombre]) {
        groupedData[periodoKey][espNombre] = 0
      }
      groupedData[periodoKey][espNombre]++
    })

    // Convertir a array de resultados
    const results: CrecimientoData[] = []
    Object.entries(groupedData).forEach(([mes, especialidades]) => {
      Object.entries(especialidades).forEach(([especialidadNombre, consultas]) => {
        results.push({
          mes,
          especialidad: especialidadNombre,
          consultas,
        })
      })
    })

    // Ordenar por mes
    results.sort((a, b) => a.mes.localeCompare(b.mes))

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Error en reporte de crecimiento:', error)
    return NextResponse.json(
      { error: 'Error al generar reporte de crecimiento' },
      { status: 500 }
    )
  }
}
