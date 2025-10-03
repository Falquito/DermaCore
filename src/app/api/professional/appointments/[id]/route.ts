import { NextRequest, NextResponse } from 'next/server'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

const allowedStatusUpdates = new Set<AppointmentStatus>([
  AppointmentStatus.PROGRAMADO,
  AppointmentStatus.CONFIRMADO,
  AppointmentStatus.EN_SALA_DE_ESPERA,
  AppointmentStatus.COMPLETADO,
  AppointmentStatus.NO_ASISTIO,
])

async function resolveParams(context: RouteContext) {
  const params = await context.params
  return params
}

async function buildAppointmentPayload(appointmentId: string, professionalId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      profesionalId: professionalId,
    },
    include: {
      paciente: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          dni: true,
          fechaNacimiento: true,
          genero: true,
          telefono: true,
          celular: true,
          email: true,
        },
      },
      obraSocial: {
        select: {
          id: true,
          nombre: true,
        },
      },
      AppointmentCancellation: {
        select: {
          id: true,
          motivo: true,
          cancelledAt: true,
          cancelledBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      diagnoses: {
        orderBy: { createdAt: 'desc' },
      },
      prescriptions: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          diagnoses: {
            include: {
              diagnosis: true,
            },
          },
        },
      },
      studyOrders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              result: {
                include: {
                  items: true,
                  uploadedBy: {
                    select: {
                      name: true,
                      apellido: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!appointment) {
    return null
  }

  const [patientMedications, relatedAppointments] = await Promise.all([
    prisma.patientMedication.findMany({
      where: {
        patientId: appointment.pacienteId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.appointment.findMany({
      where: {
        pacienteId: appointment.pacienteId,
        profesionalId: professionalId,
        id: { not: appointment.id },
      },
      select: {
        id: true,
        fecha: true,
        estado: true,
        motivo: true,
        createdAt: true,
      },
      orderBy: { fecha: 'desc' },
      take: 6,
    }),
  ])

  return {
    appointment,
    patientMedications,
    relatedAppointments,
  }
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { id } = await resolveParams(context)
    if (!id) {
      return NextResponse.json({ error: 'Falta el identificador del turno' }, { status: 400 })
    }

    const payload = await buildAppointmentPayload(id, user.id)
    if (!payload) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[API][professional][appointments][id][GET] error:', error)
    return NextResponse.json({ error: 'Error interno al obtener la consulta' }, { status: 500 })
  }
}

const updateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
})

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { id } = await resolveParams(context)
    if (!id) {
      return NextResponse.json({ error: 'Falta el identificador del turno' }, { status: 400 })
    }

    const json = await request.json().catch(() => null)
    if (!json) {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
    }

    const parsed = updateSchema.safeParse(json)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { status } = parsed.data

    if (status === AppointmentStatus.CANCELADO) {
      return NextResponse.json({ error: 'Para cancelar utilice el endpoint específico de cancelación' }, { status: 400 })
    }

    if (!allowedStatusUpdates.has(status)) {
      return NextResponse.json({ error: 'Estado no permitido' }, { status: 400 })
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        profesionalId: user.id,
      },
      select: {
        id: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { estado: status },
    })

    const payload = await buildAppointmentPayload(id, user.id)
    if (!payload) {
      return NextResponse.json({ error: 'Turno no encontrado luego de actualizar' }, { status: 404 })
    }

    return NextResponse.json({ ...payload, message: 'Estado actualizado correctamente' })
  } catch (error) {
    console.error('[API][professional][appointments][id][PATCH] error:', error)
    return NextResponse.json({ error: 'Error interno al actualizar la consulta' }, { status: 500 })
  }
}
