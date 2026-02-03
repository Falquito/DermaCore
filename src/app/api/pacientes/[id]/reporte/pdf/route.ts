import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePacienteHistorialPdf } from "@/lib/pdf/pacienteHistorialPdf";
import fs from "fs";
import path from "path";

// Cache para el logo en base64
let cachedLogoBase64: string | null = null;
let logoLoadTime: number = 0;

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

  // Cargar logo como buffer (cacheado)
  let logoBuffer: Buffer | undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "compressed_charging_logo.png");
    console.log("Intentando cargar logo desde:", logoPath);
    
    // Si está en cache, usarlo
    if (cachedLogoBase64) {
      console.log("Usando logo del cache");
      logoBuffer = Buffer.from(cachedLogoBase64, 'base64');
    } else if (fs.existsSync(logoPath)) {
      logoBuffer = fs.readFileSync(logoPath);
      console.log("Logo comprimido cargado exitosamente:", logoBuffer.length, "bytes");
      // Guardar en cache para próximas requests
      cachedLogoBase64 = logoBuffer.toString('base64');
      logoLoadTime = Date.now();
    } else {
      console.log("Archivo de logo no encontrado en:", logoPath);
    }
  } catch (error) {
    console.error("Error al cargar el logo:", error);
  }

  console.log("Generando PDF con logoBuffer:", logoBuffer ? "presente" : "ausente");
  const doc = generatePacienteHistorialPdf({ paciente, consultas, logoBuffer });

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
