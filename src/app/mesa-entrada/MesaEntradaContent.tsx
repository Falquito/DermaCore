'use client'

import { useEffect, useMemo, useState } from 'react'
import { Patient } from '@prisma/client'
import FormularioAltaPaciente from '@/components/FormularioAltaPaciente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PatientFormData, PatientSubmitData } from '@/types/patient'
import { CheckCircle, X, XCircle } from 'lucide-react'

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
  onEdit: (patient: PatientWithCreator) => void
  onToggleActive: (patient: PatientWithCreator) => void
  isToggling: boolean
}

function PatientDetailsModal({ patient, isOpen, onClose, onEdit, onToggleActive, isToggling }: PatientDetailsModalProps) {
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
              onClick={() => onEdit(patient)}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Editar
            </Button>
            <Button 
              variant={patient.activo ? "destructive" : "default"}
              onClick={() => onToggleActive(patient)}
              disabled={isToggling}
              className={`px-6 ${patient.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              {isToggling ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </div>
              ) : (
                patient.activo ? "Desactivar Paciente" : "Activar Paciente"
              )}
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
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [togglingIds, setTogglingIds] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientWithCreator | null>(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [patientToEdit, setPatientToEdit] = useState<PatientWithCreator | null>(null)
  const isEditMode = formMode === 'edit'
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  const allowedGeneros = ['Masculino', 'Femenino', 'Otro'] as const

  const normalizeGenero = (value?: string | null) => {
    if (!value) return ''
    const trimmed = value.trim()
    const match = allowedGeneros.find(option => option.toLowerCase() === trimmed.toLowerCase())
    return match ?? ''
  }

  const buildInitialFormData = (patient: PatientWithCreator): PatientFormData => ({
    nombre: patient.nombre,
    apellido: patient.apellido,
    dni: patient.dni,
    fechaNacimiento: new Date(patient.fechaNacimiento),
    genero: normalizeGenero(patient.genero),
    telefono: patient.telefono ?? '',
    celular: patient.celular ?? '',
    email: patient.email ?? '',
    direccion: patient.direccion ?? '',
    ciudad: patient.ciudad ?? '',
    provincia: patient.provincia ?? '',
    codigoPostal: patient.codigoPostal ?? '',
    contactoEmergenciaNombre: patient.contactoEmergenciaNombre ?? '',
    contactoEmergenciaTelefono: patient.contactoEmergenciaTelefono ?? '',
    contactoEmergenciaRelacion: patient.contactoEmergenciaRelacion ?? '',
    activo: patient.activo,
  })

  const buildSubmitDataFromPatient = (
    patient: PatientWithCreator,
    overrides: Partial<PatientSubmitData> = {}
  ): PatientSubmitData => ({
    nombre: overrides.nombre ?? patient.nombre,
    apellido: overrides.apellido ?? patient.apellido,
    dni: overrides.dni ?? patient.dni,
    fechaNacimiento:
      overrides.fechaNacimiento ?? new Date(patient.fechaNacimiento).toISOString(),
    genero: normalizeGenero(overrides.genero ?? patient.genero),
    telefono: overrides.telefono ?? patient.telefono ?? '',
    celular: overrides.celular ?? patient.celular ?? '',
    email: overrides.email ?? patient.email ?? '',
    direccion: overrides.direccion ?? patient.direccion ?? '',
    ciudad: overrides.ciudad ?? patient.ciudad ?? '',
    provincia: overrides.provincia ?? patient.provincia ?? '',
    codigoPostal: overrides.codigoPostal ?? patient.codigoPostal ?? '',
    contactoEmergenciaNombre:
      overrides.contactoEmergenciaNombre ?? patient.contactoEmergenciaNombre ?? '',
    contactoEmergenciaTelefono:
      overrides.contactoEmergenciaTelefono ?? patient.contactoEmergenciaTelefono ?? '',
    contactoEmergenciaRelacion:
      overrides.contactoEmergenciaRelacion ?? patient.contactoEmergenciaRelacion ?? '',
    activo: overrides.activo ?? patient.activo,
  })

  const handleOpenCreateForm = () => {
    setFormMode('create')
    setPatientToEdit(null)
    setShowFormulario(true)
  }

  const handleOpenEditForm = (patient: PatientWithCreator) => {
    setFormMode('edit')
    setPatientToEdit(patient)
    setShowFormulario(true)
    setShowPatientDetails(false)
    setSelectedPatient(patient)
  }

  const handleCloseForm = () => {
    setShowFormulario(false)
    setPatientToEdit(null)
    setFormMode('create')
  }

  const handleSavePatient = async (patientData: PatientSubmitData) => {
    const editing = isEditMode && patientToEdit !== null

    try {
      setFormSubmitting(true)

      const endpoint = editing && patientToEdit
        ? `/api/patients/${patientToEdit.id}`
        : '/api/patients'

      const method = editing ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error al ${editing ? 'actualizar' : 'crear'} el paciente`)
      }

      if (result.success) {
        setPatients(prev => {
          if (editing) {
            return prev.map(patient => patient.id === result.patient.id ? result.patient : patient)
          }
          return [result.patient, ...prev]
        })

        if (editing && selectedPatient?.id === result.patient.id) {
          setSelectedPatient(result.patient)
        }

        if (!editing) {
          setCurrentPage(1)
        }

        handleCloseForm()
        setFeedback({ type: 'success', message: result.message })
      }
    } catch (error) {
      console.error('Error:', error)
      const message = error instanceof Error ? error.message : 'Ocurrió un error al guardar el paciente'
      setFeedback({ type: 'error', message })
      throw error
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleActive = async (patient: PatientWithCreator) => {
    if (togglingIds.includes(patient.id)) return

    try {
      setTogglingIds(prev => (prev.includes(patient.id) ? prev : [...prev, patient.id]))

      const payload = buildSubmitDataFromPatient(patient, { activo: !patient.activo })

      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar el estado del paciente')
      }

      if (result.success) {
        setPatients(prev => prev.map(item => item.id === result.patient.id ? result.patient : item))

        if (selectedPatient?.id === result.patient.id) {
          setSelectedPatient(result.patient)
        }

        if (patientToEdit?.id === result.patient.id) {
          setPatientToEdit(result.patient)
        }

        setFeedback({ type: 'success', message: result.message })
      }
    } catch (error) {
      console.error('Error:', error)
      const message = error instanceof Error
        ? error.message
        : 'Error inesperado al actualizar el estado del paciente'
      setFeedback({ type: 'error', message })
    } finally {
      setTogglingIds(prev => prev.filter(id => id !== patient.id))
    }
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/patients')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo actualizar el listado de pacientes')
      }

      if (Array.isArray(result.patients)) {
        const refreshedPatients = result.patients as PatientWithCreator[]
        setPatients(refreshedPatients)

        if (selectedPatient) {
          const updatedSelected = refreshedPatients.find(item => item.id === selectedPatient.id)
          if (updatedSelected) {
            setSelectedPatient(updatedSelected)
          }
        }

        if (patientToEdit) {
          const updatedEditing = refreshedPatients.find(item => item.id === patientToEdit.id)
          if (updatedEditing) {
            setPatientToEdit(updatedEditing)
          }
        }

        setFeedback({ type: 'success', message: 'Listado de pacientes actualizado' })
      }
    } catch (error) {
      console.error('Error:', error)
      const message = error instanceof Error
        ? error.message
        : 'Error inesperado al refrescar el listado de pacientes'
      setFeedback({ type: 'error', message })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDismissFeedback = () => setFeedback(null)

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients

    const term = searchTerm.toLowerCase()
    return patients.filter(patient =>
      patient.nombre.toLowerCase().includes(term) ||
      patient.apellido.toLowerCase().includes(term) ||
      patient.dni.includes(term)
    )
  }, [patients, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize))

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredPatients.slice(startIndex, startIndex + pageSize)
  }, [filteredPatients, currentPage, pageSize])

  const handlePatientSelect = (patient: PatientWithCreator) => {
    setSelectedPatient(patient)
    setShowPatientDetails(true)
  }

  const formatDate = (date: Date) => {
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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startItem = filteredPatients.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(filteredPatients.length, currentPage * pageSize)
  const selectedPatientIsToggling = selectedPatient ? togglingIds.includes(selectedPatient.id) : false

  return (
    <div className="p-4 md:p-6">
      {feedback && (
        <div className="mb-4">
          <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className="relative pr-12">
            {feedback.type === 'error' ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            )}
            <AlertDescription className="text-sm text-gray-700">
              {feedback.message}
            </AlertDescription>
            <button
              type="button"
              onClick={handleDismissFeedback}
              className="absolute right-4 top-4 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Listado y Visualización de Pacientes</h1>
        <p className="text-gray-600">Consulta y gestiona la información completa de todos los pacientes registrados</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <Input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end md:ml-4 md:w-auto">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full border-gray-300 text-gray-600 hover:text-gray-900 sm:w-auto"
            >
              {isRefreshing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span>Actualizando...</span>
                </div>
              ) : (
                '🔄 Actualizar'
              )}
            </Button>
            <Button
              onClick={handleOpenCreateForm}
              disabled={formSubmitting || isEditMode}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
            >
              {formSubmitting && !isEditMode ? (
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

      {/* Lista de Pacientes en vista tabular */}
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Paciente</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Contacto</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Registro</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase tracking-wide text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedPatients.map((patient) => {
                  const isToggling = togglingIds.includes(patient.id)
                  const isActivating = !patient.activo

                  return (
                    <tr key={patient.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {patient.nombre.charAt(0)}{patient.apellido.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900">
                            {patient.apellido}, {patient.nombre}
                          </div>
                          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>DNI: {patient.dni}</span>
                            <span className="text-gray-300">•</span>
                            <span>{patient.genero}</span>
                            <span className="text-gray-300">•</span>
                            <span>{calculateAge(new Date(patient.fechaNacimiento))} años</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="font-medium text-gray-700 truncate max-w-[200px]">
                          {patient.email || 'Sin email registrado'}
                        </div>
                        <div>
                          {patient.celular || patient.telefono ? (
                            <span className="font-medium text-gray-700">Tel: {patient.celular || patient.telefono}</span>
                          ) : (
                            <span className="text-gray-400">Sin teléfono</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-gray-600">
                      <div><span className="font-medium text-gray-700">Registrado:</span> {formatDate(patient.createdAt)}</div>
                      <div><span className="font-medium text-gray-700">Actualizado:</span> {formatDate(patient.updatedAt)}</div>
                      <div><span className="font-medium text-gray-700">Por:</span> {patient.creator.name || patient.creator.email}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Badge 
                        variant={patient.activo ? 'default' : 'destructive'}
                        className={`${patient.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} font-medium`}
                      >
                        {patient.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePatientSelect(patient)}
                          className="text-gray-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditForm(patient)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          disabled={formSubmitting}
                        >
                          Editar
                        </Button>
                        <Button
                          variant={patient.activo ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleActive(patient)}
                          disabled={isToggling}
                          className={`${patient.activo 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                          } flex items-center gap-2`}
                        >
                          {isToggling ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {isActivating ? 'Activando...' : 'Desactivando...'}
                            </>
                          ) : (
                            patient.activo ? 'Desactivar' : 'Activar'
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {startItem}-{endItem} de {filteredPatients.length} pacientes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}

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
          onSubmit={handleSavePatient}
          onCancel={handleCloseForm}
          isLoading={formSubmitting}
          initialData={isEditMode && patientToEdit ? buildInitialFormData(patientToEdit) : undefined}
          title={isEditMode ? 'Editar Paciente' : undefined}
          submitLabel={isEditMode ? 'Guardar Cambios' : undefined}
          loadingLabel={isEditMode ? 'Actualizando...' : undefined}
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
          onEdit={handleOpenEditForm}
          onToggleActive={handleToggleActive}
          isToggling={selectedPatientIsToggling}
        />
      )}
    </div>
  )
}
