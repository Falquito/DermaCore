import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Schema para actualización parcial - Fixed role validation
const updateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").optional(),
  codigo: z.string().trim().optional().nullable(),
  activa: z.boolean().optional(),
});

// GET /api/obras-sociales/[id]
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await context.params;

    const obraSocial = await prisma.obraSocial.findUnique({
      where: { id },
    });

    if (!obraSocial) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json({ obraSocial });
  } catch (err: unknown) {
    console.error("[API][obras-sociales][GET:id] error:", err);
    return NextResponse.json({ error: "Error al obtener la obra social" }, { status: 500 });
  }
}

// PUT /api/obras-sociales/[id]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!user.roles?.includes("GERENTE")) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const { id } = await context.params;
    const payload = (await req.json()) as unknown;
    const data = updateSchema.parse(payload);

    // Construimos el objeto de update
    const updateData: Prisma.ObraSocialUpdateInput = {};

    if (typeof data.nombre === "string") updateData.nombre = data.nombre.trim();
    if (typeof data.codigo === "string") updateData.codigo = data.codigo.trim();
    if (data.codigo === null) updateData.codigo = null;
    if (typeof data.activa === "boolean") updateData.activa = data.activa;

    const updated = await prisma.obraSocial.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ obraSocial: updated });
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
        { error: "Ya existe una obra social con ese nombre o código" },
        { status: 409 }
      );
    }
    console.error("[API][obras-sociales][PUT:id] error:", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE /api/obras-sociales/[id] (baja lógica)
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!user.roles?.includes("GERENTE")) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const { id } = await context.params;

    const updated = await prisma.obraSocial.update({
      where: { id },
      data: {
        activa: false,
      },
    });

    return NextResponse.json({ obraSocial: updated });
  } catch (err: unknown) {
    console.error("[API][obras-sociales][DELETE:id] error:", err);
    return NextResponse.json({ error: "Error al desactivar" }, { status: 500 });
  }
}
