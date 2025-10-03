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

interface RegisterFormProps {
  exists: boolean
  nomatch: boolean
  registerAction: (formData: FormData) => Promise<void>
}

export default function RegisterForm({ exists, nomatch, registerAction }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="rounded-3xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 md:p-8 lg:p-10 shadow-lg hover:shadow-xl transition-all duration-300">
      {exists && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">Email ya registrado</span>
          </div>
          <p className="text-sm text-yellow-700">Ya existe una cuenta con ese email.</p>
        </div>
      )}
      {nomatch && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-red-800">Error de contraseña</span>
          </div>
          <p className="text-sm text-red-700">Las contraseñas no coinciden.</p>
        </div>
      )}
      
      <form action={registerAction} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Nombre completo</label>
            <div className="relative">
              <input 
                id="name" 
                name="name" 
                type="text"
                required
                className="block w-full rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-base" 
                placeholder="Juan Pérez"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 md:col-span-2">
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
                minLength={6} 
                className="block w-full rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-base" 
                placeholder="Mínimo 6 caracteres"
              />
              <PasswordToggle 
                showPassword={showPassword} 
                onToggle={() => setShowPassword(!showPassword)} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirm" className="block text-sm font-semibold text-gray-700">Confirmar contraseña</label>
            <div className="relative">
              <input 
                id="confirm" 
                name="confirm" 
                type={showConfirmPassword ? "text" : "password"}
                required 
                minLength={6} 
                className="block w-full rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 shadow-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-base" 
                placeholder="Repite tu contraseña"
              />
              <PasswordToggle 
                showPassword={showConfirmPassword} 
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)} 
              />
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <button 
            type="submit" 
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white font-semibold shadow-lg hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-base"
          >
            <span className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Crear cuenta
            </span>
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500 font-medium">¿Ya tienes cuenta?</span>
          </div>
        </div>
        <div className="mt-6">
          <a 
            href="/login" 
            className="inline-flex items-center text-emerald-700 font-semibold hover:text-emerald-800 transition-colors group text-base"
          >
            Iniciar sesión
            <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}