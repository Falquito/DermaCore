'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppointmentStatus } from '@prisma/client'
import { Search, History as HistoryIcon, Calendar, AlertCircle, CheckCircle2, Loader2, Pill, FlaskRound, ClipboardCheck, User, Phone, Mail, MapPin, RefreshCw, ArrowLeft, ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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

interface DiagnosisWithAppointment {
  id: string
  principal: string
  secundarios: string[]
  notas: string | null
  createdAt: string
  appointment: {
    id: string
    fecha: string
    profesional: {
      name: string | null
      apellido: string | null
    } | null
  }
}

interface StudyOrderWithAppointment {
  id: string
  notas: string | null
  createdAt: string
  appointment: {
    id: string
    fecha: string
    profesional: {
      name: string | null
      apellido: string | null
    } | null
  }
  items: StudyOrderItem[]
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

interface StudyResultItem {
  id: string
  studyResultId: string
  parametro: string
  valor: string
  unidad: string | null
  valorReferencia: string | null
  esNormal: boolean | null
}

interface StudyResult {
  id: string
  studyOrderItemId: string
  fechaRealizacion: string
  laboratorio: string | null
  observaciones: string | null
  createdAt: string
  updatedAt: string
  uploadedBy: {
    name: string | null
    apellido: string | null
  }
  items: StudyResultItem[]
}

type StudyStatus = 'ORDENADO' | 'COMPLETADO'

interface StudyOrderItem {
  id: string
  estudio: string
  indicaciones?: string
  estado: StudyStatus
  result: StudyResult | null
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
  nombre: string
  dosis: string
  frecuencia: string
  duracion?: string
  indicaciones?: string
  activo: boolean
  fechaInicio?: string
  fechaFin?: string
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

const DEFAULT_PAGE_SIZE = 2

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
  const [allDiagnoses, setAllDiagnoses] = useState<DiagnosisWithAppointment[]>([])
  const [allStudyOrders, setAllStudyOrders] = useState<StudyOrderWithAppointment[]>([])
  const [totalAppointments, setTotalAppointments] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)
  const [filters, setFilters] = useState<Filters>({ dateFrom: '', dateTo: '', status: '' })
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'diagnoses' | 'prescriptions' | 'studies' | 'medications'>('all')
  const [categoryPage, setCategoryPage] = useState(1)
  
  // Estados para resultados de estudios
  const [selectedStudyForResult, setSelectedStudyForResult] = useState<StudyOrderItem | null>(null)
  const [studyResultForm, setStudyResultForm] = useState({
    fechaRealizacion: '',
    laboratorio: '',
    observaciones: '',
    items: [{ parametro: '', valor: '', unidad: '', valorReferencia: '', esNormal: null as boolean | null }]
  })
  const [studyResultLoading, setStudyResultLoading] = useState(false)
  
  const getCategoryPageSize = (category: string) => {
    switch (category) {
      case 'medications': return 2
      case 'diagnoses': return 4
      case 'studies': return 2
      case 'prescriptions': return 4
      default: return 4
    }
  }
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set())

  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPatientHandledRef = useRef<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalAppointments / pageSize))

  const summary = useMemo(() => {
    const professionals = new Set()
    const professionalsNames = new Set<string>()
    const allPrescriptions: (Prescription & { appointmentDate: string; appointmentId: string })[] = []

    // Collect professionals from appointments and prescriptions from appointments
    appointments.forEach((appointment) => {
      if (appointment.profesional?.id) {
        professionals.add(appointment.profesional.id)
        professionalsNames.add(`${appointment.profesional.name} ${appointment.profesional.apellido}`)
      }
      
      // Collect all prescriptions with appointment context
      appointment.prescriptions?.forEach((prescription) => {
        allPrescriptions.push({
          ...prescription,
          appointmentDate: appointment.fecha,
          appointmentId: appointment.id
        })
      })
    })

    // Collect all studies count
    const totalStudyItems = allStudyOrders.reduce((count, order) => count + (order.items?.length || 0), 0)

    const result = {
      totalAppointments,
      uniqueProfessionals: professionals.size,
      totalDiagnoses: allDiagnoses.length,
      totalPrescriptions: allPrescriptions.length,
      totalStudies: totalStudyItems,
      medicationActive: medications.filter((med) => med.activo).length,
      medicationTotal: medications.length,
      professionalsNames: Array.from(professionalsNames),
      allDiagnoses: allDiagnoses.map(diagnosis => ({
        ...diagnosis,
        appointmentDate: diagnosis.appointment.fecha,
        appointmentId: diagnosis.appointment.id
      })).sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
      allPrescriptions: allPrescriptions.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
      allStudies: allStudyOrders.map(order => ({
        ...order,
        appointmentDate: order.appointment.fecha,
        appointmentId: order.appointment.id
      })).sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
      allMedications: medications.sort((a, b) => {
        // Primero los activos, luego los inactivos
        if (a.activo && !b.activo) return -1
        if (!a.activo && b.activo) return 1
        // Manejar casos donde nombre puede ser undefined o null
        const nameA = a.nombre || ''
        const nameB = b.nombre || ''
        return nameA.localeCompare(nameB)
      }),
    }

    return result
  }, [appointments, medications, totalAppointments, allDiagnoses, allStudyOrders])

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

  const fetchPatientDiagnoses = useCallback(async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/diagnoses`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setAllDiagnoses(data.diagnoses || [])
    } catch (error) {
      console.error('Error fetching patient diagnoses:', error)
    }
  }, [])

  const fetchPatientStudyOrders = useCallback(async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/study-orders`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setAllStudyOrders(data.studyOrders || [])
    } catch (error) {
      console.error('Error fetching patient study orders:', error)
    }
  }, [])

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

        // Cargar diagnósticos y estudios independientemente
        if (context === 'search' || context === 'refresh' || context === 'initial') {
          fetchPatientDiagnoses(targetPatientId)
          fetchPatientStudyOrders(targetPatientId)
        }

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
    [selectedPatient, pageSize, setPatientQueryParam, fetchPatientDiagnoses, fetchPatientStudyOrders]
  )

  const fetchPatientById = useCallback(async (patientId: string): Promise<Patient | null> => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      return data.patient || null
    } catch (error) {
      console.error('Error fetching patient:', error)
      setFeedback({
        type: 'error',
        message: 'Error al cargar la información del paciente.',
      })
      return null
    }
  }, [])

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

  const handleStudyResultSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedStudyForResult) return

    const { fechaRealizacion, laboratorio, observaciones, items } = studyResultForm
    
    if (!fechaRealizacion) {
      setFeedback({ type: 'error', message: 'La fecha de realización es obligatoria' })
      return
    }

    const validItems = items.filter(item => item.parametro.trim() && item.valor.trim())
    if (validItems.length === 0) {
      setFeedback({ type: 'error', message: 'Debe agregar al menos un resultado' })
      return
    }

    try {
      setStudyResultLoading(true)
      const response = await fetch('/api/professional/study-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyOrderItemId: selectedStudyForResult.id,
          fechaRealizacion: new Date(fechaRealizacion).toISOString(),
          laboratorio: laboratorio.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
          items: validItems.map(item => ({
            parametro: item.parametro.trim(),
            valor: item.valor.trim(),
            unidad: item.unidad?.trim() || undefined,
            valorReferencia: item.valorReferencia?.trim() || undefined,
            esNormal: item.esNormal === null ? undefined : item.esNormal,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar el resultado del estudio')
      }

      // Actualizar los appointments con el nuevo resultado
      setAppointments(prev => prev.map(appointment => ({
        ...appointment,
        studyOrders: appointment.studyOrders.map(order => ({
          ...order,
          items: order.items.map(item => 
            item.id === selectedStudyForResult.id
              ? { ...item, estado: 'COMPLETADO' as StudyStatus, result: data.studyResult }
              : item
          )
        }))
      })))

      // También actualizar allStudyOrders
      setAllStudyOrders(prev => prev.map(order => ({
        ...order,
        items: order.items.map(item => 
          item.id === selectedStudyForResult.id
            ? { ...item, estado: 'COMPLETADO' as StudyStatus, result: data.studyResult }
            : item
        )
      })))

      // Limpiar formulario
      setSelectedStudyForResult(null)
      setStudyResultForm({
        fechaRealizacion: '',
        laboratorio: '',
        observaciones: '',
        items: [{ parametro: '', valor: '', unidad: '', valorReferencia: '', esNormal: null }]
      })
      setFeedback({ type: 'success', message: data.message })
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al registrar el resultado del estudio' })
    } finally {
      setStudyResultLoading(false)
    }
  }

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
        
        // Primero obtener los datos del paciente, luego cargar el historial
        const loadPatientFromUrl = async () => {
          const patient = await fetchPatientById(patientIdParam)
          if (patient) {
            setSelectedPatient(patient)
            fetchHistory({ patient, requestedFilters: baseFilters, requestedPage: 1, context: 'initial' })
          } else {
            // Si no se puede cargar el paciente, volver al buscador
            setCurrentView('search')
            setFeedback({
              type: 'error',
              message: 'No se pudo encontrar el paciente solicitado.',
            })
          }
        }
        
        loadPatientFromUrl()
      }
    } else if (!patientIdParam && selectedPatient) {
      // Si no hay parámetro pero hay paciente seleccionado, limpiar
      setCurrentView('search')
      setSelectedPatient(null)
    }
  }, [fetchHistory, fetchPatientById, searchParams, selectedPatient])

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
        const diagPageSize = getCategoryPageSize('diagnoses')
        const startDiag = (categoryPage - 1) * diagPageSize
        const endDiag = startDiag + diagPageSize
        return {
          items: summary.allDiagnoses.slice(startDiag, endDiag),
          total: summary.allDiagnoses.length,
          type: 'diagnoses' as const
        }
      case 'prescriptions':
        const prescPageSize = getCategoryPageSize('prescriptions')
        const startPresc = (categoryPage - 1) * prescPageSize
        const endPresc = startPresc + prescPageSize
        return {
          items: summary.allPrescriptions.slice(startPresc, endPresc),
          total: summary.allPrescriptions.length,
          type: 'prescriptions' as const
        }
      case 'studies':
        const studPageSize = getCategoryPageSize('studies')
        const startStud = (categoryPage - 1) * studPageSize
        const endStud = startStud + studPageSize
        return {
          items: summary.allStudies.slice(startStud, endStud),
          total: summary.allStudies.length,
          type: 'studies' as const
        }
      case 'medications':
        const medPageSize = getCategoryPageSize('medications')
        const startMed = (categoryPage - 1) * medPageSize
        const endMed = startMed + medPageSize
        return {
          items: summary.allMedications.slice(startMed, endMed),
          total: summary.allMedications.length,
          type: 'medications' as const
        }
      default:
        return {
          items: appointments,
          total: appointments.length,
          type: 'appointments' as const
        }
    }
  }, [appointments, categoryFilter, categoryPage, summary])

  const handleCategoryChange = useCallback((newCategory: typeof categoryFilter) => {
    setCategoryFilter(newCategory)
    setCategoryPage(1)
  }, [])

  const toggleAppointmentExpansion = useCallback((appointmentId: string) => {
    setExpandedAppointments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId)
      } else {
        newSet.add(appointmentId)
      }
      return newSet
    })
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
    setExpandedAppointments(new Set())
    setPatientQueryParam(null)
    setFeedback(null)
  }, [setPatientQueryParam])

  // Componente para la vista de historia clínica
  const HistoryView = useCallback(() => {
    // Si no hay paciente seleccionado, mostrar estado de carga
    if (!selectedPatient || !selectedPatient.id) {
      return (
        <div className="space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Cargando historia clínica...</h1>
                <p className="text-lg text-gray-600">Obteniendo información del paciente</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToSearch}
                  className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al buscador
                </Button>
              </div>
            </div>
          </section>
          <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-emerald-600 mx-auto mb-4 animate-spin" />
              <h5 className="text-lg font-semibold text-gray-900 mb-2">Cargando información del paciente</h5>
              <p className="text-gray-600">Por favor espera mientras obtenemos los datos...</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Historia clínica - {selectedPatient?.apellido}, {selectedPatient?.nombre}
              </h1>
              <p className="text-lg text-gray-600">Turnos previos, mediaciones habituales, diagnósticos, recetas y estudios</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToSearch}
                className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al buscador
              </Button>
            </div>
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
                              <span className="text-gray-500">Fue atendid@ por:</span>
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
                    <h3 className="text-sm font-medium text-teal-900">Medicación habitual</h3>
                    <span className="rounded-full bg-teal-100 p-2 text-teal-600">
                      <Pill className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="text-3xl font-semibold text-teal-900">{summary.medicationTotal}</div>
                    <p className="text-xs text-teal-800/80">{summary.medicationActive} activos, {summary.medicationTotal - summary.medicationActive} suspendidos</p>
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
                         categoryFilter === 'diagnoses' ? 'Historial de Diagnósticos' :
                         categoryFilter === 'prescriptions' ? 'Consultas con recetas' :
                         categoryFilter === 'studies' ? 'Historial de Estudios' :
                         categoryFilter === 'medications' ? 'Medicación habitual' :
                         'Historial de consultas'}
                      </h4>
                      {(categoryFilter === 'prescriptions') && (
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
                            categoryFilter === 'medications' ? 'medicación registrada' : 'elementos'} para este paciente.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {categoryData.type === 'appointments' ? (
                      // Mostrar consultas con detalles colapsables
                      (categoryData.items as Appointment[]).map((appointment) => {
                        const isExpanded = expandedAppointments.has(appointment.id)
                        const hasDetails = (appointment.diagnoses?.length > 0) || (appointment.prescriptions?.length > 0) || (appointment.studyOrders?.length > 0)
                        
                        return (
                          <div key={appointment.id} className="p-6 hover:bg-gray-50">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-sky-100 rounded-full">
                                <Calendar className="h-5 w-5 text-sky-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
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
                                    
                                    {/* Resumen de elementos si están colapsados */}
                                    {!isExpanded && hasDetails && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {appointment.diagnoses?.length > 0 && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                                            <ClipboardCheck className="h-3 w-3 mr-1" />
                                            {appointment.diagnoses.length} diagnóstico{appointment.diagnoses.length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                        {appointment.prescriptions?.length > 0 && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                            <Pill className="h-3 w-3 mr-1" />
                                            {appointment.prescriptions.length} receta{appointment.prescriptions.length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                        {appointment.studyOrders?.length > 0 && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                            <FlaskRound className="h-3 w-3 mr-1" />
                                            {appointment.studyOrders.length} estudio{appointment.studyOrders.length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Botón para expandir/colapsar */}
                                  {hasDetails && (
                                    <button
                                      onClick={() => toggleAppointmentExpansion(appointment.id)}
                                      className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronDown className="h-3 w-3" />
                                          Ocultar detalles
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3" />
                                          Ver detalles
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Detalles expandibles */}
                                {isExpanded && (
                                  <div className="mt-4">
                                    {/* Diagnósticos */}
                                    {appointment.diagnoses?.length > 0 && (
                                      <div className="mb-4 pt-4 border-t border-gray-100">
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
                                      <div className="mb-4 pt-4 border-t border-gray-100">
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
                                      <div className="mb-4 pt-4 border-t border-gray-100">
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
                                                  <div key={item.id} className="text-sm space-y-2">
                                                    <div className="flex justify-between items-start">
                                                      <div className="flex-1">
                                                        <div className="font-medium text-blue-800">{item.estudio}</div>
                                                        {item.indicaciones && (
                                                          <div className="text-blue-700 text-xs mt-1">
                                                            Indicaciones: {item.indicaciones}
                                                          </div>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-2 ml-2">
                                                        <Badge 
                                                          className={
                                                            item.estado === 'COMPLETADO'
                                                              ? 'bg-green-100 text-green-800 text-xs'
                                                              : 'bg-yellow-100 text-yellow-800 text-xs'
                                                          }
                                                        >
                                                          {item.estado === 'COMPLETADO' ? 'Completado' : 'Pendiente'}
                                                        </Badge>
                                                        {item.estado === 'ORDENADO' && (
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedStudyForResult(item)}
                                                            className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-3 py-1.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                                                          >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Cargar resultado
                                                          </Button>
                                                        )}
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Mostrar resultado si existe */}
                                                    {item.result && (
                                                      <div className="bg-white rounded-md p-3 border border-green-200 mt-2">
                                                        <div className="text-xs text-green-700 font-medium mb-2">
                                                          Resultado - {formatDate(item.result.fechaRealizacion)}
                                                          {item.result.laboratorio && ` - ${item.result.laboratorio}`}
                                                        </div>
                                                        <div className="space-y-1">
                                                          {item.result.items.map((resultItem) => (
                                                            <div key={resultItem.id} className="text-xs text-gray-700 flex justify-between items-center">
                                                              <span>{resultItem.parametro}: <strong>{resultItem.valor}</strong> {resultItem.unidad}</span>
                                                              {resultItem.esNormal !== null && (
                                                                <Badge 
                                                                  className={
                                                                    resultItem.esNormal 
                                                                      ? 'bg-green-100 text-green-700 text-xs' 
                                                                      : 'bg-red-100 text-red-700 text-xs'
                                                                  }
                                                                >
                                                                  {resultItem.esNormal ? 'Normal' : 'Alterado'}
                                                                </Badge>
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                        {item.result.observaciones && (
                                                          <div className="text-xs text-gray-600 mt-2 italic">{item.result.observaciones}</div>
                                                        )}
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
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
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
                              <div className="space-y-3">
                                {study.items?.map((item) => (
                                  <div key={item.id} className="text-sm space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="font-medium text-purple-800">{item.estudio}</div>
                                        {item.indicaciones && (
                                          <div className="text-purple-700 text-xs mt-1">
                                            Indicaciones: {item.indicaciones}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 ml-2">
                                        <Badge 
                                          className={
                                            item.estado === 'COMPLETADO'
                                              ? 'bg-green-100 text-green-800 text-xs'
                                              : 'bg-yellow-100 text-yellow-800 text-xs'
                                          }
                                        >
                                          {item.estado === 'COMPLETADO' ? 'Completado' : 'Pendiente'}
                                        </Badge>
                                        {item.estado === 'ORDENADO' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedStudyForResult(item)}
                                            className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-3 py-1.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Cargar resultado
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Mostrar resultado si existe */}
                                    {item.result && (
                                      <div className="bg-white rounded-md p-3 border border-green-200">
                                        <div className="text-xs text-green-700 font-medium mb-2">
                                          Resultado - {formatDate(item.result.fechaRealizacion)}
                                          {item.result.laboratorio && ` - ${item.result.laboratorio}`}
                                        </div>
                                        <div className="space-y-1">
                                          {item.result.items.map((resultItem) => (
                                            <div key={resultItem.id} className="text-xs text-gray-700 flex justify-between items-center">
                                              <span>{resultItem.parametro}: <strong>{resultItem.valor}</strong> {resultItem.unidad}</span>
                                              {resultItem.esNormal !== null && (
                                                <Badge 
                                                  className={
                                                    resultItem.esNormal 
                                                      ? 'bg-green-100 text-green-700 text-xs' 
                                                      : 'bg-red-100 text-red-700 text-xs'
                                                  }
                                                >
                                                  {resultItem.esNormal ? 'Normal' : 'Alterado'}
                                                </Badge>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                        {item.result.observaciones && (
                                          <div className="text-xs text-gray-600 mt-2 italic">{item.result.observaciones}</div>
                                        )}
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
                      // Mostrar medicación habitual
                      (categoryData.items as Medication[]).map((medication) => (
                        <div key={medication.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-teal-100 rounded-full">
                              <Pill className="h-5 w-5 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="text-base font-semibold text-gray-900">{medication.nombre || 'Medicamento sin nombre'}</h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  medication.activo 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {medication.activo ? 'Activo' : 'Suspendido'}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {medication.dosis && (
                                  <div><span className="font-medium">Dosis:</span> {medication.dosis}</div>
                                )}
                                {medication.frecuencia && (
                                  <div><span className="font-medium">Frecuencia:</span> {medication.frecuencia}</div>
                                )}
                                {medication.indicaciones && (
                                  <div><span className="font-medium">Indicaciones:</span> {medication.indicaciones}</div>
                                )}
                                {medication.fechaInicio && (
                                  <div><span className="font-medium">Inicio:</span> {new Date(medication.fechaInicio).toLocaleDateString('es-ES')}</div>
                                )}
                                {medication.fechaFin && (
                                  <div><span className="font-medium">Fin:</span> {new Date(medication.fechaFin).toLocaleDateString('es-ES')}</div>
                                )}
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
                        : `Mostrando ${Math.min(getCategoryPageSize(categoryFilter), categoryData.total)} de ${categoryData.total} elemento${categoryData.total !== 1 ? 's' : ''}`
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
                    ) : categoryFilter !== 'all' && Math.ceil(categoryData.total / getCategoryPageSize(categoryFilter)) > 1 ? (
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
                          Página {categoryPage} de {Math.ceil(categoryData.total / getCategoryPageSize(categoryFilter))}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={categoryPage >= Math.ceil(categoryData.total / getCategoryPageSize(categoryFilter))}
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
  }, [selectedPatient, handleBackToSearch, feedback, filters, summary, loadingHistory, categoryData, totalPages, page, handlePageChange, fetchHistory, categoryFilter, handleCategoryChange, categoryPage, expandedAppointments, toggleAppointmentExpansion])

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
            <p className="text-sm text-gray-500 max-w-2xl mx-auto mt-2">Ejemplos: &quot;Ana Lopez&quot;, &quot;Lopez Ana&quot;, &quot;Lopez, Ana&quot;, &quot;45&quot; (DNI que empiece con 45)</p>
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
  return (
    <>
      <HistoryView />
      
      {/* Modal para cargar resultados */}
      {selectedStudyForResult && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setSelectedStudyForResult(null)}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-3xl flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Cargar resultado
                </h3>
                <p className="text-sm text-emerald-700 font-medium">{selectedStudyForResult.estudio}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedStudyForResult(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full h-8 w-8 p-0"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleStudyResultSubmit} className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Fecha de realización *</label>
                  <input
                    type="date"
                    value={studyResultForm.fechaRealizacion}
                    onChange={(e) => setStudyResultForm(prev => ({ ...prev, fechaRealizacion: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Laboratorio/Centro</label>
                  <input
                    type="text"
                    value={studyResultForm.laboratorio}
                    onChange={(e) => setStudyResultForm(prev => ({ ...prev, laboratorio: e.target.value }))}
                    placeholder="Ej. Laboratorio Central"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Observaciones generales</label>
                <textarea
                  value={studyResultForm.observaciones}
                  onChange={(e) => setStudyResultForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Observaciones del médico o técnico..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Resultados *</label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStudyResultForm(prev => ({
                      ...prev,
                      items: [...prev.items, { parametro: '', valor: '', unidad: '', valorReferencia: '', esNormal: null }]
                    }))}
                    size="sm"
                    className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar resultado
                  </Button>
                </div>

                <div className="space-y-3">
                  {studyResultForm.items.map((item, index) => (
                    <div key={index} className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl p-6 space-y-4 border border-emerald-100 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">Resultado {index + 1}</span>
                        {studyResultForm.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setStudyResultForm(prev => ({
                              ...prev,
                              items: prev.items.filter((_, i) => i !== index)
                            }))}
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-700">Parámetro *</label>
                          <input
                            type="text"
                            value={item.parametro}
                            onChange={(e) => {
                              const newItems = [...studyResultForm.items]
                              newItems[index] = { ...newItems[index], parametro: e.target.value }
                              setStudyResultForm(prev => ({ ...prev, items: newItems }))
                            }}
                            placeholder="Ej. Hemoglobina, Glucosa"
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-700">Valor *</label>
                          <input
                            type="text"
                            value={item.valor}
                            onChange={(e) => {
                              const newItems = [...studyResultForm.items]
                              newItems[index] = { ...newItems[index], valor: e.target.value }
                              setStudyResultForm(prev => ({ ...prev, items: newItems }))
                            }}
                            placeholder="Ej. 12.5, Negativo"
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-700">Unidad</label>
                          <input
                            type="text"
                            value={item.unidad || ''}
                            onChange={(e) => {
                              const newItems = [...studyResultForm.items]
                              newItems[index] = { ...newItems[index], unidad: e.target.value }
                              setStudyResultForm(prev => ({ ...prev, items: newItems }))
                            }}
                            placeholder="Ej. mg/dl, g/dl"
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-700">Valor de referencia</label>
                          <input
                            type="text"
                            value={item.valorReferencia || ''}
                            onChange={(e) => {
                              const newItems = [...studyResultForm.items]
                              newItems[index] = { ...newItems[index], valorReferencia: e.target.value }
                              setStudyResultForm(prev => ({ ...prev, items: newItems }))
                            }}
                            placeholder="Ej. 12-15 mg/dl"
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-700">Estado</label>
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`esNormal-${index}`}
                              checked={item.esNormal === true}
                              onChange={() => {
                                const newItems = [...studyResultForm.items]
                                newItems[index] = { ...newItems[index], esNormal: true }
                                setStudyResultForm(prev => ({ ...prev, items: newItems }))
                              }}
                              className="mr-2 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">Normal</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`esNormal-${index}`}
                              checked={item.esNormal === false}
                              onChange={() => {
                                const newItems = [...studyResultForm.items]
                                newItems[index] = { ...newItems[index], esNormal: false }
                                setStudyResultForm(prev => ({ ...prev, items: newItems }))
                              }}
                              className="mr-2 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-red-700 bg-red-100 px-2 py-1 rounded-lg">Alterado</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`esNormal-${index}`}
                              checked={item.esNormal === null}
                              onChange={() => {
                                const newItems = [...studyResultForm.items]
                                newItems[index] = { ...newItems[index], esNormal: null }
                                setStudyResultForm(prev => ({ ...prev, items: newItems }))
                              }}
                              className="mr-2 text-gray-600 focus:ring-gray-500"
                            />
                            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">No especificado</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-emerald-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedStudyForResult(null)}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-6 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={studyResultLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
                >
                  {studyResultLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Guardar resultado
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
