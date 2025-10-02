import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Solo letras (incluye tildes/ñ) y espacios
const nombreRegex = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]+$/;

// Schema para actualización parcial
const updateSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .regex(nombreRegex, "El nombre solo puede contener letras y espacios")
    .optional(),
  descripcion: z.string().trim().optional().nullable(),
  activa: z.boolean().optional(),
});

// GET /api/especialidades/[id]
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await context.params;

    const especialidad = await prisma.especialidad.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        deactivatedBy: { select: { name: true, email: true } },
      },
    });

    if (!especialidad) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json({ especialidad });
  } catch (err: unknown) {
    console.error("[API][especialidades][GET:id] error:", err);
    return NextResponse.json({ error: "Error al obtener la especialidad" }, { status: 500 });
  }
}

// PUT /api/especialidades/[id]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!user.roles.includes("GERENTE")) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = (await req.json()) as unknown;
    const data = updateSchema.parse(payload);

    // Construimos el objeto de update con auditoría
    const updateData: Prisma.EspecialidadUpdateInput = {
      updatedBy: { connect: { id: user.id } },
    };

    if (typeof data.nombre === "string") updateData.nombre = data.nombre.trim();
    if (typeof data.descripcion === "string")
      updateData.descripcion = data.descripcion.trim();
    if (data.descripcion === null) updateData.descripcion = null;

    // Activación / desactivación (baja lógica)
    if (typeof data.activa === "boolean") {
      if (data.activa === false) {
        updateData.activa = false;
        updateData.deactivatedAt = new Date();
        updateData.deactivatedBy = { connect: { id: user.id } };
      } else {
        // re-activar
        updateData.activa = true;
        updateData.deactivatedAt = null;
        updateData.deactivatedBy = { disconnect: true };
      }
    }

    const updated = await prisma.especialidad.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        deactivatedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ especialidad: updated });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una especialidad con ese nombre" },
        { status: 409 }
      );
    }
    console.error("[API][especialidades][PUT:id] error:", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE /api/especialidades/[id]  (baja lógica)
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!user.roles.includes("GERENTE")) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const { id } = await context.params;

    const updated = await prisma.especialidad.update({
      where: { id },
      data: {
        activa: false,
        deactivatedAt: new Date(),
        deactivatedBy: { connect: { id: user.id } },
        updatedBy: { connect: { id: user.id } },
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        deactivatedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ especialidad: updated });
  } catch (err: unknown) {
    console.error("[API][especialidades][DELETE:id] error:", err);
    return NextResponse.json({ error: "Error al desactivar" }, { status: 500 });
  }
}
