import { redirect } from 'next/navigation'
import { signIn, getCurrentUser, roleToPath } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function loginAction(formData: FormData) {
  'use server'
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const res = await signIn(email, password)
  if (!res.ok) {
    redirect('/login?error=1')
  }
  // If role is null, redirect to home or a safe default
  if (!res.user.role) {
    redirect('/')
  }
  redirect(roleToPath(res.user.role))
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser()
  if (user) {
    if (!user.role) {
      redirect('/')
    }
    redirect(roleToPath(user.role))
  }

  const sp = await searchParams
  const hasError = !!sp?.error

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-gray-900 relative overflow-hidden"
    >
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
      <div className="w-full max-w-md flex flex-col bg-white rounded-xl shadow border border-gray-200 px-0 pt-0 pb-0 bg-opacity-90 backdrop-blur-sm relative" style={{zIndex:2}}>
        {/* Topbar style header */}
        <div className="bg-emerald-600 rounded-t-xl px-6 py-5 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-white mb-1">Iniciar sesión</h1>
          <p className="text-sm text-emerald-100 mb-0">Accede a tu cuenta de CareLink</p>
        </div>
        <div className="px-6 pt-6 pb-8">
          {hasError && (
            <div className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200 text-center">
              Credenciales inválidas. Intenta nuevamente.
            </div>
          )}
          <form action={loginAction} className="flex flex-col items-center">
            <div className="w-full max-w-sm flex flex-col">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 shadow-sm"
                placeholder="tu@correo.com"
              />
            </div>
            <div className="w-full max-w-sm flex flex-col mt-3">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 shadow-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="mt-5 max-w-sm w-full sm:w-auto bg-emerald-600 text-white py-2.5 px-8 rounded-lg hover:bg-emerald-700 transition shadow font-semibold text-base"
            >
              Iniciar sesión
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <a href="/register" className="text-emerald-700 font-medium hover:underline">Crear nueva cuenta</a>
          </div>
        </div>
      </div>
    </div>
  )
}
