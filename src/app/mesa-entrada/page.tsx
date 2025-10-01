import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function MesaEntradaPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roles.length === 0) redirect('/error')
  if (!user.roles.includes('MESA_ENTRADA')) redirect('/error')

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Mesa de Entrada</h1>
          <p className="text-gray-600">Panel principal de gestión administrativa</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {/* Gestión de Pacientes */}
          <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pacientes</h3>
              <p className="text-gray-600 text-sm mb-4">Administrar el registro y información de pacientes</p>
              <Link href="/mesa-entrada/pacientes">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Gestionar Pacientes
                </Button>
              </Link>
            </div>
            <div className="text-emerald-600 text-2xl">👥</div>
          </div>
          </Card>

          {/* Turnos */}
          <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Turnos</h3>
              <p className="text-gray-600 text-sm mb-4">Gestionar citas y horarios de atención</p>
              <Link href="/mesa-entrada/turnos">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Gestionar Turnos
                </Button>
              </Link>
            </div>
            <div className="text-blue-600 text-2xl">📅</div>
          </div>
          </Card>

          {/* Pagos */}
          <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pagos</h3>
              <p className="text-gray-600 text-sm mb-4">Administrar facturación y pagos</p>
              <Link href="/mesa-entrada/pagos">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Gestionar Pagos
                </Button>
              </Link>
            </div>
            <div className="text-amber-600 text-2xl">💰</div>
          </div>
          </Card>

          {/* Reportes */}
          <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reportes</h3>
              <p className="text-gray-600 text-sm mb-4">Ver estadísticas y generar reportes</p>
              <Link href="/mesa-entrada/reportes">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Ver Reportes
                </Button>
              </Link>
            </div>
            <div className="text-purple-600 text-2xl">📊</div>
          </div>
          </Card>

          {/* Configuración */}
          <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración</h3>
              <p className="text-gray-600 text-sm mb-4">Ajustar parámetros del sistema</p>
              <Link href="/mesa-entrada/configuracion">
                <Button className="bg-gray-600 hover:bg-gray-700">
                  Configurar
                </Button>
              </Link>
            </div>
            <div className="text-gray-600 text-2xl">⚙️</div>
          </div>
          </Card>
        </div>

        {/* Resumen rápido */}
        <Card className="p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/mesa-entrada/pacientes" className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-1">🆕</div>
              <div className="text-sm text-gray-600">Nuevo Paciente</div>
            </Link>
            <Link href="/mesa-entrada/turnos" className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-sm text-gray-600">Agendar Turno</div>
            </Link>
            <Link href="/mesa-entrada/pagos" className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-1">💳</div>
              <div className="text-sm text-gray-600">Registrar Pago</div>
            </Link>
            <Link href="/mesa-entrada/reportes" className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-sm text-gray-600">Ver Estadísticas</div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
