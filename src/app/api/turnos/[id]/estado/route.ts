import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PrismaClient, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Permite cambiar el estado de un turno por su ID
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Falta el ID del turno en la URL", code: 4000 },
      { status: 400 }
    );
  }

  const raw = await req.json().catch(() => null);
  const estado = raw?.estado;
  if (!estado || !(Object.values(AppointmentStatus) as string[]).includes(estado)) {
    return NextResponse.json(
      { error: "Estado inválido o faltante", code: 4002 },
      { status: 400 }
    );
  }

  // Buscar el turno
  const turno = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, estado: true },
  });

  if (!turno) {
    return NextResponse.json(
      { error: "Turno no encontrado", code: 4041 },
      { status: 404 }
    );
  }

  // Si el estado es igual, no hacer nada
  if (turno.estado === estado) {
    return NextResponse.json(
      { message: "El turno ya está en ese estado", code: 2001 },
      { status: 200 }
    );
  }

  // Actualizar el estado
  try {
    const updated = await prisma.appointment.update({
      where: { id },
      data: { estado },
    });
    return NextResponse.json(
      { message: "Estado actualizado correctamente", code: 2000, updated },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el estado", code: 5000 },
      { status: 500 }
    );
  }
}
