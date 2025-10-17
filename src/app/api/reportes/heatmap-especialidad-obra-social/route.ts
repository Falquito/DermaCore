import { NextResponse } from "next/server";

export async function POST() {
  try {
    // TODO: Implementar endpoint
    return NextResponse.json({ error: "Endpoint en desarrollo" }, { status: 501 });
  } catch (error) {
    console.error("Error en endpoint:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
