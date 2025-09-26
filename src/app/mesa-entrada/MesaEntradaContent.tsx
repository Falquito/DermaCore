'use client'

import { useState } from 'react'
import { Patient } from '@prisma/client'
import FormularioAltaPaciente from '@/components/FormularioAltaPaciente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { PatientSubmitData } from '@/types/patient'

interface PatientWithCreator extends Patient {
  creator: {
    name: string | null
    email: string
  }
}

interface MesaEntradaContentProps {
  initialPatients: PatientWithCreator[]
}

interface PatientDetailsModalProps {
  patient: PatientWithCreator
  isOpen: boolean
  onClose: () => void
}

function PatientDetailsModal({ patient, isOpen, onClose }: PatientDetailsModalProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR')
  }

  const calculateAge = (birthDate: Date) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'masculino':
      case 'hombre':
      case 'm':
        return '♂️'
      case 'femenino':
      case 'mujer':
      case 'f':
        return '♀️'
      default:
        return '👤'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-[1600px] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header mejorado */}
        <DialogHeader className="border-b pb-6 mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {patient.nombre.charAt(0)}{patient.apellido.charAt(0)}
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold text-gray-900 mb-1">
                {patient.nombre} {patient.apellido}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={patient.activo ? "default" : "destructive"}
                  className={`${patient.activo ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'} font-medium`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${patient.activo ? 'bg-green-600' : 'bg-red-600'}`}></div>
                  {patient.activo ? "Paciente Activo" : "Paciente Inactivo"}
                </Badge>
                <span className="text-gray-500 text-sm">DNI: {patient.dni}</span>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 p-2">
            {/* Información Personal */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 min-h-[400px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                  <span className="text-2xl flex-shrink-0">{getGenderIcon(patient.genero)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Género</p>
                    <p className="text-gray-900 font-medium text-lg leading-relaxed">{patient.genero}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                  <span className="text-2xl flex-shrink-0">🎂</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de Nacimiento</p>
                    <p className="text-gray-900 font-medium text-lg leading-relaxed">{formatDate(patient.fechaNacimiento)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                  <span className="text-2xl flex-shrink-0">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Edad</p>
                    <p className="text-gray-900 font-medium text-xl leading-relaxed">{calculateAge(patient.fechaNacimiento)} años</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-100 min-h-[400px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contacto</h3>
              </div>
              <div className="space-y-5">
                {patient.telefono && (
                  <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                    <span className="text-2xl flex-shrink-0">📞</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</p>
                      <p className="text-gray-900 font-medium text-lg leading-relaxed">{patient.telefono}</p>
                    </div>
                  </div>
                )}
                {patient.celular && (
                  <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                    <span className="text-2xl flex-shrink-0">📱</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Celular</p>
                      <p className="text-gray-900 font-medium text-lg leading-relaxed">{patient.celular}</p>
                    </div>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg">
                    <span className="text-2xl flex-shrink-0">✉️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-gray-900 font-medium text-lg overflow-hidden text-ellipsis whitespace-nowrap leading-relaxed" title={patient.email}>{patient.email}</p>
                    </div>
                  </div>
                )}
                {!patient.telefono && !patient.celular && !patient.email && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="italic text-lg">Sin información de contacto</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-8 border border-purple-100 min-h-[400px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Dirección</h3>
              </div>
              <div className="space-y-5">
                {patient.direccion && (
                  <div className="p-4 bg-white/60 rounded-lg overflow-hidden">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Dirección</p>
                    <p className="text-gray-900 font-medium text-lg leading-relaxed">{patient.direccion}</p>
                  </div>
                )}
                {(patient.ciudad || patient.provincia) && (
                  <div className="p-4 bg-white/60 rounded-lg overflow-hidden">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Localidad</p>
                    <p className="text-gray-900 font-medium text-lg leading-relaxed">
                      {[patient.ciudad, patient.provincia].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {patient.codigoPostal && (
                  <div className="p-4 bg-white/60 rounded-lg overflow-hidden">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Código Postal</p>
                    <p className="text-gray-900 font-medium text-lg">{patient.codigoPostal}</p>
                  </div>
                )}
                {!patient.direccion && !patient.ciudad && !patient.provincia && !patient.codigoPostal && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="italic text-lg">Sin dirección registrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          {(patient.contactoEmergenciaNombre || patient.contactoEmergenciaTelefono || patient.contactoEmergenciaRelacion) && (
            <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 border border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contacto de Emergencia</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {patient.contactoEmergenciaNombre && (
                  <div className="p-5 bg-white/60 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Nombre</p>
                    <p className="text-gray-900 font-medium text-lg">{patient.contactoEmergenciaNombre}</p>
                  </div>
                )}
                {patient.contactoEmergenciaTelefono && (
                  <div className="p-5 bg-white/60 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Teléfono</p>
                    <p className="text-gray-900 font-medium text-lg">{patient.contactoEmergenciaTelefono}</p>
                  </div>
                )}
                {patient.contactoEmergenciaRelacion && (
                  <div className="p-5 bg-white/60 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Relación</p>
                    <p className="text-gray-900 font-medium text-lg">{patient.contactoEmergenciaRelacion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del Sistema */}
          <div className="mt-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Información del Sistema</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 bg-white/60 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Creado el</p>
                <p className="text-gray-900 font-medium text-lg">{formatDateShort(patient.createdAt)}</p>
              </div>
              <div className="p-5 bg-white/60 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Creado por</p>
                <p className="text-gray-900 font-medium text-lg truncate">{patient.creator.name || patient.creator.email}</p>
              </div>
              <div className="p-5 bg-white/60 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Actualizado</p>
                <p className="text-gray-900 font-medium text-lg">{formatDateShort(patient.updatedAt)}</p>
              </div>
              <div className="p-5 bg-white/60 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Estado</p>
                <Badge 
                  variant={patient.activo ? "default" : "destructive"}
                  className={`${patient.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} font-medium text-sm`}
                >
                  {patient.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="border-t pt-6 mt-6 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-500">
            Paciente registrado hace {Math.ceil((new Date().getTime() - new Date(patient.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="px-6">
              Cerrar
            </Button>
            <Button 
              variant={patient.activo ? "destructive" : "default"}
              className={`px-6 ${patient.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              {patient.activo ? "Desactivar Paciente" : "Activar Paciente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MesaEntradaContent({ 
  initialPatients 
}: MesaEntradaContentProps) {
  const [showFormulario, setShowFormulario] = useState(false)
  const [patients, setPatients] = useState(initialPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientWithCreator | null>(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)

  const handleCreatePatient = async (patientData: PatientSubmitData) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el paciente')
      }
      
      if (result.success) {
        // Agregar el nuevo paciente a la lista
        setPatients(prev => [result.patient, ...prev])
        setShowFormulario(false)
        
        // Mostrar mensaje de éxito
        alert(result.message)
      }
    } catch (error) {
      console.error('Error:', error)
      throw error // Re-throw para que FormularioAltaPaciente maneje el error
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    return (
      patient.nombre.toLowerCase().includes(term) ||
      patient.apellido.toLowerCase().includes(term) ||
      patient.dni.includes(term)
    )
  })

  const handlePatientSelect = (patient: PatientWithCreator) => {
    setSelectedPatient(patient)
    setShowPatientDetails(true)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Listado y Visualización de Pacientes</h1>
        <p className="text-gray-600">Consulta y gestiona la información completa de todos los pacientes registrados</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-3 ml-4">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="text-gray-600 hover:text-gray-900 border-gray-300"
            >
              🔄 Actualizar
            </Button>
            <Button
              onClick={() => setShowFormulario(true)}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                '+ Nuevo Paciente'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Pacientes en Cards */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-lg border text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'No hay pacientes que coincidan con tu búsqueda.' 
                : 'Comienza registrando el primer paciente del sistema.'
              }
            </p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {patient.nombre.charAt(0)}{patient.apellido.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {patient.nombre} {patient.apellido}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={patient.activo ? "default" : "destructive"}
                               className={`${patient.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} font-medium`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${patient.activo ? 'bg-green-600' : 'bg-red-600'}`}></div>
                          {patient.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        <span className="text-gray-500 text-sm">DNI: {patient.dni}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg overflow-hidden">
                      <span className="text-blue-600 flex-shrink-0">📱</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium">Contacto</p>
                        <p className="text-sm font-medium truncate">{patient.telefono || patient.celular || 'No registrado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg overflow-hidden">
                      <span className="text-green-600 flex-shrink-0">✉️</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm font-medium truncate">{patient.email || 'No registrado'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg overflow-hidden">
                      <span className="text-purple-600 flex-shrink-0">📅</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium">Registrado</p>
                        <p className="text-sm font-medium">{formatDate(patient.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Creado por:</span> {patient.creator.name || patient.creator.email} • 
                    <span className="font-medium"> Actualizado:</span> {formatDate(patient.updatedAt)}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:ml-6 min-w-[200px]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePatientSelect(patient)}
                    className="flex-1 text-gray-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver detalles
                  </Button>
                  <Button
                    variant={patient.activo ? "destructive" : "default"}
                    size="sm"
                    className={`flex-1 ${patient.activo 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {patient.activo ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        Desactivar
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Activar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumen de estadísticas */}
      {filteredPatients.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Total de pacientes:</span> {patients.length}
            {searchTerm && <span> | <span className="font-medium">Mostrando:</span> {filteredPatients.length}</span>}
            <span> | <span className="font-medium text-green-600">Activos:</span> {patients.filter(p => p.activo).length}</span>
            <span> | <span className="font-medium text-red-600">Inactivos:</span> {patients.filter(p => !p.activo).length}</span>
          </p>
        </div>
      )}

      {/* Modal del formulario */}
      {showFormulario && (
        <FormularioAltaPaciente
          onSubmit={handleCreatePatient}
          onCancel={() => setShowFormulario(false)}
          isLoading={isLoading}
        />
      )}

      {/* Modal de detalles del paciente */}
      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          isOpen={showPatientDetails}
          onClose={() => {
            setShowPatientDetails(false)
            setSelectedPatient(null)
          }}
        />
      )}
    </div>
  )
}
