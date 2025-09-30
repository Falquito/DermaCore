'use client'

import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Activity,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

export default function GerenciaContent() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
        <p className="text-gray-600 mt-1">
          Panel de control para la gestión integral de la clínica
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">87</div>
            <p className="text-xs text-muted-foreground">
              +5% desde ayer
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">$45,231</div>
            <p className="text-xs text-muted-foreground">
              +8% desde el mes pasado
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">24</div>
            <p className="text-xs text-muted-foreground">
              +3 nuevos esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription>
              Operaciones frecuentes de gerencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700" variant="default">
              <Users className="mr-2 h-4 w-4" />
              Gestionar Usuarios
            </Button>
            <Button className="w-full justify-start border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Ver Reportes
            </Button>
            <Button className="w-full justify-start border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Análisis Financiero
            </Button>
            <Button className="w-full justify-start border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              Auditoría del Sistema
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Activity className="h-5 w-5 text-emerald-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas acciones en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo usuario registrado</p>
                  <p className="text-xs text-gray-500">Dr. María González - hace 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Reporte mensual generado</p>
                  <p className="text-xs text-gray-500">Sistema automático - hace 4 horas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Configuración actualizada</p>
                  <p className="text-xs text-gray-500">Admin - ayer</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas y Notificaciones
          </CardTitle>
          <CardDescription>
            Elementos que requieren atención
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Licencias por vencer</p>
                <p className="text-xs text-gray-600">3 licencias de software vencen en 30 días</p>
              </div>
              <Button size="sm" variant="outline" className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
                Ver detalles
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Backup programado</p>
                <p className="text-xs text-gray-600">Próximo backup automático: mañana 3:00 AM</p>
              </div>
              <Button size="sm" variant="outline" className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
                Configurar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}