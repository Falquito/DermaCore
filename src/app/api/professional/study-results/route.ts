import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const studyResultItemSchema = z.object({
  parametro: z.string().trim().min(1, 'El parámetro es obligatorio'),
  valor: z.string().trim().min(1, 'El valor es obligatorio'),
  unidad: z.string().trim().optional(),
  valorReferencia: z.string().trim().optional(),
  esNormal: z.boolean().optional(),
})

const createResultSchema = z.object({
  studyOrderItemId: z.string().min(1, 'El ID del estudio es obligatorio'),
  fechaRealizacion: z.string().datetime('Fecha de realización inválida'),
  laboratorio: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
  items: z.array(studyResultItemSchema).min(1, 'Debe agregar al menos un resultado'),
})

const querySchema = z.object({
  patientId: z.string().optional(),
  studyOrderId: z.string().optional(),
  status: z.enum(['ORDENADO', 'COMPLETADO']).optional(),
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

    const { patientId, studyOrderId, status, limit = 20, offset, page } = parsed.data

    const computedOffset = typeof offset === 'number'
      ? offset
      : page
        ? (page - 1) * limit
        : 0

    // Obtener estudios con sus resultados
    const studyOrderItems = await prisma.studyOrderItem.findMany({
      where: {
        order: {
          professionalId: user.id,
          ...(studyOrderId ? { id: studyOrderId } : {}),
          ...(patientId ? { patientId } : {}),
        },
        ...(status ? { estado: status } : {}),
      },
      include: {
        order: {
          include: {
            appointment: {
              select: {
                fecha: true,
                id: true,
              },
            },
            patient: {
              select: {
                nombre: true,
                apellido: true,
                dni: true,
              },
            },
          },
        },
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
      orderBy: {
        order: {
          createdAt: 'desc',
        },
      },
      skip: computedOffset,
      take: limit,
    })

    const total = await prisma.studyOrderItem.count({
      where: {
        order: {
          professionalId: user.id,
          ...(studyOrderId ? { id: studyOrderId } : {}),
          ...(patientId ? { patientId } : {}),
        },
        ...(status ? { estado: status } : {}),
      },
    })

    return NextResponse.json({
      studyOrderItems,
      total,
      page: typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('[API][professional][study-results][GET] error:', error)
    return NextResponse.json({ error: 'Error al obtener los resultados de estudios' }, { status: 500 })
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
    const parsed = createResultSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Datos inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { studyOrderItemId, fechaRealizacion, laboratorio, observaciones, items } = parsed.data

    // Verificar que el estudio pertenece al profesional
    const studyOrderItem = await prisma.studyOrderItem.findUnique({
      where: { id: studyOrderItemId },
      include: {
        order: {
          select: {
            professionalId: true,
          },
        },
        result: true,
      },
    })

    if (!studyOrderItem || studyOrderItem.order.professionalId !== user.id) {
      return NextResponse.json({ error: 'No se encontró el estudio o no pertenece al profesional' }, { status: 404 })
    }

    if (studyOrderItem.result) {
      return NextResponse.json({ error: 'Este estudio ya tiene resultados cargados' }, { status: 400 })
    }

    // Crear el resultado con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el resultado
      const studyResult = await tx.studyResult.create({
        data: {
          studyOrderItemId,
          fechaRealizacion: new Date(fechaRealizacion),
          laboratorio: laboratorio?.trim() || null,
          observaciones: observaciones?.trim() || null,
          uploadedById: user.id,
          items: {
            create: items.map((item) => ({
              parametro: item.parametro.trim(),
              valor: item.valor.trim(),
              unidad: item.unidad?.trim() || null,
              valorReferencia: item.valorReferencia?.trim() || null,
              esNormal: item.esNormal ?? null,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // Actualizar el estado del estudio
      await tx.studyOrderItem.update({
        where: { id: studyOrderItemId },
        data: { estado: 'COMPLETADO' },
      })

      return studyResult
    })

    return NextResponse.json({
      success: true,
      studyResult: result,
      message: 'Resultado de estudio registrado correctamente',
    })
  } catch (error) {
    console.error('[API][professional][study-results][POST] error:', error)
    return NextResponse.json({ error: 'Error al registrar el resultado del estudio' }, { status: 500 })
  }
}