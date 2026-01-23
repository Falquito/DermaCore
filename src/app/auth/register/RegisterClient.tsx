'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import InteractiveBackground from "@/components/auth/InteractiveBackground";
import LogoComponent from "@/components/Logo";
import LoadingLogo from "@/components/LoadingLogo";

export default function RegisterClient() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrar el usuario');
        setLoading(false);
        return;
      }

      router.push('/auth/login?registered=true');
    } catch {
      setError('Error al conectar con el servidor');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Pantalla de carga */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-cyan-900 via-cyan-950 to-slate-900">
          <div className="flex flex-col items-center gap-6">
            <LoadingLogo size={100} />
            <p className="text-cyan-200/80 text-sm font-medium tracking-wide animate-pulse">
              Cargando...
            </p>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div 
        className={`min-h-dvh w-full flex flex-col lg:flex-row relative overflow-hidden transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Fondo interactivo - Siempre absoluto, visible a través de la curva en desktop */}
        <div className="absolute inset-0 z-0 bg-linear-to-br from-cyan-900 via-cyan-950 to-slate-900">
          <InteractiveBackground />
        </div>

        {/* Contenedor del formulario */}
        <div className="w-full relative z-10 flex flex-col min-h-dvh px-4 py-6 sm:py-8 lg:w-[55%] lg:order-1 lg:px-0 lg:py-0">
          
          {/* Fondo blanco con curva recortada - Solo desktop */}
          <div className="hidden lg:block absolute inset-0 z-0">
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="h-full w-full"
            >
              <path 
                d="M0 0 L85 0 Q100 50 85 100 L0 100 Z" 
                className="fill-white"
              />
            </svg>
          </div>
          
          {/* Logo en esquina superior izquierda - Solo desktop, responsive */}
          <div className="hidden lg:block absolute top-5 left-5 xl:top-6 xl:left-8 2xl:top-8 2xl:left-10 z-20">
            <LogoComponent className="lg:text-xl xl:text-2xl 2xl:text-3xl" />
          </div>

          {/* Contenedor centrado del formulario */}
          <div className="relative z-10 flex-1 flex items-center justify-center lg:px-8 lg:pr-20 xl:px-12 xl:pr-28 2xl:px-16 2xl:pr-36">
            {/* Tarjeta del formulario - Con burbuja en móvil, sin burbuja en desktop */}
            <div 
              className="w-full max-w-85 sm:max-w-sm md:max-w-md
                        px-5 sm:px-6 md:px-8 py-6 sm:py-8
                        bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl 
                        shadow-2xl shadow-black/10 border border-white/50
                        lg:bg-transparent lg:shadow-none lg:border-none lg:rounded-none
                        lg:max-w-md lg:px-0 lg:py-0"
            >
              {/* Header con logo - Logo visible solo en móvil dentro de la tarjeta */}
              <div className="mb-5 sm:mb-6 lg:mb-8 text-center lg:text-left">
                <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5 lg:hidden">
                  <LogoComponent size="md" />
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-[1.75rem] xl:text-3xl font-bold text-gray-900 mb-1.5 lg:mb-2 tracking-tight">
                  Crear cuenta
                </h2>
                <p className="text-gray-500 text-sm sm:text-base lg:text-sm xl:text-base">
                  Empieza a gestionar tu consultorio hoy.
                </p>
              </div>

            {/* Mensaje de error */}
            {error && (
              <div className="mb-4 sm:mb-6 rounded-xl bg-red-50 p-3 sm:p-4 border border-red-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Formulario */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Campo nombre */}
              <div className="group">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Nombre completo <span className="text-gray-400 font-normal text-xs">(Opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Dr. Juan Pérez"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 
                             bg-gray-50 text-gray-900 placeholder-gray-400 text-sm sm:text-base
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 
                             focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Campo email */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 
                             bg-gray-50 text-gray-900 placeholder-gray-400 text-sm sm:text-base
                             focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 
                             focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Campos de contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Mín. 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-11 pr-11 py-3 sm:py-3.5 rounded-xl border border-gray-200 
                               bg-gray-50 text-gray-900 placeholder-gray-400 text-sm sm:text-base
                               focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 
                               focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 
                               hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    Confirmar
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Repetir"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-11 pr-11 py-3 sm:py-3.5 rounded-xl border border-gray-200 
                               bg-gray-50 text-gray-900 placeholder-gray-400 text-sm sm:text-base
                               focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 
                               focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 
                               hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón crear cuenta - Deshabilitado temporalmente */}
              <button
                type="button"
                disabled={true}
                className="group relative w-full py-3.5 sm:py-4 px-6 rounded-xl overflow-hidden
                         bg-linear-to-r from-gray-400 to-gray-500 
                         text-white font-bold text-base sm:text-lg 
                         shadow-lg shadow-gray-500/25 
                         cursor-not-allowed opacity-70
                         flex items-center justify-center gap-2 mt-6"
              >
                <span>Crear cuenta</span>
                <ArrowRight size={20} />
              </button>
            </form>

            {/* Link a login */}
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200/50 text-center">
              <p className="text-gray-500 text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors 
                           underline-offset-2 hover:underline decoration-2"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
