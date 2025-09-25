'use client'

import { useState } from 'react'
import { Plus, Calendar, Clock, User, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FormularioAsignacionTurnos } from '@/components/turnos/FormularioAsignacionTurnos'
import { TurnoCompleto } from '@/types/appointment'

export default function TurnosPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [turnoRecienCreado, setTurnoRecienCreado] = useState<TurnoCompleto | null>(null)

  const handleTurnoCreado = (turno: TurnoCompleto) => {
    setTurnoRecienCreado(turno)
    setMostrarFormulario(false)
    
    // Mostrar notificación de éxito por 3 segundos
    setTimeout(() => {
      setTurnoRecienCreado(null)
    }, 5000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Gestión de Turnos</h1>
          <p className="text-gray-600">Administra la agenda y citas médicas</p>
        </div>
        
        <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] w-full lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Asignar Nuevo Turno</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4">
              <FormularioAsignacionTurnos
                onTurnoCreado={handleTurnoCreado}
                onCancel={() => setMostrarFormulario(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notificación de turno creado */}
      {turnoRecienCreado && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">
                  ¡Turno creado exitosamente!
                </h3>
                <div className="text-sm text-green-800">
                  <p className="mb-2">
                    <strong>Paciente:</strong> {turnoRecienCreado.paciente.apellido}, {turnoRecienCreado.paciente.nombre}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(turnoRecienCreado.fecha).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(turnoRecienCreado.fecha).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {turnoRecienCreado.profesional.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {turnoRecienCreado.tipoConsulta === 'OBRA_SOCIAL' ? 'Obra Social' : 'Particular'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funcionalidades disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Asignar Turnos
            </CardTitle>
            <CardDescription>
              Crear nuevos turnos para pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Sistema completo de asignación que incluye:
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Búsqueda de pacientes existentes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Registro de pacientes nuevos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Visualización de disponibilidad
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Gestión de obras sociales
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Consultas particulares
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Calendario Inteligente
            </CardTitle>
            <CardDescription>
              Visualización de disponibilidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Características del calendario:
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Grilla de horarios por profesional
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Estados claros (libre/ocupado)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Prevención de doble reserva
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Solo días laborables
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Horario 8:00 a 18:00
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Gestión de Pagos
            </CardTitle>
            <CardDescription>
              Obras sociales y particulares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Opciones de facturación:
            </p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                Integración con obras sociales
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                Número de afiliado
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                Autorizaciones médicas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                Consultas particulares
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                Precio personalizable
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Próximas funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas funcionalidades</CardTitle>
          <CardDescription>
            Mejoras planificadas para el sistema de turnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Lista de turnos del día</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Recordatorios automáticos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Lista de espera</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Comprobantes en PDF</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Cancelación de turnos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Reprogramación</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Estadísticas</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Reportes médicos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}