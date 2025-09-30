import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { createPatientSchema } from '../route'

const updatePatientSchema = createPatientSchema

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!currentUser.roles.includes('MESA_ENTRADA') && !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar pacientes' }, { status: 403 })
    }

    const { id } = await context.params

    const existingPatient = await prisma.patient.findUnique({ where: { id } })
    if (!existingPatient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updatePatientSchema.parse(body)

    if (validatedData.dni !== existingPatient.dni) {
      const dniTaken = await prisma.patient.findFirst({
        where: {
          dni: validatedData.dni,
          NOT: { id }
        }
      })

      if (dniTaken) {
        return NextResponse.json({ error: 'Ya existe un paciente con este DNI' }, { status: 400 })
      }
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        dni: validatedData.dni,
        fechaNacimiento: validatedData.fechaNacimiento,
        genero: validatedData.genero,
        telefono: validatedData.telefono || null,
        celular: validatedData.celular || null,
        email: validatedData.email || null,
        direccion: validatedData.direccion || null,
        ciudad: validatedData.ciudad || null,
        provincia: validatedData.provincia || null,
        codigoPostal: validatedData.codigoPostal || null,
        contactoEmergenciaNombre: validatedData.contactoEmergenciaNombre || null,
        contactoEmergenciaTelefono: validatedData.contactoEmergenciaTelefono || null,
        contactoEmergenciaRelacion: validatedData.contactoEmergenciaRelacion || null,
        activo: validatedData.activo,
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      patient: updatedPatient,
      message: `Paciente ${updatedPatient.nombre} ${updatedPatient.apellido} actualizado exitosamente`
    })
  } catch (error) {
    console.error('Error al actualizar paciente:', error)

    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      return NextResponse.json({ error: firstIssue.message }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Error interno del servidor al actualizar el paciente' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!currentUser.roles.includes('MESA_ENTRADA') && !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No tienes permisos para ver pacientes' }, { status: 403 })
    }

    const { id } = await context.params

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ patient })
  } catch (error) {
    console.error('Error al obtener paciente:', error)
    return NextResponse.json({ error: 'Error interno del servidor al obtener el paciente' }, { status: 500 })
  }
}
