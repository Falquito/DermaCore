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

    // Obtener todas las órdenes de estudio del paciente, ordenadas por fecha más reciente
    const studyOrders = await prisma.studyOrder.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      studyOrders,
      total: studyOrders.length,
    });

  } catch (error) {
    console.error('Error fetching patient study orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}