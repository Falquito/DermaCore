import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  codigo: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const incluirInactivas = (searchParams.get("incluirInactivas") ?? "false") === "true";

    const where: Prisma.ObraSocialWhereInput = {
      AND: [
        incluirInactivas ? {} : { activa: true },
        q
          ? {
              OR: [
                { nombre: { contains: q, mode: "insensitive" } },
                { codigo: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const obrasSociales = await prisma.obraSocial.findMany({
      where,
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ obrasSociales });
  } catch (err: unknown) {
    console.error("[API][obras-sociales][GET] error:", err);
    return NextResponse.json({ error: "Error al cargar obras sociales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!user.roles?.includes("GERENTE")) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const payload = (await req.json()) as unknown;
    const data = createSchema.parse(payload);

    const created = await prisma.obraSocial.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo || null,
      },
    });

    return NextResponse.json(
      { obraSocial: created, message: "Obra social registrada exitosamente" },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una obra social con ese nombre o código" }, { status: 409 });
    }
    console.error("[API][obras-sociales][POST] error:", err);
    return NextResponse.json({ error: "Error al crear la obra social" }, { status: 500 });
  }
}