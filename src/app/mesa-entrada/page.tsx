import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function MesaEntradaPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roles.length === 0) redirect('/error')
  if (!user.roles.includes('MESA_ENTRADA')) redirect('/error')

  // Obtener datos en tiempo real para el dashboard
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)

  const [turnosHoy, turnosProgramados, turnosConfirmados] = await Promise.all([
    prisma.appointment.count({
      where: { fecha: { gte: hoy, lt: manana } }
    }),
    prisma.appointment.count({
      where: { fecha: { gte: hoy, lt: manana }, estado: 'PROGRAMADO' }
    }),
    prisma.appointment.count({
      where: { fecha: { gte: hoy, lt: manana }, estado: 'CONFIRMADO' }
    })
  ])

  return (
    <main className="flex-1 p-5 md:p-8">
      <div className="w-full space-y-4">
        {/* Header con saludo personalizado y resumen */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Hola, {user.name?.split(' ')[0] || 'Usuario'}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                {new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches'} • {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Turnos de hoy</div>
              <div className="text-4xl font-bold text-emerald-600">{turnosHoy}</div>
            </div>
          </div>
        </section>

        {/* KPIs del día en tiempo real */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="text-xs font-medium text-blue-600 uppercase mb-1">Programados</div>
            <div className="text-2xl font-bold text-gray-900">{turnosProgramados}</div>
            <div className="text-xs text-gray-500 mt-1">Pendientes confirmar</div>
          </div>
          
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
            <div className="text-xs font-medium text-emerald-600 uppercase mb-1">Confirmados</div>
            <div className="text-2xl font-bold text-gray-900">{turnosConfirmados}</div>
            <div className="text-xs text-gray-500 mt-1">Asistirán hoy</div>
          </div>
          
          <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
            <div className="text-xs font-medium text-purple-600 uppercase mb-1">Ocupación</div>
            <div className="text-2xl font-bold text-gray-900">
              {turnosHoy > 0 ? Math.round((turnosConfirmados / turnosHoy) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">De la agenda</div>
          </div>
        </div>

        {/* Acciones Principales - Tareas frecuentes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/mesa-entrada/turnos" className="group">
            <div className="p-5 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Agendar Turno</h3>
              </div>
              <p className="text-sm text-gray-600">Crear nueva cita médica</p>
            </div>
          </Link>

          <Link href="/mesa-entrada/lista-turnos" className="group">
            <div className="p-5 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Ver Turnos de Hoy</h3>
              </div>
              <p className="text-sm text-gray-600">Lista de citas programadas</p>
            </div>
          </Link>

          <Link href="/mesa-entrada/pacientes" className="group">
            <div className="p-5 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Buscar Paciente</h3>
              </div>
              <p className="text-sm text-gray-600">Consultar o registrar datos</p>
            </div>
          </Link>
        </div>

        {/* Otras Gestiones */}
        <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Otras Secciones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/mesa-entrada/pagos" className="group p-4 rounded-lg border border-gray-100 bg-white hover:bg-amber-50 hover:border-amber-200 transition-all text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-amber-700">Pagos</div>
            </Link>
            
            <Link href="/mesa-entrada/reportes" className="group p-4 rounded-lg border border-gray-100 bg-white hover:bg-purple-50 hover:border-purple-200 transition-all text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Reportes</div>
            </Link>

            <Link href="/mesa-entrada/configuracion" className="group p-4 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 transition-all text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="text-sm font-medium text-gray-700">Configuración</div>
            </Link>

            <Link href="/mesa-entrada/perfil" className="group p-4 rounded-lg border border-gray-100 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all text-center">
              <div className="text-3xl mb-2">👤</div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Mi Perfil</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
