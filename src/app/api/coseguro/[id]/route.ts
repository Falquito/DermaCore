import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/apiAuth'


export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.response;

  try {
    const body = await request.json()
    const { id } = await params

    if (!body.nombreCoseguro) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const coseguroActualizado = await prisma.coseguro.update({
      where: { idCoseguro: +id },
      data: {
        nombreCoseguro: body.nombreCoseguro
      }
    })

    return NextResponse.json(coseguroActualizado)
  } catch (e: unknown) {
    if (
      typeof e === 'object' && 
      e !== null && 
      'code' in e && 
      (e as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ 
        error: "El nombre ingresado ya se encuentra registrado" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.response;

  try {
    const { id } = await params
    const coseguro = await prisma.coseguro.findUnique({
      where:{
        idCoseguro:+id
      }
    })

    if (!coseguro) {
      return NextResponse.json(
        { error: 'Coseguro no encontrado' }, 
        { status: 404 }
      )
    }

    // Soft delete: cambiar el estado a false
    await prisma.coseguro.update({
      where: { idCoseguro: +id },
      data: {
        estadoCoseguro: !coseguro.estadoCoseguro
      }
    })

    return NextResponse.json({ message: 'Coseguro eliminado correctamente' })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
