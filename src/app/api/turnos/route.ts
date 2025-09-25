import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'
import { TipoConsulta, AppointmentStatus } from '@prisma/client'

// Esquema de validación para crear un turno
const createAppointmentSchema = z.object({
  pacienteId: z.string().optional(),
  pacienteNuevo: z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').trim(),
    apellido: z.string().min(1, 'El apellido es obligatorio').trim(),
    dni: z.string()
      .min(7, 'El DNI debe tener al menos 7 dígitos')
      .max(8, 'El DNI no puede tener más de 8 dígitos')
      .regex(/^\d+$/, 'El DNI solo debe contener números'),
    fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
    genero: z.enum(['Masculino', 'Femenino', 'Otro']),
    telefono: z.string().optional(),
    celular: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
  }).optional(),
  profesionalId: z.string().min(1, 'El profesional es obligatorio'),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  duracion: z.number().min(15).max(120).default(30),
  motivo: z.string().optional(),
  observaciones: z.string().optional(),
  tipoConsulta: z.nativeEnum(TipoConsulta),
  obraSocialId: z.string().optional(),
  numeroAfiliado: z.string().optional(),
  copago: z.number().optional(),
  autorizacion: z.string().optional(),
}).refine((data) => {
  // Debe tener pacienteId O pacienteNuevo, pero no ambos
  return (data.pacienteId && !data.pacienteNuevo) || (!data.pacienteId && data.pacienteNuevo)
}, {
  message: 'Debe seleccionar un paciente existente o crear uno nuevo',
  path: ['pacienteId']
}).refine((data) => {
  // Si es obra social, debe tener obraSocialId
  if (data.tipoConsulta === TipoConsulta.OBRA_SOCIAL) {
    return data.obraSocialId
  }
  return true
}, {
  message: 'Debe seleccionar una obra social',
  path: ['obraSocialId']
}).refine((data) => {
  // Si es particular, debe tener copago
  if (data.tipoConsulta === TipoConsulta.PARTICULAR) {
    return data.copago && data.copago > 0
  }
  return true
}, {
  message: 'Debe especificar el precio de la consulta',
  path: ['copago']
})

// GET /api/turnos - Obtener turnos con filtros
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get('profesionalId')
    const fecha = searchParams.get('fecha')
    const estado = searchParams.get('estado')
    
    const where: {
      profesionalId?: string
      fecha?: {
        gte: Date
        lte: Date
      }
      estado?: AppointmentStatus
    } = {}
    
    if (profesionalId) {
      where.profesionalId = profesionalId
    }
    
    if (fecha) {
      const fechaDate = new Date(fecha)
      const fechaStart = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate(), 0, 0, 0)
      const fechaEnd = new Date(fechaDate.getFullYear(), fechaDate.getMonth(), fechaDate.getDate(), 23, 59, 59)
      where.fecha = {
        gte: fechaStart,
        lte: fechaEnd
      }
    }
    
    if (estado) {
      where.estado = estado as AppointmentStatus
    }

    const turnos = await prisma.appointment.findMany({
      where,
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            telefono: true,
            celular: true
          }
        },
        profesional: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        obraSocial: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { fecha: 'asc' }
    })

    return NextResponse.json({ turnos })
    
  } catch (error) {
    console.error('Error al obtener turnos:', error)
    return NextResponse.json({ error: 'Error al cargar los turnos' }, { status: 500 })
  }
}

// POST /api/turnos - Crear un nuevo turno
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (currentUser.role !== 'MESA_ENTRADA' && currentUser.role !== 'GERENTE') {
      return NextResponse.json({ error: 'No tiene permisos para crear turnos' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)

    // Verificar que la fecha y hora no estén ocupadas
    const fechaTurno = new Date(validatedData.fecha)
    const fechaFin = new Date(fechaTurno.getTime() + validatedData.duracion * 60000)
    
    const turnoExistente = await prisma.appointment.findFirst({
      where: {
        profesionalId: validatedData.profesionalId,
        fecha: {
          lt: fechaFin
        },
        AND: {
          OR: [
            {
              fecha: {
                gte: fechaTurno
              }
            },
            {
              // Verificar si el turno existente se superpone
              fecha: {
                lt: fechaTurno
              },
              // Calcular fecha de fin del turno existente
              duracion: {
                gt: Math.ceil((fechaTurno.getTime() - Date.now()) / (1000 * 60))
              }
            }
          ]
        },
        estado: {
          notIn: [AppointmentStatus.CANCELADO, AppointmentStatus.NO_ASISTIO]
        }
      }
    })

    if (turnoExistente) {
      return NextResponse.json({ 
        error: 'Ya existe un turno programado en ese horario para el profesional seleccionado' 
      }, { status: 409 })
    }

    let pacienteId = validatedData.pacienteId

    // Crear paciente nuevo si es necesario
    if (validatedData.pacienteNuevo) {
      const pacienteData = validatedData.pacienteNuevo
      
      // Verificar que no exista un paciente con el mismo DNI
      const pacienteExistente = await prisma.patient.findUnique({
        where: { dni: pacienteData.dni }
      })

      if (pacienteExistente) {
        return NextResponse.json({ 
          error: `Ya existe un paciente registrado con DNI ${pacienteData.dni}` 
        }, { status: 409 })
      }

      const nuevoPaciente = await prisma.patient.create({
        data: {
          ...pacienteData,
          fechaNacimiento: new Date(pacienteData.fechaNacimiento),
          createdBy: currentUser.id
        }
      })
      
      pacienteId = nuevoPaciente.id
    }

    // Crear el turno
    const nuevoTurno = await prisma.appointment.create({
      data: {
        pacienteId: pacienteId!,
        profesionalId: validatedData.profesionalId,
        fecha: fechaTurno,
        duracion: validatedData.duracion,
        motivo: validatedData.motivo,
        observaciones: validatedData.observaciones,
        tipoConsulta: validatedData.tipoConsulta,
        obraSocialId: validatedData.obraSocialId,
        numeroAfiliado: validatedData.numeroAfiliado,
        copago: validatedData.copago ? validatedData.copago.toString() : null,
        autorizacion: validatedData.autorizacion,
        estado: AppointmentStatus.PROGRAMADO,
        createdBy: currentUser.id
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true
          }
        },
        profesional: {
          select: {
            id: true,
            name: true
          }
        },
        obraSocial: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Turno creado exitosamente',
      turno: nuevoTurno 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación Zod:', error.issues)
      return NextResponse.json({ 
        error: 'Datos inválidos',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }
    
    console.error('Error al crear turno:', error)
    return NextResponse.json({ error: 'Error al crear el turno' }, { status: 500 })
  }
}