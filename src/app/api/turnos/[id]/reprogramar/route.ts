import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Define validation schema for rescheduling
const rescheduleSchema = z.object({
  fecha: z.string().datetime(),
  profesionalId: z.string(),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
})

type RescheduleContext = { params: { id: string } } | { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: RescheduleContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get appointment ID from params
    const { id } = context.params instanceof Promise 
      ? await context.params 
      : context.params

    // Get and validate request body
    const body = await request.json()
    const validatedData = rescheduleSchema.parse(body)

    // Check if appointment exists and can be rescheduled
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        obraSocialId: true,
        numeroAfiliado: true,
        tipoConsulta: true,
        copago: true,
        autorizacion: true,
        pacienteId: true,
        createdBy: true,
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    if (appointment.estado === 'COMPLETADO' || appointment.estado === 'CANCELADO') {
      return NextResponse.json(
        { error: 'No se puede reprogramar un turno completado o cancelado' },
        { status: 400 }
      )
    }

    // Check if there's already an appointment at the same time for the same professional
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: { not: id }, // Excluir el turno actual
        profesionalId: validatedData.profesionalId,
        fecha: new Date(validatedData.fecha),
        estado: {
          notIn: ['CANCELADO', 'COMPLETADO'] // Solo considerar turnos activos
        }
      }
    })

    if (existingAppointment) {
      return NextResponse.json(
        { 
          error: 'Ya existe un turno asignado para este profesional en ese horario',
          details: 'Por favor, seleccione otro horario o profesional'
        },
        { status: 409 }
      )
    }

    // Update appointment with new date and professional
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        fecha: new Date(validatedData.fecha),
        profesionalId: validatedData.profesionalId,
        duracion: 30, // Duración fija de 30 minutos
        motivo: validatedData.motivo ?? undefined,
        observaciones: validatedData.observaciones ?? undefined,
        // Preserve original appointment data
        obraSocialId: appointment.obraSocialId,
        numeroAfiliado: appointment.numeroAfiliado,
        tipoConsulta: appointment.tipoConsulta,
        copago: appointment.copago,
        autorizacion: appointment.autorizacion,
        pacienteId: appointment.pacienteId,
        createdBy: appointment.createdBy,
      },
    })

    return NextResponse.json(updatedAppointment)

  } catch (error) {
    console.error('Error al reprogramar turno:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de reprogramación inválidos', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al reprogramar el turno' },
      { status: 500 }
    )
  }
}
