import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateProfile } from '@/lib/validations'
import type { Role } from '@prisma/client'

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, apellido, dni, telefono, especialidadId } = body

    // Validar datos
    const validation = validateProfile({ name, apellido, dni, telefono })
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Datos inválidos', validationErrors: validation.errors },
        { status: 400 }
      )
    }

    // Verificar que el DNI no esté en uso por otro usuario
    if (dni) {
      const existingUser = await prisma.user.findUnique({
        where: { dni: dni.replace(/\./g, '') }
      })
      
      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: 'El DNI ingresado ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar
    const updateData: {
      name?: string
      apellido?: string
      dni?: string
      telefono?: string
      especialidadId?: string
      updatedAt: Date
    } = {
      name: name?.trim(),
      apellido: apellido?.trim(),
      dni: dni?.replace(/\./g, ''),
      telefono: telefono?.replace(/\-/g, ''),
      updatedAt: new Date()
    }

    // Solo agregar especialidad si el usuario es profesional
    if (currentUser.roles.includes('PROFESIONAL') && especialidadId) {
      updateData.especialidadId = especialidadId
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      include: {
        especialidad: true,
        roles: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        apellido: updatedUser.apellido,
        dni: updatedUser.dni,
        telefono: updatedUser.telefono,
        roles: updatedUser.roles.map((ur: {role: Role}) => ur.role),
        especialidad: updatedUser.especialidad
      }
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener datos completos del usuario
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        especialidad: true,
        roles: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apellido: user.apellido,
        dni: user.dni,
        telefono: user.telefono,
        roles: user.roles.map((ur: {role: Role}) => ur.role),
        especialidad: user.especialidad
      }
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}