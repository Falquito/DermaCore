'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import InteractiveBackground from "@/components/auth/InteractiveBackground";

function ErrorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const errorType = searchParams.get('error') || 'unknown';
  const reason = searchParams.get('reason') || '';

  const getErrorDetails = (error: string) => {
    const errors: Record<string, { title: string; description: string; icon: string }> = {
      access_denied: {
        title: 'Acceso Denegado',
        description: 'No tienes permiso para acceder a esta sección.',
        icon: '🔒',
      },
      callback: {
        title: 'Error en Autenticación',
        description: 'Ocurrió un error durante el proceso de autenticación.',
        icon: '⚠️',
      },
      oauthsignin: {
        title: 'Error de Inicio de Sesión',
        description: 'No se pudo completar el inicio de sesión con el proveedor.',
        icon: '❌',
      },
      oauthcallback: {
        title: 'Error en Devolución de Llamada',
        description: 'Hubo un problema al procesar la respuesta del proveedor.',
        icon: '🔄',
      },
      oauthprofile: {
        title: 'Error en Perfil',
        description: 'No se pudo obtener la información del perfil.',
        icon: '👤',
      },
      emailsignin: {
        title: 'Error de Correo Electrónico',
        description: 'No se pudo procesar el inicio de sesión por correo.',
        icon: '📧',
      },
      emailcallback: {
        title: 'Enlace Inválido',
        description: 'El enlace de verificación es inválido o ha expirado.',
        icon: '🔗',
      },
      credentialssignin: {
        title: 'Credenciales Inválidas',
        description: 'El email o contraseña que ingresaste no son correctos.',
        icon: '🔑',
      },
      sessioncallback: {
        title: 'Error de Sesión',
        description: 'No se pudo establecer la sesión correctamente.',
        icon: '⏱️',
      },
      jwkcallback: {
        title: 'Error de Configuración',
        description: 'Ocurrió un error en la configuración de seguridad.',
        icon: '⚙️',
      },
      unknown: {
        title: 'Error Desconocido',
        description: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        icon: '😕',
      },
    };

    return errors[error] || errors.unknown;
  };

  const errorDetails = getErrorDetails(errorType);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-600 animate-spin mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* FONDO INTERACTIVO */}
      <div className="absolute inset-0 z-0 lg:static lg:w-1/2 lg:order-2 lg:h-screen bg-cyan-950">
        <InteractiveBackground />
      </div>

      {/* CONTENEDOR DEL CONTENIDO DE ERROR */}
      <div className="w-full relative z-10 flex items-center justify-center min-h-screen lg:min-h-0 lg:w-1/2 lg:order-1 lg:bg-white">
        
        {/* TARJETA DE ERROR */}
        <div className="w-full max-w-120 px-6 py-8 mx-4 
                        bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20
                        lg:bg-transparent lg:shadow-none lg:rounded-none lg:border-none lg:p-0 lg:mx-0 lg:max-w-sm animate-[fadeIn_0.6s_ease-out]">
          
          {/* ENCABEZADO */}
          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
              <span className="text-2xl font-bold text-gray-800 tracking-tight">Dermacor</span>
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {errorDetails.title}
            </h2>
            <p className="text-gray-500">
              {errorDetails.description}
            </p>
          </div>

          {/* ICONO Y DETALLES DE ERROR */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="text-6xl mb-4">{errorDetails.icon}</div>
            
            {reason && (
              <div className="mb-6 rounded-xl bg-yellow-50 p-4 border border-yellow-100 w-full">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">Detalle:</span> {reason}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-cyan-50 p-4 border border-cyan-100 w-full">
              <p className="text-sm text-cyan-700">
                Si el problema persiste, contacta con el equipo de soporte.
              </p>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="space-y-3 flex flex-col">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full py-4 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all duration-200"
            >
              Volver a Iniciar Sesión
            </button>

            <button
              onClick={() => router.back()}
              className="w-full py-4 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 active:scale-[0.99] text-gray-800 font-bold text-lg transition-all duration-200"
            >
              Atrás
            </button>
          </div>

          {/* ENLACES ADICIONALES */}
          <div className="mt-8 pt-6 border-t border-gray-100/50 text-center space-y-3">
            <div>
              <p className="text-gray-500 text-sm">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/auth/register"
                  className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
                >
                  Registrate aquí
                </Link>
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                <Link
                  href="/"
                  className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
                >
                  Ir a Inicio
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-600 animate-spin mb-4"></div>
        </div>
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  );
}
