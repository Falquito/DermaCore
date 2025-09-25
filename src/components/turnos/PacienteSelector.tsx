'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, User, Calendar, Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PacienteBusqueda } from '@/types/appointment'
import { PatientSubmitData } from '@/types/patient'
import FormularioAltaPaciente from '@/components/FormularioAltaPaciente'

interface PacienteSelectorProps {
  onPacienteSeleccionado: (paciente: PacienteBusqueda) => void
  onPacienteNuevo: (pacienteData: PatientSubmitData) => void
  pacienteSeleccionado?: PacienteBusqueda | null
}

export function PacienteSelector({ 
  onPacienteSeleccionado, 
  onPacienteNuevo, 
  pacienteSeleccionado 
}: PacienteSelectorProps) {
  const [busqueda, setBusqueda] = useState('')
  const [pacientes, setPacientes] = useState<PacienteBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarDialogo, setMostrarDialogo] = useState(false)

  useEffect(() => {
    const buscarPacientes = async () => {
      if (busqueda.trim().length < 2) {
        setPacientes([])
        return
      }

      setBuscando(true)
      try {
        const response = await fetch(`/api/turnos/pacientes/buscar?q=${encodeURIComponent(busqueda)}`)
        if (response.ok) {
          const data = await response.json()
          setPacientes(data.pacientes || [])
        }
      } catch (error) {
        console.error('Error al buscar pacientes:', error)
        setPacientes([])
      } finally {
        setBuscando(false)
      }
    }

    const timeoutId = setTimeout(buscarPacientes, 300)
    return () => clearTimeout(timeoutId)
  }, [busqueda])

  const handlePacienteCreado = async (pacienteData: PatientSubmitData) => {
    try {
      // Simular respuesta exitosa del servidor
      onPacienteNuevo(pacienteData)
      setMostrarDialogo(false)
    } catch (error) {
      console.error('Error al crear paciente:', error)
    }
  }

  const calcularEdad = (fechaNacimiento: Date) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar paciente por nombre, apellido o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={mostrarDialogo} onOpenChange={setMostrarDialogo}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shrink-0 whitespace-nowrap">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo Paciente</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Paciente</DialogTitle>
              <DialogDescription>
                Complete los datos del paciente para registrarlo y asignar el turno
              </DialogDescription>
            </DialogHeader>
            <FormularioAltaPaciente
              onSubmit={handlePacienteCreado}
              onCancel={() => setMostrarDialogo(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Paciente seleccionado */}
      {pacienteSeleccionado && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-green-900 truncate">
                  {pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombre}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-green-700 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    DNI: {pacienteSeleccionado.dni}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {calcularEdad(pacienteSeleccionado.fechaNacimiento)} años
                  </span>
                  {(pacienteSeleccionado.telefono || pacienteSeleccionado.celular) && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {pacienteSeleccionado.celular || pacienteSeleccionado.telefono}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPacienteSeleccionado(null!)}
                className="shrink-0 w-full sm:w-auto"
              >
                Cambiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados de búsqueda */}
      {!pacienteSeleccionado && busqueda.trim().length >= 2 && (
        <div className="space-y-2">
          {buscando ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Buscando pacientes...</p>
              </CardContent>
            </Card>
          ) : pacientes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} encontrado{pacientes.length !== 1 ? 's' : ''}
              </p>
              {pacientes.map((paciente) => (
                <Card 
                  key={paciente.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onPacienteSeleccionado(paciente)}
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {paciente.apellido}, {paciente.nombre}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            DNI: {paciente.dni}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {calcularEdad(paciente.fechaNacimiento)} años
                          </span>
                          {(paciente.telefono || paciente.celular) && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {paciente.celular || paciente.telefono}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 w-full sm:w-auto">
                        Seleccionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  No se encontraron pacientes
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  No hay pacientes registrados que coincidan con &quot;{busqueda}&quot;
                </p>
                <Dialog open={mostrarDialogo} onOpenChange={setMostrarDialogo}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar nuevo paciente
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mensaje inicial */}
      {!pacienteSeleccionado && busqueda.trim().length < 2 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Buscar o registrar paciente
            </h3>
            <p className="text-sm text-gray-600">
              Ingrese al menos 2 caracteres para buscar pacientes existentes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}