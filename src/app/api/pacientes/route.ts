import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCreatePaciente } from "./dto/create-paciente.dto";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const estado = searchParams.get("estado");

  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 12);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: Record<string, unknown> = {};

  if (estado === "true") where.estadoPaciente = true;
  if (estado === "false") where.estadoPaciente = false;

  if (q) {
    where.OR = [
      { nombrePaciente: { contains: q, mode: "insensitive" } },
      { apellidoPaciente: { contains: q, mode: "insensitive" } },
      { dniPaciente: { contains: q, mode: "insensitive" } },
      { telefonoPaciente: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.paciente.count({ where }),
    prisma.paciente.findMany({
      where,
      orderBy: { idPaciente: "desc" },
      skip,
      take,
      select: {
        idPaciente: true,
        nombrePaciente: true,
        apellidoPaciente: true,
        dniPaciente: true,
        telefonoPaciente: true,
        domicilioPaciente: true,
        fechaHoraPaciente: true,
        estadoPaciente: true,

        consultas: {
          take: 1,
          orderBy: { fechaHoraConsulta: "desc" },
          select: {
            fechaHoraConsulta: true,
            nroAfiliado: true,
            obraSocial: {
              select: {
                idObraSocial: true,
                nombreObraSocial: true,
                estadoObraSocial: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = validateCreatePaciente(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const created = await prisma.paciente.create({
      data: {
        ...parsed.data,
      },
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

    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const error = e as { code?: string };
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un paciente con ese DNI" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Error creando paciente" }, { status: 500 });
  }
}
