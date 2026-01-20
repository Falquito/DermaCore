// app/api/obras-sociales/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/apiAuth'

export async function GET(req: NextRequest): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  try {
    const obras = await prisma.obraSocial.findMany({
      orderBy: { idObraSocial: 'desc' }
    })
    return NextResponse.json(obras)
  } catch {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  try {
    const body = await req.json()
    
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
  } catch (e: unknown) {
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