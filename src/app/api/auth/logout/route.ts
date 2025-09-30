import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST() {
  console.log('🚀 [API LOGOUT] Petición recibida')
  
  try {
    // Obtener cookies
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    console.log('🔍 [API LOGOUT] Token encontrado:', !!sessionToken)
    
    // Si hay token, eliminar sesión de BD
    if (sessionToken) {
      const deletedSessions = await prisma.session.deleteMany({
        where: {
          token: sessionToken
        }
      })
      console.log('🗑️ [API LOGOUT] Sesiones eliminadas:', deletedSessions.count)
    }
    
    // Crear respuesta exitosa
    const response = NextResponse.json(
      { success: true, message: 'Logout exitoso' },
      { status: 200 }
    )
    
    // Eliminar cookie del navegador
    response.cookies.set({
      name: 'session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Eliminar inmediatamente
    })
    
    console.log('✅ [API LOGOUT] Logout completado exitosamente')
    
    return response
    
  } catch (error) {
    console.error('❌ [API LOGOUT] Error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}