import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z, ZodIssue } from 'zod'
import type { Role } from '@prisma/client'

// Esquema de validación para actualizar usuario
const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  roles: z.array(z.enum(['PROFESIONAL', 'MESA_ENTRADA', 'GERENTE'])).optional(),
})

// GET /api/users - Obtener lista de usuarios
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      )
    }

    // Obtener todos los usuarios con sus roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
      ]
    })

    // Transform users to include roles array
    const transformedUsers = users.map(user => ({
      ...user,
      roles: user.roles.map((ur: {role: Role}) => ur.role)
    }))

    return NextResponse.json({ users: transformedUsers })
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/users - Actualizar usuario (principalmente para asignar roles)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, roles: newRoles, ...userData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'El ID del usuario es requerido' },
        { status: 400 }
      )
    }

    // Validar datos (sin roles para validar separadamente)
    const validatedData = updateUserSchema.omit({ roles: true }).parse(userData)
    
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { roles: true }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Handle roles update if provided
    let roleUpdateData = {}
    if (newRoles !== undefined) {
      // Validate roles array
      if (!Array.isArray(newRoles)) {
        return NextResponse.json(
          { error: 'Los roles deben ser un array' },
          { status: 400 }
        )
      }

      // Validate each role
      const validRoles = ['PROFESIONAL', 'MESA_ENTRADA', 'GERENTE']
      const invalidRoles = newRoles.filter(role => !validRoles.includes(role))
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { error: `Roles inválidos: ${invalidRoles.join(', ')}` },
          { status: 400 }
        )
      }

      roleUpdateData = {
        roles: {
          deleteMany: {}, // Delete all existing roles
          create: newRoles.map((role: string) => ({ role: role as Role })) // Create new roles with proper typing
        }
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...validatedData,
        ...roleUpdateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: true
          }
        }
      }
    })

    // Transform user to include roles array
    const transformedUser = {
      ...updatedUser,
      roles: updatedUser.roles.map((ur: {role: Role}) => ur.role)
    }

    return NextResponse.json({ user: transformedUser })
    
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: error.issues.map((err: ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/users - Actualizar roles específicamente
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, roles: newRoles } = body
    
    if (!userId || !newRoles) {
      return NextResponse.json(
        { error: 'userId y roles son requeridos' },
        { status: 400 }
      )
    }

    // Validate roles array
    if (!Array.isArray(newRoles)) {
      return NextResponse.json(
        { error: 'Los roles deben ser un array' },
        { status: 400 }
      )
    }

    // Validate each role
    const validRoles = ['PROFESIONAL', 'MESA_ENTRADA', 'GERENTE']
    const invalidRoles = newRoles.filter(role => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        { error: `Roles inválidos: ${invalidRoles.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar solo los roles
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          deleteMany: {}, // Delete all existing roles
          create: newRoles.map((role: string) => ({ role: role as Role })) // Create new roles
        },
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: true
          }
        }
      }
    })

    // Transform user to include roles array
    const transformedUser = {
      ...updatedUser,
      roles: updatedUser.roles.map((ur: {role: Role}) => ur.role)
    }

    return NextResponse.json({ user: transformedUser })
    
  } catch (error) {
    console.error('Error actualizando roles del usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
