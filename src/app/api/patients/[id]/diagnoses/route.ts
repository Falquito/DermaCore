import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Obtener todos los diagnósticos del paciente, ordenados por fecha más reciente
    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        patientId: patientId,
      },
      include: {
        appointment: {
          select: {
            id: true,
            fecha: true,
            profesional: {
              select: {
                name: true,
                apellido: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      diagnoses,
      total: diagnoses.length,
    });

  } catch (error) {
    console.error('Error fetching patient diagnoses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}