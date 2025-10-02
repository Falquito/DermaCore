'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Save } from 'lucide-react'
import { CalendarioDisponibilidad } from './CalendarioDisponibilidad'
import { TurnoCompleto } from '@/types/appointment'

interface FormularioReprogramarTurnoProps {
  turno: TurnoCompleto
  onReprogramar: (nuevo: { fecha: Date; hora: string; profesionalId: string }) => void
  onCancel?: () => void
}

export function FormularioReprogramarTurno({ turno, onReprogramar, onCancel }: FormularioReprogramarTurnoProps) {
  const [nuevoHorario, setNuevoHorario] = useState<{ fecha: Date; hora: string } | null>(null)
  const [nuevoProfesionalId, setNuevoProfesionalId] = useState(turno.profesional?.id || '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const handleHorarioSeleccionado = (fecha: Date, hora: string, profesionalId: string) => {
    setNuevoHorario({ fecha, hora })
    setNuevoProfesionalId(profesionalId)
  }

  const handleSubmit = async () => {
    if (!nuevoHorario || !nuevoProfesionalId) {
      setError('Debe seleccionar un profesional y horario')
      return
    }
    // Validar que la nueva fecha no sea anterior a la fecha original
    if (nuevoHorario.fecha < turno.fecha) {
      setError('No se puede reprogramar el turno a una fecha anterior al turno original')
      return
    }
    setEnviando(true)
    setError('')
    try {
      onReprogramar({
        fecha: nuevoHorario.fecha,
        hora: nuevoHorario.hora,
        profesionalId: nuevoProfesionalId
      })
    } catch {
      setError('Error al reprogramar el turno')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen del turno actual */}
      <Card>
        <CardHeader>
          <CardTitle>Turno a reprogramar</CardTitle>
          <CardDescription>Datos actuales del turno</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="font-medium text-gray-700">Paciente:</span>
              <span>{turno.paciente?.nombre} {turno.paciente?.apellido}</span>
            </div>
            <div className="space-y-2">
              <span className="font-medium text-gray-700">Profesional:</span>
              <span>{turno.profesional?.name}</span>
            </div>
            <div className="space-y-2">
              <span className="font-medium text-gray-700">Fecha y hora:</span>
              <span>{new Date(turno.fecha).toLocaleString('es-AR')}</span>
            </div>
            <div className="space-y-2">
              <span className="font-medium text-gray-700">Motivo:</span>
              <span>{turno.motivo || '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selección de nuevo profesional y horario */}
      <Card>
        <CardHeader>
          <CardTitle>Nuevo profesional y horario</CardTitle>
          <CardDescription>Seleccione el profesional y horario para reprogramar</CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarioDisponibilidad
            profesionalId={nuevoProfesionalId}
            onHorarioSeleccionado={handleHorarioSeleccionado}
            horarioSeleccionado={nuevoHorario}
          />
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={enviando}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={enviando}>
          {enviando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Reprogramando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Confirmar reprogramación
            </>
          )}
        </Button>
      </div>
    </div>
  )
}