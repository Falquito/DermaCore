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
  redirect(roleToPath(res.user.role))
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser()
  if (user) redirect(roleToPath(user.role))

  const sp = await searchParams
  const hasError = !!sp?.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 px-4 text-gray-900">
      <div className="w-full max-w-xl bg-white p-8 sm:p-12 rounded-2xl shadow-md border border-emerald-100">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Iniciar sesión</h1>
          <p className="text-sm text-gray-600 mb-6 text-center">Accede a tu cuenta de CareLink</p>

          {hasError && (
            <div className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              Credenciales inválidas. Intenta nuevamente.
            </div>
          )}

          <form action={loginAction} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2.5 rounded-md hover:bg-emerald-700 transition shadow"
            >
              Entrar
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <a href="/register" className="text-emerald-700 font-medium hover:underline">Crear nueva cuenta</a>
          </div>
        </div>
      </div>
    </div>
  )
}
