// src/app/api/turnos/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma, PrismaClient, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del turno en la URL" },
        { status: 400 }
      );
    }

    const turno = await prisma.appointment.findUnique({
      where: { id },
      include: {
        paciente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            fechaNacimiento: true,
            telefono: true,
            celular: true,
            email: true
          }
        },
        profesional: {
          select: {
            id: true,
            name: true,
            apellido: true,
            email: true,
            especialidad: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        obraSocial: {
          select: {
            id: true,
            nombre: true
          }
        },
        AppointmentCancellation: {
          select: {
            id: true,
            motivo: true,
            cancelledAt: true,
            cancelledBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(turno);

  } catch (error) {
    console.error('Error al obtener turno:', error);
    return NextResponse.json(
      { error: "Error al obtener el turno" },
      { status: 500 }
    );
  }
}

type CancelBody = {
  motivo: string;
  cancelledById: string;
};

function isCancelBody(x: unknown): x is CancelBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.motivo === "string" &&
    o.motivo.trim().length > 0 &&
    typeof o.cancelledById === "string" &&
    o.cancelledById.trim().length > 0
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Falta el ID del turno en la URL", code: 4000 },
      { status: 400 }
    );
  }

  const raw = await req.json().catch(() => null);
  if (!isCancelBody(raw)) {
    return NextResponse.json(
      { error: "Body inválido. Se requiere { motivo, cancelledById }", code: 4001 },
      { status: 400 }
    );
  }

  const motivo = raw.motivo.trim();
  const cancelledById = raw.cancelledById.trim();

  // 1) Buscar el turno para validar y obtener pacienteId
  const turno = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, estado: true, pacienteId: true },
  });

  if (!turno) {
    return NextResponse.json(
      { error: "Turno no encontrado", code: 4041 },
      { status: 404 }
    );
  }

  // Evitar cancelar si ya está finalizado o cancelado
  const ESTADOS_BLOQUEADOS = new Set<AppointmentStatus>([
    AppointmentStatus.COMPLETADO,
    AppointmentStatus.CANCELADO,
  ]);

  if (ESTADOS_BLOQUEADOS.has(turno.estado as AppointmentStatus)) {
    return NextResponse.json(
      {
        error: `El turno está en estado '${turno.estado}' y no puede cancelarse`,
        code: 4091,
      },
      { status: 409 }
    );
  }

  // Validación defensiva por si el turno no tiene paciente (depende de tu modelo)
  if (!turno.pacienteId) {
    return NextResponse.json(
      { error: "El turno no tiene paciente asociado", code: 4221 },
      { status: 422 }
    );
  }

  // 2) Transacción: actualizar turno + crear registro de cancelación
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: turno.id },
        data: { estado: AppointmentStatus.CANCELADO },
      });

      const cancellation = await tx.appointmentCancellation.create({
        data: {
          appointment: { connect: { id: turno.id } },      // relación requerida
          paciente: { connect: { id: turno.pacienteId } }, // paciente del turno
          cancelledBy: { connect: { id: cancelledById } }, // quien realiza la cancelación
          motivo,
        },
        include: {
          appointment: true,
          paciente: true,
          cancelledBy: true,
        },
      });

      return { updated, cancellation };
    });

    return NextResponse.json(
      { message: "Turno cancelado correctamente", code: 2000, ...result },
      { status: 200 }
    );
  } catch (e: unknown) {
    // Manejo de errores de Prisma por tipo (sin usar `any`)
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint failed (p.ej., appointmentId @unique en AppointmentCancellation)
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "El turno ya fue cancelado previamente", code: 4092 },
          { status: 409 }
        );
      }
      // P2025: Record not found (fallo en connect/update)
      if (e.code === "P2025") {
        return NextResponse.json(
          { error: "No se pudo actualizar/crear el registro (no encontrado)", code: 4042 },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error interno al cancelar turno", code: 5000 },
      { status: 500 }
    );
  }
}
