import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Eliminar la cookie del token de sesión
    const cookieStore = await cookies()
    cookieStore.delete('session-token')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}