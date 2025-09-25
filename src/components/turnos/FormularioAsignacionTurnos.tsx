'use client'

import { useState, useEffect } from 'react'
import { Save, AlertCircle, CreditCard, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PacienteSelector } from './PacienteSelector'
import { CalendarioDisponibilidad } from './CalendarioDisponibilidad'
import { PacienteBusqueda, AppointmentSubmitData, TurnoCompleto } from '@/types/appointment'
import { PatientSubmitData } from '@/types/patient'
import { TipoConsulta } from '@prisma/client'

interface ObraSocial {
  id: string
  nombre: string
}

interface FormularioAsignacionTurnosProps {
  onTurnoCreado?: (turno: TurnoCompleto) => void
  onCancel?: () => void
}

export function FormularioAsignacionTurnos({ onTurnoCreado, onCancel }: FormularioAsignacionTurnosProps) {
  // Estado para controlar los pasos del formulario
  const [pasoActual, setPasoActual] = useState(1)
  
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteBusqueda | null>(null)
  const [pacienteNuevo, setPacienteNuevo] = useState<PatientSubmitData | null>(null)
  const [profesionalId, setProfesionalId] = useState('')
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<{ fecha: Date; hora: string } | null>(null)
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    motivo: '',
    observaciones: '',
    tipoConsulta: TipoConsulta.OBRA_SOCIAL as TipoConsulta,
    obraSocialId: '',
    numeroAfiliado: '',
    copago: 0,
    copagoString: '', // String para manejar el input de precio
    autorizacion: ''
  })

  // Cargar obras sociales
  useEffect(() => {
    const cargarObrasSociales = async () => {
      try {
        const response = await fetch('/api/obras-sociales')
        if (response.ok) {
          const data = await response.json()
          setObrasSociales(data.obrasSociales || [])
        }
      } catch (error) {
        console.error('Error al cargar obras sociales:', error)
      }
    }

    cargarObrasSociales()
  }, [])

  // Funciones de validación por paso
  const validarPaso1y2 = () => {
    if (!pacienteSeleccionado && !pacienteNuevo) {
      setError('Debe seleccionar un paciente o registrar uno nuevo')
      return false
    }
    
    if (!profesionalId) {
      setError('Debe seleccionar un profesional')
      return false
    }
    
    if (!horarioSeleccionado) {
      setError('Debe seleccionar una fecha y horario')
      return false
    }
    
    return true
  }

  const validarPaso3 = () => {
    if (formData.tipoConsulta === TipoConsulta.OBRA_SOCIAL && !formData.obraSocialId) {
      setError('Debe seleccionar una obra social')
      return false
    }

    if (formData.tipoConsulta === TipoConsulta.PARTICULAR && (!formData.copagoString || parseFloat(formData.copagoString) <= 0)) {
      setError('Debe especificar el precio de la consulta')
      return false
    }

    return true
  }

  const avanzarPaso = () => {
    if (pasoActual === 1 && validarPaso1y2()) {
      setError('')
      setPasoActual(2)
    }
  }

  const retrocederPaso = () => {
    if (pasoActual === 2) {
      setError('')
      setPasoActual(1)
    }
  }

  const handlePacienteSeleccionado = (paciente: PacienteBusqueda) => {
    setPacienteSeleccionado(paciente)
    setPacienteNuevo(null)
  }

  const handlePacienteNuevo = (pacienteData: PatientSubmitData) => {
    setPacienteNuevo(pacienteData)
    setPacienteSeleccionado(null)
  }

  const handleSubmit = async () => {
    // Validar paso 3 antes de enviar
    if (!validarPaso3()) {
      return
    }

    if (!horarioSeleccionado || (!pacienteSeleccionado && !pacienteNuevo)) {
      setError('Debe seleccionar un paciente y un horario antes de continuar')
      return
    }

    setEnviando(true)
    setError('')

    try {
      // Validar que tenemos horario seleccionado
      if (!horarioSeleccionado || !horarioSeleccionado.hora) {
        setError('Error: No se ha seleccionado un horario válido')
        return
      }

      console.log('Datos del horario seleccionado:', horarioSeleccionado)

      // Construir la fecha completa con la hora seleccionada
      const [horaStr, minutosStr] = horarioSeleccionado.hora.split(':')
      const hora = parseInt(horaStr, 10)
      const minutos = parseInt(minutosStr, 10)
      
      // Validar que la hora y minutos sean válidos
      if (isNaN(hora) || isNaN(minutos) || hora < 0 || hora > 23 || minutos < 0 || minutos > 59) {
        setError(`Error: Formato de hora inválido: ${horarioSeleccionado.hora}`)
        return
      }

      const fechaCompleta = new Date(horarioSeleccionado.fecha)
      
      // Validar que la fecha base sea válida
      if (isNaN(fechaCompleta.getTime())) {
        setError(`Error: Fecha inválida: ${horarioSeleccionado.fecha}`)
        return
      }
      
      fechaCompleta.setHours(hora, minutos, 0, 0)
      
      // Validar la fecha final
      if (isNaN(fechaCompleta.getTime())) {
        setError(`Error: Fecha/hora final inválida después de setHours(${hora}, ${minutos})`)
        return
      }

      console.log('Fecha completa construida:', fechaCompleta.toISOString())

      const turnoData: AppointmentSubmitData = {
        pacienteId: pacienteSeleccionado?.id,
        pacienteNuevo: pacienteNuevo ? {
          nombre: pacienteNuevo.nombre,
          apellido: pacienteNuevo.apellido,
          dni: pacienteNuevo.dni,
          fechaNacimiento: pacienteNuevo.fechaNacimiento || '',
          genero: pacienteNuevo.genero,
          telefono: pacienteNuevo.telefono,
          celular: pacienteNuevo.celular,
          email: pacienteNuevo.email
        } : undefined,
        profesionalId,
        fecha: fechaCompleta.toISOString(),
        duracion: 30, // Fijo en 30 minutos
        motivo: formData.motivo || undefined,
        observaciones: formData.observaciones || undefined,
        tipoConsulta: formData.tipoConsulta,
        obraSocialId: formData.obraSocialId || undefined,
        numeroAfiliado: formData.numeroAfiliado || undefined,
        copago: formData.tipoConsulta === TipoConsulta.PARTICULAR ? parseFloat(formData.copagoString) || 0 : undefined,
        autorizacion: formData.autorizacion || undefined
      }

      console.log('Datos del turno a enviar:', turnoData)

      const response = await fetch('/api/turnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(turnoData)
      })

      const data = await response.json()
      console.log('Respuesta del API:', { status: response.status, data })

      if (response.ok) {
        if (onTurnoCreado) {
          onTurnoCreado(data.turno)
        }
        // Reset form
        setPacienteSeleccionado(null)
        setPacienteNuevo(null)
        setHorarioSeleccionado(null)
        setProfesionalId('')
        setFormData({
          motivo: '',
          observaciones: '',
          tipoConsulta: TipoConsulta.OBRA_SOCIAL,
          obraSocialId: '',
          numeroAfiliado: '',
          copago: 0,
          copagoString: '',
          autorizacion: ''
        })
      } else {
        setError(data.error || 'Error al crear el turno')
      }
    } catch (error) {
      console.error('Error al crear turno:', error)
      setError('Error de conexión. Inténtelo nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        <div className={`flex items-center space-x-2 ${pasoActual === 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            pasoActual === 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            1
          </div>
          <span>Paciente y Horario</span>
        </div>
        <div className={`w-16 h-0.5 ${pasoActual === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`flex items-center space-x-2 ${pasoActual === 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            pasoActual === 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            2
          </div>
          <span>Detalles del Turno</span>
        </div>
      </div>

      {/* Paso 1: Selección de Paciente y Horario */}
      {pasoActual === 1 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Selección de Paciente */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>1. Seleccionar Paciente</CardTitle>
                <CardDescription>
                  Busque un paciente existente o registre uno nuevo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PacienteSelector
                  onPacienteSeleccionado={handlePacienteSeleccionado}
                  onPacienteNuevo={handlePacienteNuevo}
                  pacienteSeleccionado={pacienteSeleccionado}
                />
              </CardContent>
            </Card>

            {/* Selección de Horario y Profesional */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>2. Seleccionar Horario</CardTitle>
                <CardDescription>
                  Elija fecha, hora y profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarioDisponibilidad
                  profesionalId={profesionalId}
                  onHorarioSeleccionado={(fecha, hora, profesionalSeleccionado) => {
                    setHorarioSeleccionado({ fecha, hora })
                    setProfesionalId(profesionalSeleccionado)
                  }}
                  horarioSeleccionado={horarioSeleccionado}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Paso 2: Detalles del Turno */}
      {pasoActual === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Detalles del Turno</CardTitle>
            <CardDescription>
              Complete la información adicional del turno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Motivo */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="motivo">Motivo de la consulta</Label>
                <Input
                  id="motivo"
                  placeholder="Ej: Control médico, dolor abdominal..."
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                />
              </div>

              {/* Tipo de consulta */}
              <div className="space-y-2 md:col-span-2">
                <Label>Tipo de consulta</Label>
                <Select 
                  value={formData.tipoConsulta} 
                  onValueChange={(value: TipoConsulta) => setFormData({ 
                    ...formData, 
                    tipoConsulta: value,
                    // Limpiar precio al cambiar tipo de consulta
                    copagoString: value === TipoConsulta.PARTICULAR ? formData.copagoString : '',
                    copago: value === TipoConsulta.PARTICULAR ? formData.copago : 0
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TipoConsulta.OBRA_SOCIAL}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Obra Social
                      </div>
                    </SelectItem>
                    <SelectItem value={TipoConsulta.PARTICULAR}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Particular
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos específicos de Obra Social */}
              {formData.tipoConsulta === TipoConsulta.OBRA_SOCIAL && (
                <>
                  <div className="space-y-2">
                    <Label>Obra Social</Label>
                    <Select 
                      value={formData.obraSocialId} 
                      onValueChange={(value) => setFormData({ ...formData, obraSocialId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar obra social" />
                      </SelectTrigger>
                      <SelectContent>
                        {obrasSociales.map((obra) => (
                          <SelectItem key={obra.id} value={obra.id}>
                            {obra.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroAfiliado">Número de afiliado</Label>
                    <Input
                      id="numeroAfiliado"
                      placeholder="Número de afiliado"
                      value={formData.numeroAfiliado}
                      onChange={(e) => setFormData({ ...formData, numeroAfiliado: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="autorizacion">Número de autorización (opcional)</Label>
                    <Input
                      id="autorizacion"
                      placeholder="Número de autorización"
                      value={formData.autorizacion}
                      onChange={(e) => setFormData({ ...formData, autorizacion: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Campos específicos de Particular */}
              {formData.tipoConsulta === TipoConsulta.PARTICULAR && (
                <div className="space-y-2">
                  <Label htmlFor="copago">Precio de la consulta</Label>
                  <Input
                    id="copago"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ingrese el precio (ej: 15000)"
                    value={formData.copagoString}
                    onChange={(e) => {
                      const value = e.target.value
                      // Solo permitir números, puntos y comas
                      if (/^[0-9]*[.,]?[0-9]*$/.test(value) || value === '') {
                        setFormData({ 
                          ...formData, 
                          copagoString: value,
                          copago: parseFloat(value.replace(',', '.')) || 0
                        })
                      }
                    }}
                    onBlur={(e) => {
                      // Formatear cuando el usuario sale del campo
                      const value = e.target.value
                      if (value && !isNaN(parseFloat(value.replace(',', '.')))) {
                        const numericValue = parseFloat(value.replace(',', '.'))
                        setFormData({
                          ...formData,
                          copagoString: numericValue.toFixed(2),
                          copago: numericValue
                        })
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Ingrese el monto sin símbolos (ej: 15000 o 15000.50)
                  </p>
                </div>
              )}

              {/* Observaciones */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                <Input
                  id="observaciones"
                  placeholder="Observaciones adicionales..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
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

        <div className="flex space-x-2">
          {/* Botón Anterior - Solo en paso 2 */}
          {pasoActual === 2 && (
            <Button variant="outline" onClick={retrocederPaso} disabled={enviando}>
              Anterior
            </Button>
          )}

          {/* Botón Siguiente - Solo en paso 1 */}
          {pasoActual === 1 && (
            <Button onClick={avanzarPaso} disabled={enviando}>
              Siguiente
            </Button>
          )}

          {/* Botón Crear Turno - Solo en paso 2 */}
          {pasoActual === 2 && (
            <Button onClick={handleSubmit} disabled={enviando}>
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando turno...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Turno
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}