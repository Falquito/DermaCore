import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'

// UI-specific appointment type (transformed from Prisma Appointment)
type Appointment = {
  id: string
  professionalId: string
  patientId?: string | null
  title: string
  start: string // ISO
  end: string // ISO
  status: AppointmentStatus
  notes?: string | null
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json([], { status: 200 })
  const professionalId = session.userId // provisional: userId == professionalId until model exists

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const statusParam = searchParams.get('status') // comma-separated statuses matching Prisma enum values
  const q = (searchParams.get('q') || '').trim()
  if (!from || !to) return NextResponse.json([], { status: 200 })

  const fromDate = new Date(from)
  const toDate = new Date(to)

  // Build filters
  const estadoIn = statusParam
    ? statusParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  const estadoValues = Object.values(AppointmentStatus) as AppointmentStatus[]
  const estadoInPrisma = estadoIn?.filter((s): s is AppointmentStatus =>
    estadoValues.includes(s as AppointmentStatus)
  )

  // Query DB
  const rows = await prisma.appointment.findMany({
    where: {
      profesionalId: professionalId,
      fecha: { gte: fromDate, lt: toDate },
  ...(estadoInPrisma && estadoInPrisma.length ? { estado: { in: estadoInPrisma } } : {}),
      ...(q
        ? {
            OR: [
              { motivo: { contains: q, mode: 'insensitive' } },
              { observaciones: { contains: q, mode: 'insensitive' } },
              { paciente: { nombre: { contains: q, mode: 'insensitive' } } },
              { paciente: { apellido: { contains: q, mode: 'insensitive' } } },
              { paciente: { dni: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },
    },
    orderBy: { fecha: 'asc' },
  })

  // Map to UI shape
  const data: Appointment[] = rows.map((r) => {
    const start = r.fecha
    const end = new Date(start.getTime() + (r.duracion ?? 30) * 60000)
    const fullName = r.paciente ? `${r.paciente.apellido}, ${r.paciente.nombre}`.trim() : ''
    const title = fullName || r.motivo || 'Consulta'
    return {
      id: r.id,
      professionalId: r.profesionalId,
      patientId: r.pacienteId,
      title,
      start: start.toISOString(),
      end: end.toISOString(),
  status: r.estado,
      notes: r.observaciones ?? null,
    }
  })

  return NextResponse.json(data, { status: 200 })
}
