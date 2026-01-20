import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateUpdatePaciente } from "../dto/update-paciente.dto";
import { verifyAuth } from "@/lib/apiAuth";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  const { id } = await params;
  const idPaciente = parseId(id);
  if (!idPaciente) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const paciente = await prisma.paciente.findUnique({
    where: { idPaciente },
    select: {
      idPaciente: true,
      nombrePaciente: true,
      apellidoPaciente: true,
      dniPaciente: true,
      telefonoPaciente: true,
      domicilioPaciente: true,
      fechaHoraPaciente: true,
      estadoPaciente: true,
    },
  });

  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  return NextResponse.json(paciente);
}

export async function PUT(req: NextRequest, { params }: Ctx): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  const { id } = await params;
  const idPaciente = parseId(id);
  if (!idPaciente) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = validateUpdatePaciente(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const updated = await prisma.paciente.update({
      where: { idPaciente },
      data: parsed.data,
      select: {
        idPaciente: true,
        nombrePaciente: true,
        apellidoPaciente: true,
        dniPaciente: true,
        telefonoPaciente: true,
        domicilioPaciente: true,
        fechaHoraPaciente: true,
        estadoPaciente: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const error = e as { code?: string };
    if (error?.code === "P2025") return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    if (error?.code === "P2002") return NextResponse.json({ error: "Ya existe un paciente con ese DNI" }, { status: 409 });
    return NextResponse.json({ error: "Error actualizando paciente" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  const { id } = await params;
  const idPaciente = parseId(id);
  if (!idPaciente) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  try {
    const result = await prisma.paciente.update({
      where: { idPaciente },
      data: { estadoPaciente: false },
      select: { idPaciente: true, estadoPaciente: true },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    const error = e as { code?: string };
    if (error?.code === "P2025") return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    return NextResponse.json({ error: "Error dando de baja paciente" }, { status: 500 });
  }
}
