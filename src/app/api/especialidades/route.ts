import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Solo letras (incluye tildes/ñ) y espacios
const nombreRegex = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/;

const createSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .regex(nombreRegex, "El nombre solo puede contener letras y espacios"),
  descripcion: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const incluirInactivas = (searchParams.get("incluirInactivas") ?? "false") === "true";

    const where: Prisma.EspecialidadWhereInput = {
      AND: [
        incluirInactivas ? {} : { activa: true },
        q
          ? {
              OR: [
                { nombre: { contains: q, mode: "insensitive" } },
                { descripcion: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const especialidades = await prisma.especialidad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        deactivatedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ especialidades });
  } catch (err: unknown) {
    console.error("[API][especialidades][GET] error:", err);
    return NextResponse.json({ error: "Error al cargar especialidades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!user.roles.includes("GERENTE")) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const payload = (await req.json()) as unknown;
    const data = createSchema.parse(payload);

    const created = await prisma.especialidad.create({
      data: {
        nombre: data.nombre, // ya viene trimmeado y validado por zod
        descripcion: data.descripcion,
        createdById: user.id, // auditoría
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        deactivatedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(
      { especialidad: created, message: "Especialidad registrada exitosamente" },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una especialidad con ese nombre" }, { status: 409 });
    }
    console.error("[API][especialidades][POST] error:", err);
    return NextResponse.json({ error: "Error al crear la especialidad" }, { status: 500 });
  }
}
