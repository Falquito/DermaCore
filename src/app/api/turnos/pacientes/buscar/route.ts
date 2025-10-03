import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/turnos/pacientes/buscar - Buscar pacientes para asignar turnos
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const qNorm = searchParams.get('qNorm')?.trim()
    
    if (!query || query.length < 2) {
      return NextResponse.json({ pacientes: [] })
    }

    // Primera pasada: búsqueda insensible a mayúsculas (Prisma) para reducir universo
    let rawPacientes = await prisma.patient.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { dni: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        fechaNacimiento: true,
        telefono: true,
        celular: true,
        email: true
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ],
      take: 80 // ampliar un poco para filtrar luego por acentos
    })

    // Fallback para acentos: si no se obtuvieron suficientes resultados, ampliar por primera letra
    if (qNorm && rawPacientes.length < 20) {
      const firstChar = qNorm[0]
      if (firstChar) {
        const extra = await prisma.patient.findMany({
          where: {
            OR: [
              { apellido: { startsWith: firstChar, mode: 'insensitive' } },
              { nombre: { startsWith: firstChar, mode: 'insensitive' } },
            ]
          },
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            fechaNacimiento: true,
            telefono: true,
            celular: true,
            email: true
          },
          orderBy: [
            { apellido: 'asc' },
            { nombre: 'asc' }
          ],
          take: 150
        })
        // Unificar por id
        const map = new Map<string, typeof rawPacientes[number]>()
        for (const p of [...rawPacientes, ...extra]) map.set(p.id, p)
        rawPacientes = Array.from(map.values())
      }
    }

    // Normalización para quitar acentos y comparar
    function norm(val: string) {
      return val
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
    }

    let pacientes = rawPacientes
    if (qNorm && qNorm.length >= 2) {
      const target = qNorm.toLowerCase()
      pacientes = rawPacientes.filter(p => {
        const composite = `${p.apellido} ${p.nombre} ${p.dni}`
        return norm(composite).includes(target)
      }).slice(0, 20)
    } else {
      pacientes = rawPacientes.slice(0, 20)
    }

    return NextResponse.json({ pacientes })
    
  } catch (error) {
    console.error('Error al buscar pacientes:', error)
    return NextResponse.json({ error: 'Error al buscar pacientes' }, { status: 500 })
  }
}