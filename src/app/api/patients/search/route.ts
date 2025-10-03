import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/patients/search - Buscar pacientes (para profesionales)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Permitir acceso a profesionales, mesa de entrada y gerentes
    if (!currentUser.roles.includes('PROFESIONAL') && 
        !currentUser.roles.includes('MESA_ENTRADA') && 
        !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No tienes permisos para buscar pacientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({ patients: [] })
    }

    const patients = await prisma.patient.findMany({
      where: {
        AND: [
          {
            OR: [
              { nombre: { contains: searchTerm.trim(), mode: 'insensitive' } },
              { apellido: { contains: searchTerm.trim(), mode: 'insensitive' } },
              { dni: { contains: searchTerm.trim() } },
              { email: { contains: searchTerm.trim(), mode: 'insensitive' } }
            ]
          },
          { activo: true } // Solo pacientes activos
        ]
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true,
        telefono: true,
        celular: true,
        fechaNacimiento: true,
        genero: true,
        direccion: true,
        ciudad: true,
        provincia: true,
        codigoPostal: true
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ],
      take: limit
    })

    return NextResponse.json({ patients })

  } catch (error) {
    console.error('Error al buscar pacientes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}