// src/app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
// usa import RELATIVO si tu alias @ no funciona
import { prisma } from "../../../../lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { id } = params;
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  try {
    // Soft delete: marcar estado como CANCELADO (lo mostramos como “Eliminado” en la UI)
    const appt = await prisma.appointment.update({
      where: { id },
      data: { estado: "CANCELADO" as any }, // si tu enum es distinto (ELIMINADO), cambialo aquí
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: appt.id });
  } catch (e) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }
}
