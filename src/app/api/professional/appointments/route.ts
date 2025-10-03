import { NextRequest, NextResponse } from 'next/server'
import { AppointmentStatus } from '@prisma/client'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeDiacritics } from '@/lib/text-normalize'

// Manual boolean parsing for onlyMine to avoid inconsistent coercion issues.
const querySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  patient: z.string().optional(),
  // Normalized (diacritics removed & lowercased) patient search term sent by frontend for accent-insensitive matching
  patientNorm: z.string().optional(),
  patientId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).optional(),
  sort: z.enum(['fecha_desc', 'fecha_asc']).optional(),
  onlyMine: z.string().optional(),
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
      const message = parsed.error.issues[0]?.message ?? 'Parámetros inválidos'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const {
      dateFrom,
      dateTo,
      status,
      patient,
      patientNorm,
      patientId,
      limit = 20,
      offset,
      page,
      sort = 'fecha_desc',
      onlyMine: rawOnlyMine,
    } = parsed.data

    const onlyMine = (() => {
      if (rawOnlyMine == null) return true
      const v = rawOnlyMine.toLowerCase().trim()
      if (['false', '0', 'no'].includes(v)) return false
      if (['true', '1', 'si', 'sí', 'yes'].includes(v)) return true
      return v.length === 0 ? true : Boolean(v)
    })()

    const computedOffset = typeof offset === 'number'
      ? offset
      : page
        ? (page - 1) * limit
        : 0

  const where: Record<string, unknown> = {}

    if (onlyMine) {
      where.profesionalId = user.id
    }

    if (dateFrom || dateTo) {
      const buildLocalDate = (raw: string, endOfDay = false) => {
        const parts = raw.split('-').map(Number)
        if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return new Date(raw) // fallback
        const [y, m, d] = parts
        return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0)
      }

      where.fecha = {}
      if (dateFrom) {
        ;(where.fecha as Record<string, Date>).gte = buildLocalDate(dateFrom)
      }
      if (dateTo) {
        ;(where.fecha as Record<string, Date>).lte = buildLocalDate(dateTo, true)
      }
    }

    if (status) {
      where.estado = status
    }

    if (patientId) {
      where.pacienteId = patientId
    } else if (patient && !patientNorm) {
      // Legacy / basic case-insensitive search (without accent normalization)
      const searchTerm = patient.trim()
      if (searchTerm.length > 0) {
        where.OR = [
          { paciente: { nombre: { contains: searchTerm, mode: 'insensitive' } } },
          { paciente: { apellido: { contains: searchTerm, mode: 'insensitive' } } },
          { paciente: { dni: { contains: searchTerm } } },
        ]
      }
    }

    const orderBy = sort === 'fecha_asc'
      ? { fecha: 'asc' as const }
      : { fecha: 'desc' as const }

    // If we have a normalized search term (accent-insensitive path) and no patientId, we need a custom in-memory filter.
    if (!patientId && patientNorm) {
      const normTerm = patientNorm.trim()
      // Strategy: Fetch a broader slice (limit * 5 up to 500) then filter in-memory by normalized fields.
      const prefetchSize = Math.min(limit * 5, 500)

      const broadAppointments = await prisma.appointment.findMany({
        where, // note: no patient name constraints applied in this branch
        include: {
          profesional: {
            select: { id: true, name: true, apellido: true, email: true },
          },
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
          obraSocial: { select: { id: true, nombre: true } },
          diagnoses: { orderBy: { createdAt: 'desc' } },
          prescriptions: {
            orderBy: { createdAt: 'desc' },
            include: {
              items: true,
              diagnoses: { include: { diagnosis: true } },
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
        orderBy,
        take: prefetchSize,
      })

      const filtered = broadAppointments.filter(a => {
        const nombre = normalizeDiacritics(a.paciente?.nombre)
        const apellido = normalizeDiacritics(a.paciente?.apellido)
        const full = `${apellido} ${nombre}`.trim()
        const dni = a.paciente?.dni ?? ''
        return (
          nombre.includes(normTerm) ||
          apellido.includes(normTerm) ||
          full.includes(normTerm) ||
          dni.includes(patient || '') // still allow raw dni partial match
        )
      })

      const total = filtered.length
      const pageNumber = typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1
      const start = computedOffset
      const end = start + limit
      const paged = filtered.slice(start, end)

      return NextResponse.json({
        appointments: paged,
        total,
        page: pageNumber,
        pageSize: limit,
        accentInsensitive: true,
        fetched: broadAppointments.length,
      })
    }

    // Default fast path (DB-powered filtering & pagination)
    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        include: {
          profesional: {
            select: { id: true, name: true, apellido: true, email: true },
          },
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
            select: { id: true, nombre: true },
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
        orderBy,
        skip: computedOffset,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ])

    return NextResponse.json({
      appointments,
      total,
      page: typeof page === 'number' ? page : Math.floor(computedOffset / limit) + 1,
      pageSize: limit,
    })
  } catch (error) {
    console.error('[API][professional][appointments] error:', error)
    return NextResponse.json({ error: 'Error interno al obtener las consultas' }, { status: 500 })
  }
}
