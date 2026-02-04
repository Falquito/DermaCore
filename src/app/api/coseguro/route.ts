// app/api/coseguro/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/apiAuth'

export async function GET(req: NextRequest): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  try {
    const coseguros = await prisma.coseguro.findMany({
      orderBy: { idCoseguro: 'desc' }
    })
    return NextResponse.json(coseguros)
  } catch {
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const auth = await verifyAuth(req);
  if (auth.error) return auth.response;

  try {
    const body = await req.json()
    
    if (!body.nombreCoseguro) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const nuevoCoseguro = await prisma.coseguro.create({
      data: {
        nombreCoseguro: body.nombreCoseguro,
        estadoCoseguro: body.estadoCoseguro ?? true
      }
    })

    return NextResponse.json(nuevoCoseguro, { status: 201 })
  } catch (e: unknown) {
    if (
      typeof e === 'object' && 
      e !== null && 
      'code' in e && 
      (e as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ 
        error: "No se pudo crear el coseguro porque el nombre ingresado ya se encuentra registrado" 
      }, { status: 400 })
    }

    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Error al crear: ' + errorMessage }, { status: 500 })
  }
}
