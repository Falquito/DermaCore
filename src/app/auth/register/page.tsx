'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import InteractiveBackground from "@/components/auth/InteractiveBackground";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/obras-sociales");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-600 animate-spin mb-4"></div>
        </div>
      </div>
    );
  }

  if (status === "authenticated") return null;

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* 1. FONDO INTERACTIVO 
          Móvil: Absolute inset-0 (Fondo completo)
          Desktop: Static width-1/2 order-2 (Columna derecha)
      */}
      <div className="absolute inset-0 z-0 lg:static lg:w-1/2 lg:order-2 lg:h-screen bg-cyan-950">
        <InteractiveBackground />
      </div>

      {/* 2. CONTENEDOR DEL FORMULARIO
          Móvil: Relative z-10 (Encima del fondo)
          Desktop: Static width-1/2 order-1 (Columna izquierda)
      */}
      <div className="w-full relative z-10 flex items-center justify-center min-h-screen lg:min-h-0 lg:w-1/2 lg:order-1 lg:bg-white">
        
        {/* TARJETA / CONTENIDO
            Móvil: Estilo 'Glassmorphism' (blanco translúcido, bordes, sombras)
            Desktop: Estilo limpio (sin fondo, sin sombras, integrado)
        */}
        <div className="w-full max-w-[480px] px-6 py-8 mx-4 
                        bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20
                        lg:bg-transparent lg:shadow-none lg:rounded-none lg:border-none lg:p-0 lg:mx-0 lg:max-w-sm animate-[fadeIn_0.6s_ease-out]">
          
          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
              <span className="text-2xl font-bold text-gray-800 tracking-tight">Dermacor</span>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Crear una cuenta
            </h2>
            <p className="text-gray-500">
              Empieza a gestionar tu consultorio hoy mismo.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 flex items-center gap-3">
               <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Nombre completo <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Dr. Juan Pérez"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Mín. 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                  Confirmar
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repetir"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Creando cuenta...' : 'Continuar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100/50 text-center">
            <p className="text-gray-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}