import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/apiAuth";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type Ctx = { params: Promise<{ id: string }> };

// GET: Obtener todas las consultas de un paciente con filtrado opcional por fecha
export async function GET(request: NextRequest, { params }: Ctx): Promise<Response> {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.response;

  try {
    const { id } = await params;
    const idPaciente = parseId(id);

    if (!idPaciente) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    // Verificar que el paciente exista
    const paciente = await prisma.paciente.findUnique({
      where: { idPaciente },
    });

    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Obtener parámetros de fecha de la URL
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Calcular rango de fechas
    const toDate = toParam ? new Date(toParam) : new Date();
    // Si no hay fecha "desde", calcular 1 mes atrás
    const fromDate = fromParam
      ? new Date(fromParam)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Obtener consultas en el rango de fechas
    const consultas = await prisma.consultas.findMany({
      where: {
        idPaciente,
        fechaHoraConsulta: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        obraSocial: {
          select: {
            idObraSocial: true,
            nombreObraSocial: true,
          },
        },
      },
      orderBy: { fechaHoraConsulta: "desc" },
    });

    return NextResponse.json({ consultas });
  } catch (error) {
    console.error("Error al obtener consultas:", error);
    return NextResponse.json(
      { error: "Error al obtener consultas" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva consulta
export async function POST(req: NextRequest, { params }: Ctx): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  try {
    const { id } = await params;
    const idPaciente = parseId(id);

    if (!idPaciente) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);

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

    // Crear la consulta
    const nuevaConsulta = await prisma.consultas.create({
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
        idPaciente,
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

    return NextResponse.json(nuevaConsulta, { status: 201 });
  } catch (error) {
    console.error("Error al crear consulta:", error);
    return NextResponse.json(
      { error: "Error al crear la consulta" },
      { status: 500 }
    );
  }
}
