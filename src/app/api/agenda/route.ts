// src/app/api/agenda/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; // o relativo según tu estructura

const dbToUi: Record<string, "PENDING"|"WAITING"|"COMPLETED"|"CANCELED"> = {
  PROGRAMADO: "PENDING",
  EN_SALA: "WAITING",
  EN_ESPERA: "WAITING",
  FINALIZADO: "COMPLETED",
  CANCELADO: "CANCELED",
};

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const from = new Date(searchParams.get("from")!);
  const to   = new Date(searchParams.get("to")!);

  const appts = await prisma.appointment.findMany({
    where: { fecha: { gte: from, lt: to } },
    orderBy: { fecha: "asc" },
    select: {
      id: true,
      profesionalId: true, // 👈 DB
      pacienteId: true,
      fecha: true,
      duracion: true,
      motivo: true,
      observaciones: true,
      estado: true,
    },
  });

  const items = appts.map(a => {
    const start = new Date(a.fecha);
    const end   = new Date(start.getTime() + a.duracion * 60000);
    return {
      id: a.id,
      professionalId: a.profesionalId, // 👈 map a UI
      patientId: a.pacienteId,
      title: a.motivo || "Consulta",
      start: start.toISOString(),
      end: end.toISOString(),
      status: dbToUi[a.estado] ?? "PENDING",
      notes: a.observaciones ?? null,
    };
  });

  return NextResponse.json(items);
}
