import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().trim().nullable().optional(),
  activa: z.boolean().optional(), // true para reactivar
});

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const especialidad = await prisma.especialidad.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        deactivatedBy: { select: { name: true, email: true } },
      },
    });

    if (!especialidad) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json({ especialidad });
  } catch {
    return NextResponse.json({ error: "Error al obtener la especialidad" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (user.role !== "GERENTE") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const payload = (await req.json()) as unknown;
    const data = updateSchema.parse(payload);

    const updateData: {
      nombre?: string;
      descripcion?: string | null;
      activa?: boolean;
      updatedById?: string | null;
      deactivatedAt?: Date | null;
      deactivatedById?: string | null;
    } = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;

    if (data.activa !== undefined) {
      if (data.activa) {
        // Reactivar
        updateData.activa = true;
        updateData.updatedById = user.id;
        updateData.deactivatedAt = null;
        updateData.deactivatedById = null;
      } else {
        return NextResponse.json(
          { error: "Para desactivar use DELETE /api/especialidades/:id" },
          { status: 400 }
        );
      }
    } else {
      updateData.updatedById = user.id; // edición normal
    }

    const updated = await prisma.especialidad.update({
      where: { id: params.id },
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
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json({ error: "Ya existe una especialidad con ese nombre" }, { status: 409 });
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Error al actualizar la especialidad" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (user.role !== "GERENTE") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const updated = await prisma.especialidad.update({
      where: { id: params.id },
      data: {
        activa: false,
        deactivatedAt: new Date(),
        deactivatedById: user.id,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        deactivatedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ especialidad: updated });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al dar de baja la especialidad" }, { status: 500 });
  }
}
