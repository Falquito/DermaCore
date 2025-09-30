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
      <div className="w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-lg border border-emerald-100 px-6 pt-6 pb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">Iniciar sesión</h1>
        <p className="text-base text-gray-600 mb-6 text-center">Accede a tu cuenta de CareLink</p>

        {hasError && (
          <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 text-center">
            Credenciales inválidas. Intenta nuevamente.
          </div>
        )}

        <form action={loginAction} className="flex flex-col items-center">
          <div className="w-full max-w-sm flex flex-col">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
              placeholder="tu@correo.com"
            />
          </div>
          <div className="w-full max-w-sm flex flex-col mt-3">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="mt-4 w-auto px-8 mx-auto bg-emerald-600 text-white py-2.5 rounded-md hover:bg-emerald-700 transition shadow"
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
  )
}
