"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import InteractiveBackground from "@/components/auth/InteractiveBackground";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // ... (useEffects se mantienen igual)
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/obras-sociales");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setRegistered(true);
      const timer = setTimeout(() => setRegistered(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-600 animate-spin mb-4"></div>
          <div className="text-cyan-600 font-semibold tracking-wide">Cargando Dermacor...</div>
        </div>
      </div>
    );
  }

  if (status === "authenticated") return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/obras-sociales");
    } else {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* 1. AREA DEL FONDO INTERACTIVO 
          Móvil: Absolute inset-0 (Fondo total detrás de todo)
          Desktop (lg): Static width-1/2 (Columna derecha sólida)
      */}
      <div className="absolute inset-0 z-0 lg:static lg:w-1/2 lg:order-2 lg:h-screen bg-cyan-950">
        <InteractiveBackground />
      </div>

      {/* 2. AREA DEL FORMULARIO
          Móvil: Relative z-10 (Encima del fondo)
          Desktop (lg): Static width-1/2 (Columna izquierda sólida)
      */}
      <div className="w-full relative z-10 flex items-center justify-center min-h-screen lg:min-h-0 lg:w-1/2 lg:order-1 lg:bg-white">
        
        {/* CONTENEDOR DE LA TARJETA
            Móvil: Tiene fondo blanco translúcido, bordes redondeados y sombra (look tarjeta flotante).
            Desktop (lg): Se quitan los bordes, sombras y fondo para que se vea limpio sobre el blanco.
        */}
        <div className="w-full max-w-[420px] px-6 py-8 mx-4 
                        bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20
                        lg:bg-transparent lg:shadow-none lg:rounded-none lg:border-none lg:p-0 lg:mx-0 lg:max-w-md animate-[fadeIn_0.5s_ease-out]">
          
          {/* Header */}
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
              <span className="text-2xl font-bold text-gray-800 tracking-tight">Dermacor</span>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-gray-500">
              Ingresa tus credenciales para acceder al portal.
            </p>
          </div>

          {/* Alertas */}
          {registered && (
            <div className="mb-6 rounded-xl bg-cyan-50 p-4 border border-cyan-100 flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <p className="text-sm text-cyan-800 font-medium">
                ¡Cuenta creada! Ya puedes iniciar sesión.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 animate-[shake_0.4s_ease-in-out]">
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="group">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="group">
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none mt-2"
            >
              {loading ? "Procesando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              ¿Aún no tienes cuenta?{' '}
              <Link
                href="/auth/register"
                className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}