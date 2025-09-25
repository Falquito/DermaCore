'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { HorarioDisponible } from '@/types/appointment'

interface CalendarioDisponibilidadProps {
  profesionalId: string
  onHorarioSeleccionado: (fecha: Date, hora: string, profesionalId: string) => void
  horarioSeleccionado?: { fecha: Date; hora: string } | null
}

interface Profesional {
  id: string
  name: string
  email: string
}

export function CalendarioDisponibilidad({ 
  profesionalId, 
  onHorarioSeleccionado, 
  horarioSeleccionado 
}: CalendarioDisponibilidadProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>()
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioDisponible[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [cargandoHorarios, setCargandoHorarios] = useState(false)
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<string>(profesionalId)

  // Cargar profesionales
  useEffect(() => {
    const cargarProfesionales = async () => {
      try {
        const response = await fetch('/api/turnos/profesionales')
        if (response.ok) {
          const data = await response.json()
          setProfesionales(data.profesionales || [])
        }
      } catch (error) {
        console.error('Error al cargar profesionales:', error)
      }
    }

    cargarProfesionales()
  }, [])

  // Cargar horarios cuando cambia el profesional o la fecha
  useEffect(() => {
    const cargarHorarios = async () => {
      if (!profesionalSeleccionado || !fechaSeleccionada) {
        setHorariosDisponibles([])
        return
      }

      setCargandoHorarios(true)
      try {
        const fechaStr = fechaSeleccionada.toISOString().split('T')[0]
        const response = await fetch(
          `/api/turnos/disponibilidad?profesionalId=${profesionalSeleccionado}&fecha=${fechaStr}`
        )
        
        if (response.ok) {
          const data = await response.json()
          setHorariosDisponibles(data.horarios || [])
        }
      } catch (error) {
        console.error('Error al cargar horarios:', error)
        setHorariosDisponibles([])
      } finally {
        setCargandoHorarios(false)
      }
    }

    cargarHorarios()
  }, [profesionalSeleccionado, fechaSeleccionada])

  const handleProfesionalChange = (profesionalId: string) => {
    setProfesionalSeleccionado(profesionalId)
    // Limpiar horario seleccionado cuando se cambia de profesional
    // Esto se podría mejorar para comunicar al padre que se limpie
  }

  const profesionalNombre = profesionales.find(p => p.id === profesionalSeleccionado)?.name || 'Profesional'

  const handleHorarioClick = (horario: HorarioDisponible) => {
    if (!horario.disponible) return
    
    const fecha = new Date(horario.fecha)
    onHorarioSeleccionado(fecha, horario.hora, profesionalSeleccionado)
  }

  const horariosDisponiblesCount = horariosDisponibles.filter(h => h.disponible).length
  const horariosOcupadosCount = horariosDisponibles.filter(h => !h.disponible).length

  return (
    <div className="space-y-6">
      {/* Selector de profesional y fecha */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Profesional</label>
          <Select value={profesionalSeleccionado} onValueChange={handleProfesionalChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar profesional">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {profesionalNombre}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {profesionales.map((profesional) => (
                <SelectItem key={profesional.id} value={profesional.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {profesional.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Fecha</label>
          <DatePicker
            date={fechaSeleccionada}
            onDateChange={setFechaSeleccionada}
            placeholder="Seleccionar fecha"
          />
        </div>
      </div>

      {/* Información del horario seleccionado */}
      {horarioSeleccionado && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {horarioSeleccionado.fecha.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{horarioSeleccionado.hora}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <User className="h-4 w-4" />
                <span className="font-medium">{profesionalNombre}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grilla de horarios */}
      {fechaSeleccionada && profesionalSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Horarios Disponibles
            </CardTitle>
            <CardDescription>
              {fechaSeleccionada.toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} - {profesionalNombre}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cargandoHorarios ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Cargando horarios...</p>
              </div>
            ) : horariosDisponibles.length > 0 ? (
              <div className="space-y-4">
                {/* Resumen */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{horariosDisponiblesCount} disponibles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>{horariosOcupadosCount} ocupados</span>
                  </div>
                </div>

                {/* Grilla de horarios */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                  {horariosDisponibles.map((horario, index) => {
                    const esSeleccionado = horarioSeleccionado && 
                      new Date(horario.fecha).getTime() === horarioSeleccionado.fecha.getTime() &&
                      horario.hora === horarioSeleccionado.hora

                    return (
                      <Button
                        key={index}
                        variant={esSeleccionado ? "default" : horario.disponible ? "outline" : "secondary"}
                        className={`h-auto py-4 px-3 text-sm ${
                          !horario.disponible 
                            ? 'opacity-50 cursor-not-allowed bg-red-50 border-red-200 text-red-700 hover:bg-red-50' 
                            : esSeleccionado
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'hover:bg-green-50 hover:border-green-300'
                        }`}
                        onClick={() => handleHorarioClick(horario)}
                        disabled={!horario.disponible}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{horario.hora}</span>
                          <span className="text-xs opacity-75">
                            {horario.disponible ? 'Libre' : 'Ocupado'}
                          </span>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  Sin horarios configurados
                </h3>
                <p className="text-sm text-gray-600">
                  No hay horarios disponibles para esta fecha y profesional
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensaje inicial */}
      {(!fechaSeleccionada || !profesionalSeleccionado) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Seleccione fecha y profesional
            </h3>
            <p className="text-gray-600 mb-6">
              Para ver los horarios disponibles, primero seleccione un profesional y una fecha
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span>• Horario de atención: 8:00 a 18:00</span>
              <span>• Turnos cada 30 minutos</span>
              <span>• Solo días laborables</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}