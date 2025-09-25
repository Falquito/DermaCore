import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, roleToPath, signIn } from '@/lib/auth'

async function registerAction(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirm') || '')

  if (password !== confirm) {
    redirect('/register?error=nomatch')
  }
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    redirect('/register?error=exists')
  }
  const passwordHash = await hashPassword(password)
  await prisma.user.create({ data: { email, name, passwordHash } })

  const res = await signIn(email, password)
  if (res.ok) {
    redirect('/')
  }
  redirect('/login')
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser()
  if (user && user.role !== null) redirect(roleToPath(user.role))

  const sp = await searchParams
  const exists = sp?.error === 'exists'
  const nomatch = sp?.error === 'nomatch'
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-gray-900 relative"
      style={{
        backgroundImage: 'url(/premium_photo-1673953510197-0950d951c6d9.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
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
          <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
          <p className="text-sm text-emerald-100 mb-0">Regístrate para usar CareLink</p>
        </div>
  <div className="px-6 pt-6 pb-8">
          {exists && (
            <div className="mb-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200 text-center">
              Ya existe una cuenta con ese email.
            </div>
          )}
          {nomatch && (
            <div className="mb-2 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200 text-center">
              Las contraseñas no coinciden.
            </div>
          )}
          <form action={registerAction} className="flex flex-col items-center">
            <div className="w-full max-w-sm flex flex-col">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input id="name" name="name" className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 shadow-sm" />
            </div>
            <div className="w-full max-w-sm flex flex-col mt-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" name="email" type="email" required className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 shadow-sm" />
            </div>
            <div className="w-full max-w-sm flex flex-col mt-3">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input id="password" name="password" type="password" required minLength={6} className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 shadow-sm" />
            </div>
            <div className="w-full max-w-sm flex flex-col mt-3">
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input id="confirm" name="confirm" type="password" required minLength={6} className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 shadow-sm" />
            </div>
            <button type="submit" className="mt-5 max-w-sm w-full sm:w-auto bg-emerald-600 text-white py-2.5 px-8 rounded-lg hover:bg-emerald-700 transition shadow font-semibold text-base">Crear cuenta</button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}<a href="/login" className="text-emerald-700 font-medium hover:underline">Iniciar sesión</a>
          </div>
        </div>
      </div>
    </div>
  )
}
