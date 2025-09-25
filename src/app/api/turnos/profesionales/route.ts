import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/turnos/profesionales - Obtener lista de profesionales
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const profesionales = await prisma.user.findMany({
      where: {
        role: 'PROFESIONAL'
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ profesionales })
    
  } catch (error) {
    console.error('Error al obtener profesionales:', error)
    return NextResponse.json({ error: 'Error al cargar los profesionales' }, { status: 500 })
  }
}