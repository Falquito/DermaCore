import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const studySchema = z.object({
  estudio: z.string().trim().min(2, 'Seleccione un estudio'),
  indicaciones: z.string().optional(),
})

const createOrderSchema = z.object({
  appointmentId: z.string().min(1, 'El turno es obligatorio'),
  estudios: z.array(studySchema).min(1, 'Debe seleccionar al menos un estudio'),
  notas: z.string().optional(),
})

const querySchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const { appointmentId, patientId, limit = 20, offset, page } = parsed.data

    const computedOffset = typeof offset === 'number'
      ? offset
      : page
        ? (page - 1) * limit
        : 0

    const studyOrders = await prisma.studyOrder.findMany({
      where: {
        professionalId: user.id,
        ...(appointmentId ? { appointmentId } : {}),
        ...(patientId ? { patientId } : {}),
      },
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
      skip: computedOffset,
      take: limit,
    })

    const total = await prisma.studyOrder.count({
      where: {
        professionalId: user.id,
        ...(appointmentId ? { appointmentId } : {}),
        ...(patientId ? { patientId } : {}),
      },
    })

    return NextResponse.json({
      studyOrders,
      total,
      page: typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('[API][professional][study-orders][GET] error:', error)
    return NextResponse.json({ error: 'Error al obtener las órdenes de estudio' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.roles.includes('PROFESIONAL')) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { appointmentId, estudios, notas } = parsed.data

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, profesionalId: true, pacienteId: true },
    })

    if (!appointment || appointment.profesionalId !== user.id) {
      return NextResponse.json({ error: 'No se encontró el turno o no pertenece al profesional' }, { status: 404 })
    }

    const order = await prisma.studyOrder.create({
      data: {
        appointmentId,
        patientId: appointment.pacienteId,
        professionalId: user.id,
        notas: notas?.trim() || null,
        items: {
          create: estudios.map((study) => ({
            estudio: study.estudio.trim(),
            indicaciones: study.indicaciones?.trim() || null,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      success: true,
      studyOrder: order,
      message: 'Orden de estudios registrada',
    })
  } catch (error) {
    console.error('[API][professional][study-orders][POST] error:', error)
    return NextResponse.json({ error: 'Error al registrar la orden de estudios' }, { status: 500 })
  }
}
