import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/obras-sociales - Obtener lista de obras sociales activas
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const obrasSociales = await prisma.obraSocial.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    })
    
    return NextResponse.json({ obrasSociales })
    
  } catch (error) {
    console.error('Error al obtener obras sociales:', error)
    return NextResponse.json({ error: 'Error al cargar las obras sociales' }, { status: 500 })
  }
}