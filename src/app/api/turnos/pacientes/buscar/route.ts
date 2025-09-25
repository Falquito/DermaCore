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
    
    if (!query || query.length < 2) {
      return NextResponse.json({ pacientes: [] })
    }

    const pacientes = await prisma.patient.findMany({
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
      take: 20 // Limitar resultados
    })

    return NextResponse.json({ pacientes })
    
  } catch (error) {
    console.error('Error al buscar pacientes:', error)
    return NextResponse.json({ error: 'Error al buscar pacientes' }, { status: 500 })
  }
}