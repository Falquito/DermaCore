import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, roleToPath, signIn } from '@/lib/auth'
import type { Role } from '@prisma/client'

async function registerAction(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const role = String(formData.get('role') || 'MESA_ENTRADA') as Role

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    redirect('/register?error=exists')
  }
  const passwordHash = await hashPassword(password)
  await prisma.user.create({ data: { email, name, passwordHash, role } })

  const res = await signIn(email, password)
  if (res.ok) {
    redirect(roleToPath(res.user.role))
  }
  redirect('/login')
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser()
  if (user) redirect(roleToPath(user.role))

  const sp = await searchParams
  const exists = sp?.error === 'exists'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 px-4 text-gray-900">
      <div className="w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-lg border border-emerald-100 px-6 pt-6 pb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Crear cuenta</h1>
        <p className="text-base text-gray-600 mb-2 text-center">Regístrate para usar CareLink</p>
        {exists && (
          <div className="mb-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200 text-center">
            Ya existe una cuenta con ese email.
          </div>
        )}
        <form action={registerAction} className="flex flex-col items-center">
          <div className="w-full max-w-sm flex flex-col">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input id="name" name="name" className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" />
          </div>
          <div className="w-full max-w-sm flex flex-col mt-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" required className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" />
          </div>
          <div className="w-full max-w-sm flex flex-col mt-3">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input id="password" name="password" type="password" required minLength={6} className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" />
          </div>
          <div className="w-full max-w-sm flex flex-col mt-3">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
            <select id="role" name="role" className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900">
              <option value="PROFESIONAL">Profesional</option>
              <option value="MESA_ENTRADA">Mesa de entrada</option>
              <option value="GERENTE">Gerente</option>
            </select>
          </div>
          <button type="submit" className="mt-4 max-w-sm w-full sm:w-auto bg-emerald-600 text-white py-2.5 px-8 rounded-md hover:bg-emerald-700 transition shadow">Crear cuenta</button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}<a href="/login" className="text-emerald-700 font-medium hover:underline">Iniciar sesión</a>
        </div>
      </div>
    </div>
  )
}
