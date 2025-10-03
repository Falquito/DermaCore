import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword, getDefaultPath, signIn } from '@/lib/auth'
import RegisterForm from '@/components/RegisterForm'

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
  if (user && user.roles.length > 0) redirect(getDefaultPath(user.roles))

  const sp = await searchParams
  const exists = sp?.error === 'exists'
  const nomatch = sp?.error === 'nomatch'
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 text-gray-900 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Main content container - más amplio y responsive */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Welcome content - visible on larger screens */}
          <div className="hidden lg:block text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <div className="mx-auto lg:mx-0 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
                ¡Únete a CareLink!
              </h1>
              <p className="text-lg xl:text-xl text-gray-600 leading-relaxed">
                Crea tu cuenta y comienza a gestionar tu atención médica de manera eficiente y moderna
              </p>
            </div>
            
            {/* Benefits list */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Registro rápido y seguro</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Acceso a todas las funciones</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">Soporte técnico incluido</span>
              </div>
            </div>
          </div>
          
          {/* Register form section */}
          <div className="w-full">
            {/* Mobile header */}
            <div className="text-center mb-8 lg:hidden">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Únete a CareLink!</h1>
              <p className="text-gray-600">Crea tu cuenta y comienza a gestionar tu atención médica</p>
            </div>

            <RegisterForm exists={exists} nomatch={nomatch} registerAction={registerAction} />
          </div>
        </div>
      </div>
    </div>
  )
}
