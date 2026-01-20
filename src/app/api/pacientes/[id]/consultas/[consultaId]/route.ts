import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/apiAuth";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type Ctx = { params: Promise<{ id: string; consultaId: string }> };

// PUT: Actualizar una consulta
export async function PUT(request: NextRequest, { params }: Ctx): Promise<Response> {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.response;

  try {
    const { id, consultaId } = await params;
    const idPaciente = parseId(id);
    const idConsulta = parseId(consultaId);

    if (!idPaciente || !idConsulta) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Cuerpo de la solicitud inválido" },
        { status: 400 }
      );
    }

    const {
      motivoConsulta,
      diagnosticoConsulta,
      tratamientoConsulta,
      nroAfiliado,
      tipoConsulta,
      montoConsulta,
      idObraSocial,
    } = body;

    // Validaciones
    if (!motivoConsulta || typeof motivoConsulta !== "string") {
      return NextResponse.json(
        { error: "El motivo de la consulta es requerido" },
        { status: 400 }
      );
    }

    if (!tipoConsulta || typeof tipoConsulta !== "string") {
      return NextResponse.json(
        { error: "El tipo de consulta es requerido" },
        { status: 400 }
      );
    }

    if (!["particular", "obra-social"].includes(tipoConsulta)) {
      return NextResponse.json(
        { error: "El tipo de consulta debe ser 'particular' u 'obra-social'" },
        { status: 400 }
      );
    }

    // Validación condicional según tipo de consulta
    if (tipoConsulta === "particular") {
      if (!montoConsulta || typeof montoConsulta !== "number") {
        return NextResponse.json(
          { error: "El monto es requerido para consultas particulares" },
          { status: 400 }
        );
      }
    } else if (tipoConsulta === "obra-social") {
      if (!idObraSocial || !Number.isInteger(idObraSocial)) {
        return NextResponse.json(
          { error: "La obra social es requerida para consultas de obra social" },
          { status: 400 }
        );
      }
      if (!nroAfiliado || typeof nroAfiliado !== "string") {
        return NextResponse.json(
          { error: "El número de afiliado es requerido para consultas de obra social" },
          { status: 400 }
        );
      }
    }

    // Verificar que el paciente existe
    const paciente = await prisma.paciente.findUnique({
      where: { idPaciente },
    });

    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la consulta existe y pertenece al paciente
    const consultaExistente = await prisma.consultas.findUnique({
      where: { idConsulta },
    });

    if (!consultaExistente || consultaExistente.idPaciente !== idPaciente) {
      return NextResponse.json(
        { error: "Consulta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la obra social existe (solo si es obra-social)
    if (tipoConsulta === "obra-social") {
      const obraSocial = await prisma.obraSocial.findUnique({
        where: { idObraSocial },
      });

      if (!obraSocial) {
        return NextResponse.json(
          { error: "Obra social no encontrada" },
          { status: 404 }
        );
      }
    }

    // Actualizar la consulta
    const consultaActualizada = await prisma.consultas.update({
      where: { idConsulta },
      data: {
        motivoConsulta: motivoConsulta.trim(),
        diagnosticoConsulta: diagnosticoConsulta
          ? diagnosticoConsulta.trim()
          : null,
        tratamientoConsulta: tratamientoConsulta
          ? tratamientoConsulta.trim()
          : null,
        nroAfiliado:
          tipoConsulta === "obra-social" && nroAfiliado
            ? nroAfiliado.trim()
            : null,
        tipoConsulta: tipoConsulta,
        montoConsulta:
          tipoConsulta === "particular" ? parseFloat(montoConsulta) : null,
        idObraSocial:
          tipoConsulta === "obra-social" ? idObraSocial : null,
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

    return NextResponse.json(consultaActualizada, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar consulta:", error);
    return NextResponse.json(
      { error: "Error al actualizar la consulta" },
      { status: 500 }
    );
  }
}
