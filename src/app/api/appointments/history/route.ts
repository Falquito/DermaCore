import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { AppointmentStatus, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '4');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Construir filtros
    const where: Prisma.AppointmentWhereInput = {
      pacienteId: patientId,
    };

    // Filtro de fecha
    if (dateFrom || dateTo) {
      where.fecha = {};
      if (dateFrom) {
        where.fecha.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Agregar un día completo para incluir el día final
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.fecha.lte = endDate;
      }
    }

    // Filtro de estado
    if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      where.estado = status as AppointmentStatus;
    }

    // Cargar en paralelo: total, citas paginadas y datos básicos del paciente
    const [total, appointments, patient] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
      where,
      include: {
        profesional: {
          select: {
            id: true,
            name: true,
            apellido: true,
            email: true,
          }
        },
        obraSocial: {
          select: {
            id: true,
            nombre: true,
          }
        },
        diagnoses: {
          select: {
            id: true,
            principal: true,
            secundarios: true,
            notas: true,
            createdAt: true,
          }
        },
        prescriptions: {
          include: {
            items: {
              select: {
                id: true,
                medicamento: true,
                dosis: true,
                frecuencia: true,
                duracion: true,
                indicaciones: true,
              }
            }
          }
        },
        studyOrders: {
          include: {
            items: {
              include: {
                result: {
                  include: {
                    items: true,
                    uploadedBy: {
                      select: {
                        name: true,
                        apellido: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }
      },
      orderBy: {
        fecha: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      }),
      prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          dni: true,
          fechaNacimiento: true,
          genero: true,
          telefono: true,
          email: true,
          direccion: true,
        }
      })
    ])

    // Obtener medicaciones activas del paciente
    const medications = await prisma.patientMedication.findMany({
      where: {
        patientId: patientId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      patient,
      appointments,
      medications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

  } catch (error) {
    console.error('Error fetching appointment history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}