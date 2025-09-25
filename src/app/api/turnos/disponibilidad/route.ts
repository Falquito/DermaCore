import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AppointmentStatus } from '@prisma/client'

// GET /api/turnos/disponibilidad - Obtener horarios disponibles
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get('profesionalId')
    const fecha = searchParams.get('fecha')
    
    if (!profesionalId || !fecha) {
      return NextResponse.json({ 
        error: 'Se requiere profesionalId y fecha' 
      }, { status: 400 })
    }

    // Obtener la fecha sin hora
    const fechaSeleccionada = new Date(fecha)
    const fechaInicio = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate(), 0, 0, 0)
    const fechaFin = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate(), 23, 59, 59)

    // Obtener turnos existentes para ese profesional y fecha
    const turnosExistentes = await prisma.appointment.findMany({
      where: {
        profesionalId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        estado: {
          notIn: [AppointmentStatus.CANCELADO, AppointmentStatus.NO_ASISTIO]
        }
      },
      select: {
        fecha: true,
        duracion: true
      }
    })

    // Generar horarios disponibles (de 8:00 a 18:00, cada 30 minutos)
    const horariosDisponibles = []
    const horaInicio = 8 // 8:00 AM
    const horaFin = 18   // 6:00 PM
    const intervalo = 30 // minutos

    for (let hora = horaInicio; hora < horaFin; hora++) {
      for (let minuto = 0; minuto < 60; minuto += intervalo) {
        const fechaHora = new Date(fechaSeleccionada)
        fechaHora.setHours(hora, minuto, 0, 0)
        
        // Verificar si este horario está ocupado
        const estaOcupado = turnosExistentes.some(turno => {
          const inicioTurno = new Date(turno.fecha)
          const finTurno = new Date(inicioTurno.getTime() + (turno.duracion || 30) * 60000)
          
          return fechaHora >= inicioTurno && fechaHora < finTurno
        })

        // Solo incluir horarios futuros
        const ahora = new Date()
        const esFuturo = fechaHora > ahora

        horariosDisponibles.push({
          fecha: fechaHora.toISOString(),
          hora: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
          disponible: !estaOcupado && esFuturo,
          profesionalId
        })
      }
    }

    return NextResponse.json({ horarios: horariosDisponibles })
    
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error)
    return NextResponse.json({ error: 'Error al cargar la disponibilidad' }, { status: 500 })
  }
}