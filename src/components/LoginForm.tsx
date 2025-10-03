'use client'

import { useState } from 'react'

function PasswordToggle({ showPassword, onToggle }: { showPassword: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-emerald-600"
    >
      {showPassword ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  )
}

interface LoginFormProps {
  hasError: boolean
  loginAction: (formData: FormData) => Promise<void>
}

export default function LoginForm({ hasError, loginAction }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="rounded-3xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 md:p-8 lg:p-10 shadow-lg hover:shadow-xl transition-all duration-300">
      {hasError && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-red-800">Error de autenticación</span>
          </div>
          <p className="text-sm text-red-700">Credenciales inválidas. Intenta nuevamente.</p>
        </div>
      )}
      
      <form action={loginAction} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Correo electrónico</label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-base"
              placeholder="tu@correo.com"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="block w-full rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-base"
              placeholder="••••••••"
            />
            <PasswordToggle 
              showPassword={showPassword} 
              onToggle={() => setShowPassword(!showPassword)} 
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white font-semibold shadow-lg hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-base"
        >
          <span className="flex items-center justify-center">
            <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar sesión
          </span>
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500 font-medium">¿Nuevo en CareLink?</span>
          </div>
        </div>
        <div className="mt-6">
          <a 
            href="/register" 
            className="inline-flex items-center text-emerald-700 font-semibold hover:text-emerald-800 transition-colors group text-base"
          >
            Crear nueva cuenta
            <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}