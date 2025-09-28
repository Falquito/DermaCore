import { getCurrentUser, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AlertCircle, Home, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

async function signOutAction() {
  'use server'
  await signOut()
  redirect('/login')
}

async function goHomeAction() {
  'use server'
  redirect('/')
}

export default async function ErrorPage() {
  const user = await getCurrentUser()
  
  // If user is not logged in, redirect to login
  if (!user) {
    redirect('/login')
  }

  const roleLabels = {
    PROFESIONAL: 'Profesional',
    MESA_ENTRADA: 'Mesa de entrada',
    GERENTE: 'Gerente'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-gray-900 relative overflow-hidden">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/doctor-icon-virtual-screen-health-care-and-medical-on-background-copy-space-free-photo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px)',
          zIndex: 0,
        }}
      />
      {/* Gradient overlay for diffuminated effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.7) 100%)',
          zIndex: 1,
        }}
      />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden bg-opacity-90 backdrop-blur-sm relative" style={{zIndex:2}}>
          {/* Header */}
          <div className="bg-red-600 px-6 py-5 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">
              USTED NO CUENTA CON LOS PERMISOS NECESARIOS
            </h1>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="space-y-6">
              {/* User Info */}
              <div className="text-center">
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Usuario:</span> {user.name || user.email}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> {user.email}
                </p>
              </div>

              {/* Roles */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-700 text-center mb-3">
                  <span className="font-medium">Sus roles:</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {user.roles.length > 0 ? (
                    user.roles.map(role => (
                      <span 
                        key={role}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border"
                      >
                        {roleLabels[role]}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                      Sin roles asignados
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                {user.roles.length === 0 ? (
                  <p>
                    Su cuenta no tiene ningún rol asignado. Por favor, contacte con el administrador del sistema para que le asigne los permisos necesarios.
                  </p>
                ) : (
                  <p>
                    Sus roles actuales no tienen permisos para acceder a la sección solicitada. Si cree que esto es un error, contacte con el administrador del sistema.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-3 pt-2">
                <form action={goHomeAction}>
                  <Button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Volver al inicio
                  </Button>
                </form>
                
                <form action={signOutAction}>
                  <Button 
                    type="submit"
                    variant="outline" 
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          ¿Necesita ayuda? Contacte al administrador del sistema
        </div>
      </div>
    </div>
  )
}