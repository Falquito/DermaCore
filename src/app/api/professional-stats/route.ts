// app/api/professional-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.roles.includes('PROFESIONAL')) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const allTime = searchParams.get('allTime') === '1'

    // Default to last 30 days if no dates provided
    const defaultFrom = new Date()
    defaultFrom.setDate(defaultFrom.getDate() - 30)
    const defaultTo = new Date()

  let fromDate = dateFrom ? new Date(dateFrom) : defaultFrom
  let toDate = dateTo ? new Date(dateTo) : defaultTo

  // Normalizar a rango completo de días (inicio y fin)
  fromDate.setHours(0, 0, 0, 0)
  toDate.setHours(23, 59, 59, 999)

    // If allTime flag: determine min/max fechas for this profesional
    if (allTime) {
      const extremes = await prisma.appointment.findMany({
        where: { profesionalId: currentUser.id },
        select: { fecha: true },
        orderBy: { fecha: 'asc' }
      })
      if (extremes.length > 0) {
        fromDate = extremes[0].fecha
        toDate = extremes[extremes.length - 1].fecha
        fromDate.setHours(0,0,0,0)
        toDate.setHours(23,59,59,999)
      }
    }

    // Get appointments for the professional in the selected date range (for aggregated stats)
    const appointments = await prisma.appointment.findMany({
      where: {
        profesionalId: currentUser.id,
        fecha: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        obraSocial: { select: { id: true, nombre: true } },
        paciente: { select: { nombre: true, apellido: true, fechaNacimiento: true } }
      }
    })

    // Calculate statistics
    const totalAppointments = appointments.length
    
    // Count by status
    const statusCounts = appointments.reduce((acc, appointment) => {
      acc[appointment.estado] = (acc[appointment.estado] || 0) + 1
      return acc
    }, {} as Record<AppointmentStatus, number>)

    // Count by obra social
    const obraSocialCounts = appointments.reduce((acc, appointment) => {
      const obraSocialName = appointment.obraSocial?.nombre || 'Particular'
      acc[obraSocialName] = (acc[obraSocialName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate percentages for obra social
    const obraSocialPercentages = Object.entries(obraSocialCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0
    }))

    // Calculate completion rate
    const completedAppointments = statusCounts[AppointmentStatus.COMPLETADO] || 0
    const cancelledAppointments = (statusCounts[AppointmentStatus.CANCELADO] || 0) + 
                                  (statusCounts[AppointmentStatus.NO_ASISTIO] || 0)
    const completionRate = totalAppointments > 0 ? 
      Math.round((completedAppointments / totalAppointments) * 100) : 0
    const cancellationRate = totalAppointments > 0 ? 
      Math.round((cancelledAppointments / totalAppointments) * 100) : 0

    // Recent appointments (last 5 overall - independent of date filter)
    const now = new Date()
    const recentOverall = await prisma.appointment.findMany({
      where: { 
        profesionalId: currentUser.id,
        fecha: { lte: now }
      },
      orderBy: { fecha: 'desc' },
      take: 5,
      include: {
        obraSocial: { select: { nombre: true } },
        paciente: { select: { nombre: true, apellido: true } }
      }
    })

    const recentAppointments = recentOverall.map(appointment => ({
      id: appointment.id,
      fecha: appointment.fecha,
      paciente: `${appointment.paciente.apellido}, ${appointment.paciente.nombre}`,
      estado: appointment.estado,
      motivo: appointment.motivo,
      obraSocial: appointment.obraSocial?.nombre || 'Particular'
    }))

    // Consultas por período
    const consultationsByPeriod = await prisma.appointment.groupBy({
        by: ['fecha'],
        where: {
            profesionalId: currentUser.id,
            fecha: {
                gte: fromDate,
                lte: toDate,
            },
        },
        _count: {
            id: true,
        },
        orderBy: {
            fecha: 'asc',
        },
    });

    const stats = {
      dateRange: {
        from: fromDate,
        to: toDate,
        allTime
      },
      totalAppointments,
      statusCounts,
      obraSocialPercentages,
      completionRate,
      cancellationRate,
      recentAppointments,
      dailyCounts: consultationsByPeriod.map(c => ({ date: c.fecha, count: c._count.id })),
      appointments: appointments.map(a => ({
        id: a.id,
        fecha: a.fecha,
        estado: a.estado,
        tipoConsulta: a.tipoConsulta,
        // --- CAMBIO CLAVE AQUÍ ---
        // Se envía el objeto completo en lugar de solo el nombre
        obraSocial: a.obraSocial, 
        paciente: {
          nombre: a.paciente?.nombre,
          apellido: a.paciente?.apellido,
          fechaNacimiento: a.paciente?.fechaNacimiento || null
        }
      })),
      // Additional metrics
      averageDaily: totalAppointments > 0 ? 
        Math.round(totalAppointments / Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)))) : 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching professional stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}