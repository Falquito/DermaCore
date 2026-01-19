// app/api/obras-sociales/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const obras = await prisma.obraSocial.findMany({
      orderBy: { idObraSocial: 'desc' }
    })
    return NextResponse.json(obras)
  } catch {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.nombreObraSocial) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }
    const nuevaObra = await prisma.obraSocial.create({
      data: {
        nombreObraSocial: body.nombreObraSocial.toLowerCase(),
        estadoObraSocial: body.estadoObraSocial ?? true
      }
    })

    return NextResponse.json(nuevaObra, { status: 201 })
  } catch (e: unknown) { // Cambiamos 'any' por 'unknown' para complacer al linter
    
    // Comprobamos si 'e' es un objeto y tiene la propiedad 'code' de forma segura
    if (
      typeof e === 'object' && 
      e !== null && 
      'code' in e && 
      (e as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ 
        error: "No se pudo crear la obra social porque el nombre ingresado ya se encuentra registrada" 
      }, { status: 400 })
    }

    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Error al crear: ' + errorMessage }, { status: 500 })
  }

}