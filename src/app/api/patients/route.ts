import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// Esquema de validación para el formulario de paciente
export const createPatientSchema = z.object({
  // Datos personales (obligatorios)
  nombre: z.string().min(1, 'El nombre es obligatorio').trim(),
  apellido: z.string().min(1, 'El apellido es obligatorio').trim(),
  dni: z.string()
    .min(7, 'El DNI debe tener al menos 7 dígitos')
    .max(8, 'El DNI no puede tener más de 8 dígitos')
    .regex(/^\d+$/, 'El DNI solo debe contener números'),
  fechaNacimiento: z.string()
    .min(1, 'La fecha de nacimiento es obligatoria')
    .transform((str, ctx) => {
      const date = new Date(str)
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de nacimiento debe ser una fecha válida'
        })
        return z.NEVER
      }
      return date
    }),
  genero: z.enum(['Masculino', 'Femenino', 'Otro'], { message: 'El género es obligatorio' }),
  
  // Estado del paciente
  activo: z.boolean().default(true),
  
  // Datos de contacto (opcionales)
  telefono: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Dirección (opcional)
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  codigoPostal: z.string().optional(),
  
  // Contacto de emergencia (opcional)
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
  contactoEmergenciaRelacion: z.string().optional(),
})

// GET /api/patients - Obtener lista de pacientes
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!currentUser.roles.includes('MESA_ENTRADA') && !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No tienes permisos para ver los pacientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search')

    const patients = await prisma.patient.findMany({
      where: searchTerm ? {
        OR: [
          { nombre: { contains: searchTerm, mode: 'insensitive' } },
          { apellido: { contains: searchTerm, mode: 'insensitive' } },
          { dni: { contains: searchTerm } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      } : undefined,
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    })

    return NextResponse.json({ patients })

  } catch (error) {
    console.error('Error al obtener pacientes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST /api/patients - Crear nuevo paciente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y autorización
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (!currentUser.roles.includes('MESA_ENTRADA') && !currentUser.roles.includes('GERENTE')) {
      return NextResponse.json({ error: 'No tienes permisos para crear pacientes' }, { status: 403 })
    }

    // Obtener y validar datos del cuerpo de la petición
    const body = await request.json()
    const validatedData = createPatientSchema.parse(body)

    // Verificar que no exista un paciente con el mismo DNI
    const existingPatient = await prisma.patient.findUnique({
      where: { dni: validatedData.dni }
    })

    if (existingPatient) {
      return NextResponse.json({ error: 'Ya existe un paciente con este DNI' }, { status: 400 })
    }

    // Crear el paciente
    const patient = await prisma.patient.create({
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
        createdBy: currentUser.id,
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      patient,
      message: `Paciente ${patient.nombre} ${patient.apellido} creado exitosamente`
    })

  } catch (error) {
    console.error('Error al crear paciente:', error)
    
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Error interno del servidor al crear el paciente' }, { status: 500 })
  }
}
