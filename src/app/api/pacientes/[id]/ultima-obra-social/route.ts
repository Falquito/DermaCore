import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.response;

  try {
    const { id } = await context.params;
    const idPaciente = parseInt(id, 10);

    if (isNaN(idPaciente)) {
      return NextResponse.json(
        { error: "ID de paciente inválido" },
        { status: 400 }
      );
    }

    // Obtener la última consulta con obra social del paciente
    // Usando índice compuesto [idPaciente, fechaHoraConsulta]
    const ultimaConsultaObraSocial = await prisma.consultas.findFirst({
      where: {
        idPaciente,
        idObraSocial: {
          not: null, // Solo consultas con obra social
        },
      },
      orderBy: {
        fechaHoraConsulta: "desc",
      },
      include: {
        obraSocial: {
          select: {
            idObraSocial: true,
            nombreObraSocial: true,
          },
        },
      },
    });

    if (!ultimaConsultaObraSocial) {
      return NextResponse.json(
        {
          ultimaObraSocial: null,
          nroAfiliado: null,
          mensaje: "El paciente no tiene consultas con obra social registradas",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ultimaObraSocial: ultimaConsultaObraSocial.obraSocial,
        nroAfiliado: ultimaConsultaObraSocial.nroAfiliado,
        fechaConsulta: ultimaConsultaObraSocial.fechaHoraConsulta,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener última obra social:", error);
    return NextResponse.json(
      { error: "Error al obtener información de obra social" },
      { status: 500 }
    );
  }
}
