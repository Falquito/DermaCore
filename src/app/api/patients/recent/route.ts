import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/patients/recent - Obtener pacientes recientes (para profesionales)
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
      return NextResponse.json({ error: 'No tienes permisos para ver pacientes recientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '8')

    // Obtener pacientes que han tenido citas recientes
    const recentPatients = await prisma.patient.findMany({
      where: {
        AND: [
          { activo: true },
          {
            appointments: {
              some: {
                // Citas de los últimos 30 días
                fecha: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
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
        appointments: {
          select: {
            fecha: true,
            estado: true
          },
          orderBy: {
            fecha: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        appointments: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return NextResponse.json({ patients: recentPatients })

  } catch (error) {
    console.error('Error al obtener pacientes recientes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}