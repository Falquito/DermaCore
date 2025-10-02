'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppointmentStatus } from '@prisma/client'
import { Search, History as HistoryIcon, Calendar, AlertCircle, CheckCircle2, Loader2, Pill, FlaskRound, ClipboardCheck, User, Phone, Mail, MapPin, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { APPOINTMENT_STATUS_META, getStatusLabel } from '@/lib/appointment-status'

interface Patient {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  genero: string
  telefono?: string
  email?: string
  direccion?: string
}

interface Professional {
  id: string
  name: string
  apellido: string
}

interface ObraSocial {
  id: string
  nombre: string
}

interface DiagnosisItem {
  id: string
  principal: string
  secundarios?: string[]
  notas?: string
}

interface PrescriptionItem {
  id: string
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones?: string
}

interface Prescription {
  id: string
  createdAt: string
  items: PrescriptionItem[]
}

interface StudyOrderItem {
  id: string
  estudio: string
  indicaciones?: string
}

interface StudyOrder {
  id: string
  createdAt: string
  items: StudyOrderItem[]
}

interface Appointment {
  id: string
  fecha: string
  estado: AppointmentStatus
  motivo?: string
  observaciones?: string
  profesional?: Professional
  obraSocial?: ObraSocial
  diagnoses: DiagnosisItem[]
  prescriptions: Prescription[]
  studyOrders: StudyOrder[]
}

interface Medication {
  id: string
  activo: boolean
}

interface Filters {
  dateFrom: string
  dateTo: string
  status: string
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

const DEFAULT_PAGE_SIZE = 4

const formatDate = (value: string | Date): string => {
  try {
    return new Date(value).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

const formatToInputDate = (date: Date | undefined): string =>
  date ? date.toISOString().split('T')[0] : ''

const calculateAge = (birthDate: string | Date | null): string | number => {
  if (!birthDate) return '-'
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return '-'
  const diff = Date.now() - date.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export default function HistoriasClinicasContent() {
  // Estado para controlar qué vista mostrar
  const [currentView, setCurrentView] = useState<'search' | 'history'>('search')
  
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [totalAppointments, setTotalAppointments] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)
  const [filters, setFilters] = useState<Filters>({ dateFrom: '', dateTo: '', status: '' })
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'diagnoses' | 'prescriptions' | 'studies' | 'medications'>('all')
  const [categoryPage, setCategoryPage] = useState(1)
  const [categoryPageSize] = useState(10)

  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPatientHandledRef = useRef<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalAppointments / pageSize))

  const dateFromValue = useMemo(() => filters.dateFrom ? new Date(filters.dateFrom) : undefined, [filters.dateFrom])
  const dateToValue = useMemo(() => filters.dateTo ? new Date(filters.dateTo) : undefined, [filters.dateTo])

  const summary = useMemo(() => {
    if (!appointments.length) {
      return {
        totalAppointments: 0,
        uniqueProfessionals: 0,
        totalDiagnoses: 0,
        totalPrescriptions: 0,
        totalStudies: 0,
        medicationActive: medications.filter((med) => med.activo).length,
        professionalsNames: [],
        allDiagnoses: [],
        allPrescriptions: [],
        allStudies: [],
        activeMedications: medications.filter((med) => med.activo),
      }
    }

    const professionals = new Set()
    const professionalsNames = new Set<string>()
    const allDiagnoses: (DiagnosisItem & { appointmentDate: string; appointmentId: string })[] = []
    const allPrescriptions: (Prescription & { appointmentDate: string; appointmentId: string })[] = []
    const allStudies: (StudyOrder & { appointmentDate: string; appointmentId: string })[] = []

    appointments.forEach((appointment) => {
      if (appointment.profesional?.id) {
        professionals.add(appointment.profesional.id)
        professionalsNames.add(`${appointment.profesional.name} ${appointment.profesional.apellido}`)
      }
      
      // Collect all diagnoses with appointment context
      appointment.diagnoses.forEach((diagnosis) => {
        allDiagnoses.push({
          ...diagnosis,
          appointmentDate: appointment.fecha,
          appointmentId: appointment.id
        })
      })
      
      // Collect all prescriptions with appointment context
      appointment.prescriptions.forEach((prescription) => {
        allPrescriptions.push({
          ...prescription,
          appointmentDate: appointment.fecha,
          appointmentId: appointment.id
        })
      })
      
      // Collect all studies with appointment context
      appointment.studyOrders.forEach((study) => {
        allStudies.push({
          ...study,
          appointmentDate: appointment.fecha,
          appointmentId: appointment.id
        })
      })
    })

    return {
      totalAppointments,
      uniqueProfessionals: professionals.size,
      totalDiagnoses: allDiagnoses.length,
      totalPrescriptions: allPrescriptions.length,
      totalStudies: allStudies.length,
      medicationActive: medications.filter((med) => med.activo).length,
      professionalsNames: Array.from(professionalsNames),
      allDiagnoses: allDiagnoses.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
      allPrescriptions: allPrescriptions.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
      allStudies: allStudies.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
      activeMedications: medications.filter((med) => med.activo),
    }
  }, [appointments, medications, totalAppointments])

  const setPatientQueryParam = useCallback((patientId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (patientId) {
      params.set('patientId', patientId)
    } else {
      params.delete('patientId')
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.replace(newUrl)
  }, [searchParams, router])

  const fetchHistory = useCallback(
    async ({
      patient,
      patientId,
      requestedFilters,
      requestedPage,
      context,
    }: {
      patient?: Patient
      patientId?: string
      requestedFilters: Filters
      requestedPage: number
      context: string
    }) => {
      const targetPatient = patient || selectedPatient
      const targetPatientId = patientId || targetPatient?.id

      if (!targetPatientId) return

      setLoadingHistory(true)
      setFeedback(null)

      try {
        const params = new URLSearchParams({
          patientId: targetPatientId,
          page: requestedPage.toString(),
          pageSize: pageSize.toString(),
        })

        if (requestedFilters.dateFrom) params.append('dateFrom', requestedFilters.dateFrom)
        if (requestedFilters.dateTo) params.append('dateTo', requestedFilters.dateTo)
        if (requestedFilters.status) params.append('status', requestedFilters.status)

        const response = await fetch(`/api/appointments/history?${params}`)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (patient && context === 'search') {
          setSelectedPatient(patient)
          setPatientQueryParam(patient.id)
        }

        setAppointments(data.appointments || [])
        setMedications(data.medications || [])
        setTotalAppointments(data.total || 0)
        setPage(requestedPage)
        setFilters(requestedFilters)

        if (context === 'search') {
          setFeedback({
            type: 'success',
            message: `Historia clínica cargada: ${data.total || 0} consulta${data.total === 1 ? '' : 's'} encontrada${data.total === 1 ? '' : 's'}`,
          })
        }
      } catch (error) {
        console.error('Error fetching patient history:', error)
        setFeedback({
          type: 'error',
          message: 'Error al cargar la historia clínica. Por favor, intenta nuevamente.',
        })
      } finally {
        setLoadingHistory(false)
      }
    },
    [selectedPatient, pageSize, setPatientQueryParam]
  )

  const handleSearch = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    if (!searchTerm.trim()) return

    setSearching(true)
    setFeedback(null)
    setPatients([])

    try {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchTerm.trim())}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setPatients(data.patients || [])

      if (data.patients && data.patients.length === 0) {
        setFeedback({
          type: 'error',
          message: 'No se encontraron pacientes con los criterios de búsqueda.',
        })
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      setFeedback({
        type: 'error',
        message: 'Error al buscar pacientes. Por favor, intenta nuevamente.',
      })
      setPatients([])
    } finally {
      setSearching(false)
    }
  }, [searchTerm])

  useEffect(() => {
    const fetchRecentPatients = async () => {
      try {
        const response = await fetch('/api/patients/recent')
        if (response.ok) {
          const data = await response.json()
          setRecentPatients(data.patients || [])
        }
      } catch (error) {
        console.error('Error fetching recent patients:', error)
      }
    }

    fetchRecentPatients()
  }, [])

  useEffect(() => {
    const patientIdParam = searchParams.get('patientId')
    if (patientIdParam && patientIdParam !== initialPatientHandledRef.current) {
      // Solo procesar si realmente cambió el parámetro
      if (initialPatientHandledRef.current !== patientIdParam) {
        initialPatientHandledRef.current = patientIdParam
        const baseFilters = { dateFrom: '', dateTo: '', status: '' }
        setCurrentView('history')
        fetchHistory({ patientId: patientIdParam, requestedFilters: baseFilters, requestedPage: 1, context: 'initial' })
      }
    } else if (!patientIdParam && selectedPatient) {
      // Si no hay parámetro pero hay paciente seleccionado, limpiar
      setCurrentView('search')
      setSelectedPatient(null)
    }
  }, [fetchHistory, searchParams, selectedPatient])

  const handleSelectPatient = useCallback((patient: Patient) => {
    const baseFilters: Filters = { dateFrom: '', dateTo: '', status: '' }
    
    // Cambiar inmediatamente la vista y establecer el paciente
    setCurrentView('history')
    setSelectedPatient(patient)
    setPage(1)
    setPatientQueryParam(patient.id)
    
    // Luego cargar la historia
    fetchHistory({ patient, requestedFilters: baseFilters, requestedPage: 1, context: 'search' })
  }, [fetchHistory, setPatientQueryParam])

  const handleFiltersChange = useCallback((nextFilters: Filters) => {
    setFilters(nextFilters)
    if (selectedPatient) {
      setPage(1)
      fetchHistory({ patient: selectedPatient, requestedFilters: nextFilters, requestedPage: 1, context: 'filters' })
    }
  }, [selectedPatient, fetchHistory])

  const handlePageChange = useCallback((nextPage: number) => {
    if (!selectedPatient) return
    const safePage = Math.max(1, Math.min(totalPages, nextPage))
    fetchHistory({ patient: selectedPatient, requestedFilters: filters, requestedPage: safePage, context: 'pagination' })
  }, [selectedPatient, totalPages, filters, fetchHistory])

  const categoryData = useMemo(() => {
    if (categoryFilter === 'all') {
      return {
        items: appointments,
        total: appointments.length,
        type: 'appointments' as const
      }
    }
    
    switch (categoryFilter) {
      case 'diagnoses':
        const startDiag = (categoryPage - 1) * categoryPageSize
        const endDiag = startDiag + categoryPageSize
        return {
          items: summary.allDiagnoses.slice(startDiag, endDiag),
          total: summary.allDiagnoses.length,
          type: 'diagnoses' as const
        }
      case 'prescriptions':
        const startPresc = (categoryPage - 1) * categoryPageSize
        const endPresc = startPresc + categoryPageSize
        return {
          items: summary.allPrescriptions.slice(startPresc, endPresc),
          total: summary.allPrescriptions.length,
          type: 'prescriptions' as const
        }
      case 'studies':
        const startStud = (categoryPage - 1) * categoryPageSize
        const endStud = startStud + categoryPageSize
        return {
          items: summary.allStudies.slice(startStud, endStud),
          total: summary.allStudies.length,
          type: 'studies' as const
        }
      case 'medications':
        const startMed = (categoryPage - 1) * categoryPageSize
        const endMed = startMed + categoryPageSize
        return {
          items: summary.activeMedications.slice(startMed, endMed),
          total: summary.activeMedications.length,
          type: 'medications' as const
        }
      default:
        return {
          items: appointments,
          total: appointments.length,
          type: 'appointments' as const
        }
    }
  }, [appointments, categoryFilter, categoryPage, categoryPageSize, summary])

  const handleCategoryChange = useCallback((newCategory: typeof categoryFilter) => {
    setCategoryFilter(newCategory)
    setCategoryPage(1)
  }, [])

  const handleBackToSearch = useCallback(() => {
    // Limpiar todos los estados de una vez
    setCurrentView('search')
    setSelectedPatient(null)
    setAppointments([])
    setMedications([])
    setTotalAppointments(0)
    setPage(1)
    setFilters({ dateFrom: '', dateTo: '', status: '' })
    setCategoryFilter('all')
    setCategoryPage(1)
    setPatientQueryParam(null)
    setFeedback(null)
  }, [setPatientQueryParam])

  // Componente para la vista de historia clínica
  const HistoryView = useCallback(() => {
    // Si no hay paciente seleccionado, no renderizar nada
    if (!selectedPatient || !selectedPatient.id) {
      return null
    }

    return (
      <div className="space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBackToSearch}
                className="text-sky-700 hover:text-sky-900 border-sky-200 hover:border-sky-300 px-6 py-3 rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al buscador
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Historia clínica - {selectedPatient?.apellido}, {selectedPatient?.nombre}
                </h1>
                <p className="text-lg text-gray-600">Turnos previos, diagnósticos, recetas y estudios</p>
              </div>
            </div>
            <Link href="/profesional/consultas">
              <Button className="bg-sky-600 hover:bg-sky-700 px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all">Gestionar desde consultas</Button>
            </Link>
          </div>
        </section>


        {feedback && (
          <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'} className="rounded-2xl border-0 shadow-lg">
            <AlertDescription className="flex items-center gap-2">
              {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <span>{feedback.message}</span>
            </AlertDescription>
          </Alert>
        )}

          {selectedPatient && (
            <>
            {/* Información del paciente */}
            <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {selectedPatient.apellido}, {selectedPatient.nombre}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-gray-500">DNI:</span>
                            <span className="ml-2 font-medium">{selectedPatient.dni}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Edad:</span>
                            <span className="ml-2 font-medium">{calculateAge(selectedPatient.fechaNacimiento)} años</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Género:</span>
                            <span className="ml-2 font-medium">{selectedPatient.genero}</span>
                          </div>
                          {selectedPatient.telefono && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{selectedPatient.telefono}</span>
                            </div>
                          )}
                          {selectedPatient.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{selectedPatient.email}</span>
                            </div>
                          )}
                          {selectedPatient.direccion && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{selectedPatient.direccion}</span>
                            </div>
                          )}
                        </div>
                        {summary.professionalsNames.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="text-sm">
                              <span className="text-gray-500">Profesionales que lo atendieron:</span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {summary.professionalsNames.slice(0, 3).map((name, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                                    <User className="h-3 w-3 mr-1" />
                                    {name}
                                  </span>
                                ))}
                                {summary.professionalsNames.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                    +{summary.professionalsNames.length - 3} más
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchHistory({ patient: selectedPatient, requestedFilters: filters, requestedPage: page, context: 'refresh' })}
                          disabled={loadingHistory}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Actualizar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
            </section>

            {/* Filtros */}
            <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Filtrar historial
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha desde</label>
                    <DatePicker
                      date={dateFromValue}
                      onDateChange={(date: Date | undefined) => handleFiltersChange({ ...filters, dateFrom: formatToInputDate(date) })}
                      placeholder="Seleccionar fecha"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha hasta</label>
                    <DatePicker
                      date={dateToValue}
                      onDateChange={(date: Date | undefined) => handleFiltersChange({ ...filters, dateTo: formatToInputDate(date) })}
                      placeholder="Seleccionar fecha"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado del turno</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFiltersChange({ ...filters, status: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Todos los estados</option>
                      {Object.values(AppointmentStatus).map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
            </section>

              {/* Resumen estadístico */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`overflow-hidden border-none shadow-sm text-left transition-all hover:shadow-md ${
                    categoryFilter === 'all' 
                      ? 'bg-gradient-to-br from-blue-50 via-white to-white ring-2 ring-blue-200' 
                      : 'bg-gradient-to-br from-blue-50 via-white to-white hover:from-blue-100'
                  }`}
                  style={{ borderRadius: '1rem' }}
                >
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <h3 className="text-sm font-medium text-blue-900">Total consultas</h3>
                    <span className="rounded-full bg-blue-100 p-2 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="text-3xl font-semibold text-blue-900">{summary.totalAppointments}</div>
                    <p className="text-xs text-blue-700/80">Consultas realizadas</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCategoryChange('diagnoses')}
                  className={`overflow-hidden border-none shadow-sm text-left transition-all hover:shadow-md ${
                    categoryFilter === 'diagnoses' 
                      ? 'bg-gradient-to-br from-amber-50 via-white to-white ring-2 ring-amber-200' 
                      : 'bg-gradient-to-br from-amber-50 via-white to-white hover:from-amber-100'
                  }`}
                  style={{ borderRadius: '1rem' }}
                >
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <h3 className="text-sm font-medium text-amber-900">Diagnósticos</h3>
                    <span className="rounded-full bg-amber-100 p-2 text-amber-600">
                      <ClipboardCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="text-3xl font-semibold text-amber-900">{summary.totalDiagnoses}</div>
                    <p className="text-xs text-amber-800/80">Todos los diagnósticos</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCategoryChange('studies')}
                  className={`overflow-hidden border-none shadow-sm text-left transition-all hover:shadow-md ${
                    categoryFilter === 'studies' 
                      ? 'bg-gradient-to-br from-purple-50 via-white to-white ring-2 ring-purple-200' 
                      : 'bg-gradient-to-br from-purple-50 via-white to-white hover:from-purple-100'
                  }`}
                  style={{ borderRadius: '1rem' }}
                >
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <h3 className="text-sm font-medium text-purple-900">Estudios</h3>
                    <span className="rounded-full bg-purple-100 p-2 text-purple-600">
                      <FlaskRound className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="text-3xl font-semibold text-purple-900">{summary.totalStudies}</div>
                    <p className="text-xs text-purple-800/80">Todos los estudios</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCategoryChange('medications')}
                  className={`overflow-hidden border-none shadow-sm text-left transition-all hover:shadow-md ${
                    categoryFilter === 'medications' 
                      ? 'bg-gradient-to-br from-teal-50 via-white to-white ring-2 ring-teal-200' 
                      : 'bg-gradient-to-br from-teal-50 via-white to-white hover:from-teal-100'
                  }`}
                  style={{ borderRadius: '1rem' }}
                >
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <h3 className="text-sm font-medium text-teal-900">Medicación activa</h3>
                    <span className="rounded-full bg-teal-100 p-2 text-teal-600">
                      <Pill className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="text-3xl font-semibold text-teal-900">{summary.medicationActive}</div>
                    <p className="text-xs text-teal-800/80">Medicamentos activos</p>
                  </div>
                </button>
              </div>

            {/* Historial de citas */}
            <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <HistoryIcon className="h-5 w-5" />
                        {categoryFilter === 'all' ? 'Historial de consultas' :
                         categoryFilter === 'diagnoses' ? 'Consultas con diagnósticos' :
                         categoryFilter === 'prescriptions' ? 'Consultas con recetas' :
                         categoryFilter === 'studies' ? 'Consultas con estudios' :
                         categoryFilter === 'medications' ? 'Consultas con medicación activa' :
                         'Historial de consultas'}
                      </h4>
                      {categoryFilter !== 'all' && (
                        <button
                          onClick={() => handleCategoryChange('all')}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                        >
                          Ver todas
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {categoryData.total > 0 ? (
                        categoryFilter === 'all' 
                          ? `${categoryData.total} consulta${categoryData.total !== 1 ? 's' : ''}`
                          : `${categoryData.total} elemento${categoryData.total !== 1 ? 's' : ''}`
                      ) : 'Sin registros'}
                    </div>
                  </div>
                </div>
                
                {loadingHistory ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-4 animate-spin" />
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">Cargando historia clínica</h5>
                    <p className="text-gray-600">Obteniendo los datos del paciente...</p>
                  </div>
                ) : categoryData.total === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">
                      {categoryFilter === 'all' ? 'Sin historial' : 'Sin elementos en esta categoría'}
                    </h5>
                    <p className="text-gray-600">
                      {categoryFilter === 'all' 
                        ? 'No se encontraron consultas para este paciente con los filtros aplicados.'
                        : `No se encontraron ${categoryFilter === 'diagnoses' ? 'diagnósticos' : 
                            categoryFilter === 'prescriptions' ? 'recetas' : 
                            categoryFilter === 'studies' ? 'estudios' : 
                            categoryFilter === 'medications' ? 'medicamentos activos' : 'elementos'} para este paciente.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {categoryData.type === 'appointments' ? (
                      // Mostrar consultas completas
                      (categoryData.items as Appointment[]).map((appointment) => (
                        <div key={appointment.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-sky-100 rounded-full">
                              <Calendar className="h-5 w-5 text-sky-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-base font-semibold text-gray-900">
                                      Consulta del {formatDate(appointment.fecha)}
                                    </h5>
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${APPOINTMENT_STATUS_META[appointment.estado]?.badgeClass || ''}`}
                                    >
                                      {getStatusLabel(appointment.estado)}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    {appointment.profesional && (
                                      <div>
                                        <span className="font-medium">Profesional:</span> {appointment.profesional.name} {appointment.profesional.apellido}
                                      </div>
                                    )}
                                    {appointment.obraSocial && (
                                      <div>
                                        <span className="font-medium">Obra social:</span> {appointment.obraSocial.nombre}
                                      </div>
                                    )}
                                    {appointment.motivo && (
                                      <div>
                                        <span className="font-medium">Motivo:</span> {appointment.motivo}
                                      </div>
                                    )}
                                    {appointment.observaciones && (
                                      <div>
                                        <span className="font-medium">Observaciones:</span> {appointment.observaciones}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Diagnósticos */}
                              {appointment.diagnoses?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4" />
                                    Diagnósticos ({appointment.diagnoses.length})
                                  </h6>
                                  <div className="space-y-2">
                                    {appointment.diagnoses.map((diagnosis) => (
                                      <div key={diagnosis.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <div className="text-sm">
                                          <div className="font-medium text-amber-800">Principal: {diagnosis.principal}</div>
                                          {diagnosis.secundarios && diagnosis.secundarios.length > 0 && (
                                            <div className="text-amber-700 mt-1">
                                              Secundarios: {diagnosis.secundarios.join(', ')}
                                            </div>
                                          )}
                                          {diagnosis.notas && (
                                            <div className="text-amber-600 text-xs mt-2">
                                              Notas: {diagnosis.notas}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recetas */}
                              {appointment.prescriptions?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Pill className="h-4 w-4" />
                                    Recetas ({appointment.prescriptions.length})
                                  </h6>
                                  <div className="space-y-2">
                                    {appointment.prescriptions.map((prescription) => (
                                      <div key={prescription.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="text-xs text-green-600 mb-1">
                                          Recetado el {formatDate(prescription.createdAt)}
                                        </div>
                                        <div className="space-y-1">
                                          {prescription.items?.map((item) => (
                                            <div key={item.id} className="text-sm">
                                              <div className="font-medium text-green-800">{item.medicamento}</div>
                                              <div className="text-green-700 text-xs">
                                                {item.dosis} • {item.frecuencia} • {item.duracion}
                                                {item.indicaciones && (
                                                  <span className="block mt-1">Indicaciones: {item.indicaciones}</span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Órdenes de estudios */}
                              {appointment.studyOrders?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FlaskRound className="h-4 w-4" />
                                    Órdenes de estudios ({appointment.studyOrders.length})
                                  </h6>
                                  <div className="space-y-2">
                                    {appointment.studyOrders.map((studyOrder) => (
                                      <div key={studyOrder.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="text-xs text-blue-600 mb-1">
                                          Ordenado el {formatDate(studyOrder.createdAt)}
                                        </div>
                                        <div className="space-y-1">
                                          {studyOrder.items?.map((item) => (
                                            <div key={item.id} className="text-sm">
                                              <div className="font-medium text-blue-800">{item.estudio}</div>
                                              {item.indicaciones && (
                                                <div className="text-blue-700 text-xs">
                                                  Indicaciones: {item.indicaciones}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : categoryData.type === 'diagnoses' ? (
                      // Mostrar solo diagnósticos
                      (categoryData.items as (DiagnosisItem & { appointmentDate: string; appointmentId: string })[]).map((diagnosis) => (
                        <div key={`${diagnosis.appointmentId}-${diagnosis.id}`} className="p-6 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 rounded-full">
                              <ClipboardCheck className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="text-base font-semibold text-gray-900">{diagnosis.principal}</h5>
                                <span className="text-xs text-gray-500">
                                  {formatDate(diagnosis.appointmentDate)}
                                </span>
                              </div>
                              {diagnosis.secundarios && diagnosis.secundarios.length > 0 && (
                                <div className="text-sm text-amber-700 mb-2">
                                  <span className="font-medium">Secundarios:</span> {diagnosis.secundarios.join(', ')}
                                </div>
                              )}
                              {diagnosis.notas && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Notas:</span> {diagnosis.notas}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : categoryData.type === 'studies' ? (
                      // Mostrar solo estudios
                      (categoryData.items as (StudyOrder & { appointmentDate: string; appointmentId: string })[]).map((study) => (
                        <div key={`${study.appointmentId}-${study.id}`} className="p-6 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <FlaskRound className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="text-base font-semibold text-gray-900">Orden de estudios</h5>
                                <span className="text-xs text-gray-500">
                                  {formatDate(study.appointmentDate)}
                                </span>
                              </div>
                              <div className="text-xs text-purple-600 mb-2">
                                Ordenado el {formatDate(study.createdAt)}
                              </div>
                              <div className="space-y-1">
                                {study.items?.map((item) => (
                                  <div key={item.id} className="text-sm">
                                    <div className="font-medium text-purple-800">{item.estudio}</div>
                                    {item.indicaciones && (
                                      <div className="text-purple-700 text-xs">
                                        Indicaciones: {item.indicaciones}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : categoryData.type === 'medications' ? (
                      // Mostrar medicamentos activos
                      (categoryData.items as Medication[]).map((medication) => (
                        <div key={medication.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-teal-100 rounded-full">
                              <Pill className="h-5 w-5 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="text-base font-semibold text-gray-900">Medicación activa</h5>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800">
                                  Activo
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                ID: {medication.id}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : null}
                  </div>
                )}

                {/* Paginación */}
                {categoryData.total > 0 && (
                  <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {categoryFilter === 'all' 
                        ? (totalPages > 1 ? `Página ${page} de ${totalPages}` : `${categoryData.total} consulta${categoryData.total !== 1 ? 's' : ''}`)
                        : `Mostrando ${Math.min(categoryPageSize, categoryData.total)} de ${categoryData.total} elemento${categoryData.total !== 1 ? 's' : ''}`
                      }
                    </div>
                    {categoryFilter === 'all' && totalPages > 1 ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => handlePageChange(page - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => handlePageChange(page + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    ) : categoryFilter !== 'all' && Math.ceil(categoryData.total / categoryPageSize) > 1 ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={categoryPage <= 1}
                          onClick={() => setCategoryPage(prev => Math.max(prev - 1, 1))}
                        >
                          Anterior
                        </Button>
                        <span className="text-xs text-gray-500 flex items-center">
                          Página {categoryPage} de {Math.ceil(categoryData.total / categoryPageSize)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={categoryPage >= Math.ceil(categoryData.total / categoryPageSize)}
                          onClick={() => setCategoryPage(prev => prev + 1)}
                        >
                          Siguiente
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
            </section>

            </>
          )}
      </div>
    )
  }, [selectedPatient, handleBackToSearch, feedback, dateFromValue, dateToValue, handleFiltersChange, filters, summary, loadingHistory, categoryData, totalPages, page, handlePageChange, fetchHistory, categoryFilter, handleCategoryChange, categoryPage, categoryPageSize])

  // Si estamos en vista de historia pero no hay paciente seleccionado, volver a búsqueda
  useEffect(() => {
    if (currentView === 'history' && !selectedPatient && !searchParams.get('patientId')) {
      setCurrentView('search')
    }
  }, [currentView, selectedPatient, searchParams])

  // Vista de búsqueda - renderizada directamente sin useCallback para evitar pérdida de foco
  if (currentView === 'search') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Historias clínicas</h1>
              <p className="text-lg text-gray-600">Busca y accede a las historias clínicas de tus pacientes</p>
            </div>
            <Link href="/profesional/consultas">
              <Button className="bg-sky-600 hover:bg-sky-700 px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all">Gestionar desde consultas</Button>
            </Link>
          </div>
        </section>

        {feedback && (
          <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'} className="rounded-2xl border-0 shadow-lg">
            <AlertDescription className="flex items-center gap-2">
              {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <span>{feedback.message}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Buscador principal */}
        <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-3xl mb-6">
              <HistoryIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Buscar paciente</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Ingresa el nombre, apellido o DNI del paciente para acceder a su historia clínica completa</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6 max-w-lg mx-auto">
            <div className="relative">
              <Search className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nombre, apellido o DNI"
                className="pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
                autoComplete="off"
                disabled={searching}
              />
            </div>
            <Button 
              type="submit" 
              disabled={searching || !searchTerm.trim()} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-6 w-6 mr-3" />
                  Buscar paciente
                </>
              )}
            </Button>
          </form>
        </section>

        {/* Resultados de búsqueda */}
        {patients.length > 0 && (
          <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Pacientes encontrados</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <button
                  type="button"
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="border rounded-lg p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">
                        {patient.apellido}, {patient.nombre}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">DNI: {patient.dni}</div>
                      <div className="text-sm text-gray-500">
                        Edad: {calculateAge(patient.fechaNacimiento)} años • {patient.genero}
                      </div>
                      {patient.telefono && (
                        <div className="text-xs text-gray-400 mt-1">
                          <Phone className="h-3 w-3 inline mr-1" />
                          {patient.telefono}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Pacientes recientes */}
        {recentPatients.length > 0 && patients.length === 0 && (
          <section className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Pacientes recientes</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentPatients.map((patient) => (
                <button
                  type="button"
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="border rounded-lg p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">
                        {patient.apellido}, {patient.nombre}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">DNI: {patient.dni}</div>
                      <div className="text-sm text-gray-500">
                        Edad: {calculateAge(patient.fechaNacimiento)} años • {patient.genero}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // Vista de historia clínica
  return <HistoryView />
}
