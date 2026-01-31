import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePacienteHistorialPdf } from "@/lib/pdf/pacienteHistorialPdf";

function parseId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const idPaciente = parseId(id);

  if (!idPaciente) {
    return NextResponse.json(
      { error: "ID de paciente inválido" },
      { status: 400 }
    );
  }

  const paciente = await prisma.paciente.findUnique({
    where: { idPaciente },
  });

  if (!paciente) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    );
  }

  const consultas = await prisma.consultas.findMany({
    where: { idPaciente },
    include: { obraSocial: true, coseguro: true },
    orderBy: { fechaHoraConsulta: "asc" },
  });

  const doc = generatePacienteHistorialPdf({ paciente, consultas });

  const chunks: Buffer[] = [];
  const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

  const filename = `paciente-${paciente.idPaciente}-historial.pdf`;

  const body = new Uint8Array(pdfBuffer);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
