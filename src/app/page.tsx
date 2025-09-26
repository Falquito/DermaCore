import Image from 'next/image'
import { Shield, Stethoscope, Headphones, ArrowRight, Heart, Users, Calendar } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative z-10 px-6 py-16 text-center">
          <div className="mb-10">
            <Image
              src="/logo.png"
              alt="CareLink Logo"
              width={220}
              height={220}
              className="mx-auto drop-shadow-lg"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Care<span className="text-emerald-300">Link</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Sistema integral de gestión clínica y atención médica
          </p>
          <div className="flex items-center justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <span>Cuidado integral</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Gestión eficiente</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Organización total</span>
            </div>
          </div>
        </div>
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-16 w-full">
            <path d="M0,120L48,110C96,100,192,80,288,70C384,60,480,60,576,65C672,70,768,80,864,85C960,90,1056,90,1152,85L1200,80L1200,120L0,120Z" 
                  fill="rgb(248 250 252)"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-6 pb-16 pt-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Selecciona tu área de trabajo
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Accede al sistema según tu rol profesional para gestionar de manera eficiente todas tus actividades
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Gerencia Card */}
            <a 
              href="/login" 
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2"
            >
              <div className="h-32 bg-gradient-to-br from-amber-500 to-orange-600 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
                <div className="absolute top-6 left-6">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <ArrowRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
                  Gerencia
                </h3>
                <p className="text-gray-600 mb-4">
                  Administración completa del sistema, gestión de usuarios y configuración general de la clínica
                </p>
                <div className="flex items-center text-amber-600 font-medium">
                  <span>Acceder al sistema</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>

            {/* Profesionales Card */}
            <a 
              href="/login" 
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2"
            >
              <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
                <div className="absolute top-6 left-6">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <ArrowRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                  Profesionales
                </h3>
                <p className="text-gray-600 mb-4">
                  Acceso para médicos y especialistas. Gestión de pacientes, historias clínicas y agenda médica
                </p>
                <div className="flex items-center text-emerald-600 font-medium">
                  <span>Acceder al sistema</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>

            {/* Mesa de Entrada Card */}
            <a 
              href="/login" 
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2"
            >
              <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
                <div className="absolute top-6 left-6">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Headphones className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <ArrowRight className="h-6 w-6 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Mesa de Entrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Recepción y atención al paciente. Gestión de turnos, pagos y primeras consultas
                </p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Acceder al sistema</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Sistema seguro y confiable
              </h3>
              <p className="text-gray-600 max-w-3xl mx-auto">
                CareLink proporciona una plataforma integral para la gestión médica, garantizando la seguridad de los datos, 
                la eficiencia operativa y la mejor atención para los pacientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
