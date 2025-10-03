'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AppointmentStatus } from '@prisma/client'
import { addDays, startOfDay } from 'date-fns'
import { Calendar, Clock, ChevronRight, Search, Loader2, AlertCircle, CheckCircle2, Pill, FlaskRound, ClipboardList, Stethoscope, Plus, RefreshCw, X, FileText } from 'lucide-react'
import { MEDICATIONS_CATALOG, STUDIES_CATALOG } from '@/data/medical-catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatePicker } from '@/components/ui/date-picker'
import { APPOINTMENT_STATUS_META, getStatusLabel } from '@/lib/appointment-status'

interface Diagnosis {
  id: string
  appointmentId: string
  patientId: string
  professionalId: string
  principal: string
  secundarios: string[]
  notas: string | null
  createdAt: string
  updatedAt: string
}

interface PrescriptionItem {
  id: string
  prescriptionId: string
  medicamento: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones: string | null
}

interface PrescriptionDiagnosisLink {
  id: string
  diagnosisId: string
  diagnosis: Diagnosis
}

interface Prescription {
  id: string
  appointmentId: string
  patientId: string
  professionalId: string
  notas: string | null
  createdAt: string
  updatedAt: string
  items: PrescriptionItem[]
  diagnoses: PrescriptionDiagnosisLink[]
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
  orderId: string
  estudio: string
  indicaciones: string | null
  estado: StudyStatus
  result: StudyResult | null
}

interface StudyOrder {
  id: string
  appointmentId: string
  patientId: string
  professionalId: string
  notas: string | null
  createdAt: string
  updatedAt: string
  items: StudyOrderItem[]
}

interface PatientSummary {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string
  genero: string
  telefono?: string | null
  celular?: string | null
  email?: string | null
}

interface Appointment {
  id: string
  fecha: string
  duracion: number
  motivo: string | null
  observaciones: string | null
  estado: AppointmentStatus
  obraSocial?: {
    id: string
    nombre: string
  } | null
  paciente: PatientSummary
  diagnoses: Diagnosis[]
  prescriptions: Prescription[]
  studyOrders: StudyOrder[]
}

interface PatientMedication {
  id: string
  patientId: string
  professionalId: string
  nombre: string
  dosis: string | null
  frecuencia: string | null
  viaAdministracion: string | null
  fechaInicio: string | null
  fechaFin: string | null
  indicaciones: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
} | null

const emptyDiagnosisForm = {
  principal: '',
  secundarios: '',
  notas: '',
}

const emptyMedicationForm = {
  medicamento: '',
  dosis: '',
  frecuencia: '',
  duracion: '',
  indicaciones: '',
}

const emptyStudyForm = {
  estudio: '',
  indicaciones: '',
}

const emptyPatientMedicationForm = {
  nombre: '',
  dosis: '',
  frecuencia: '',
  viaAdministracion: '',
  fechaInicio: '',
  indicaciones: '',
}

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

const formatToInputDate = (date: Date) => date.toISOString().split('T')[0]

const formatDisplayDate = (date?: Date) => (date ? date.toLocaleDateString('es-AR') : '')

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return '-'
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return '-'
  const diff = Date.now() - date.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

const normalizeSecondaries = (value: string) => {
  return value
    .split(/[\n;,]+/)
    .map((item) => item.trim())
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)
}

const filterCatalog = (items: string[], term: string) => {
  if (!term) return items.slice(0, 8)
  const lower = term.toLowerCase()
  return items
    .filter((item) => item.toLowerCase().includes(lower))
    .slice(0, 8)
}

// Componente de paginación pequeño para las secciones
interface MiniPaginationProps {
  currentPage: number
  totalItems: number  
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

const MiniPagination = ({ currentPage, totalItems, itemsPerPage, onPageChange, className = '' }: MiniPaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  if (totalPages <= 1) return null
  
  return (
    <div className={`flex items-center gap-2 text-xs bg-gray-50 rounded-md px-2 py-1 ${className}`}>
      <span className="text-gray-600 font-medium">
        {totalItems > 0 ? currentPage : 0} de {totalPages}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-800 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          type="button"
          aria-label="Página anterior"
        >
          ←
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-800 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          type="button"
          aria-label="Página siguiente"
        >
          →
        </button>
      </div>
    </div>
  )
}

const Tabs = ['diagnosticos', 'prescripciones', 'estudios', 'medicaciones'] as const
const DEFAULT_PAGE_SIZE = 20

export default function ConsultasContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(DEFAULT_PAGE_SIZE)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  // Rango inicial: desde el día anterior hasta 8 días después
  const initialDateFrom = useMemo(() => startOfDay(addDays(new Date(), -1)), [])
  const initialDateTo = useMemo(() => startOfDay(addDays(new Date(), 8)), [])
  const [filters, setFilters] = useState({
    dateFrom: initialDateFrom as Date | undefined,
    dateTo: initialDateTo as Date | undefined,
    status: '',
    patient: '',
  })
  // Permitir que un patientId pasado en la URL inicialice el filtro.
  const [patientFilterId, setPatientFilterId] = useState<string | null>(() => {
    const pid = searchParams.get('patientId')
    return pid || null
  })
  const [patientSuggestions, setPatientSuggestions] = useState<PatientSummary[]>([])
  const [isFetchingPatientSuggestions, setIsFetchingPatientSuggestions] = useState(false)
  const [skipPatientSuggestionFetch, setSkipPatientSuggestionFetch] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(() => searchParams.get('appointmentId'))
  const [activeTab, setActiveTab] = useState<(typeof Tabs)[number]>('diagnosticos')
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const [diagnosisForm, setDiagnosisForm] = useState(emptyDiagnosisForm)
  const [diagnosisLoading, setDiagnosisLoading] = useState(false)

  const [prescriptionItems, setPrescriptionItems] = useState([emptyMedicationForm])
  const [selectedDiagnosisIds, setSelectedDiagnosisIds] = useState<string[]>([])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [prescriptionLoading, setPrescriptionLoading] = useState(false)

  const [studyItems, setStudyItems] = useState([emptyStudyForm])
  const [studyNotes, setStudyNotes] = useState('')
  const [studyLoading, setStudyLoading] = useState(false)

  // Estados para resultados de estudios
  const [selectedStudyForResult, setSelectedStudyForResult] = useState<StudyOrderItem | null>(null)
  const [studyResultForm, setStudyResultForm] = useState({
    fechaRealizacion: '',
    laboratorio: '',
    observaciones: '',
    items: [{ parametro: '', valor: '', unidad: '', valorReferencia: '', esNormal: null as boolean | null }]
  })
  const [studyResultLoading, setStudyResultLoading] = useState(false)

  const [patientMedications, setPatientMedications] = useState<PatientMedication[]>([])
  const [patientMedicationsLoading, setPatientMedicationsLoading] = useState(false)
  const [patientMedicationForm, setPatientMedicationForm] = useState(emptyPatientMedicationForm)
  const [patientMedicationLoading, setPatientMedicationLoading] = useState(false)

  // Estados de paginación independientes
  const [diagnosesPage, setDiagnosesPage] = useState(1)
  const [prescriptionsPage, setPrescriptionsPage] = useState(1)
  const [studyOrdersPage, setStudyOrdersPage] = useState(1)
  const [medicationsPage, setMedicationsPage] = useState(1)
  const itemsPerPage = 1 // 1 elemento por página según requerimiento

  const [refreshTicker, setRefreshTicker] = useState(0)

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  )

  const totalPages = Math.max(1, Math.ceil(totalAppointments / pageSize))
  const startItem = totalAppointments === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = totalAppointments === 0 ? 0 : Math.min(totalAppointments, startItem + appointments.length - 1)
  const currentYear = new Date().getFullYear()

  const singleFetchTriedRef = useRef(false)
  const justClearedPatientFilterRef = useRef(false)

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true)
      const params = new URLSearchParams()
      if (filters.dateFrom) params.set('dateFrom', formatToInputDate(filters.dateFrom))
      if (filters.dateTo) params.set('dateTo', formatToInputDate(filters.dateTo))
      if (filters.status) params.set('status', filters.status as AppointmentStatus)
      if (patientFilterId) params.set('patientId', patientFilterId)
      else if (filters.patient) {
        params.set('patient', filters.patient)
        // provide normalized version (strip diacritics) for future API support
        const norm = filters.patient.normalize('NFD').replace(/\p{Diacritic}/gu, '')
        params.set('patientNorm', norm)
      }
      params.set('onlyMine', 'true')
      params.set('limit', String(pageSize))
      params.set('page', String(page))

      const response = await fetch(`/api/professional/appointments?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las consultas')

      // Utilidad para eliminar duplicados por id
      const dedupe = (list: Appointment[]) => {
        const seen = new Set<string>()
        const result: Appointment[] = []
        for (const a of list) {
          if (!seen.has(a.id)) {
            seen.add(a.id)
            result.push(a)
          }
        }
        return result
      }

      setAppointments(dedupe(data.appointments))

      // Si tenemos un patientFilterId pero el input de paciente está vacío, intentar poblarlo con el nombre del paciente (primer turno coincidente)
      // Eliminado autopopulate para evitar re-fetch y necesidad de doble click en limpiar.
      setTotalAppointments(data.total)

      const qId = searchParams.get('appointmentId')
      if (qId) {
        // Keep existing behavior: try to select requested appointmentId (fetch individually if needed)
        if (data.appointments.some((a: Appointment) => a.id === qId)) {
          setSelectedAppointmentId(qId)
        } else if (!singleFetchTriedRef.current) {
          singleFetchTriedRef.current = true
          try {
            const res = await fetch(`/api/professional/appointments/${qId}`)
            const single = await res.json()
            if (res.ok && single?.appointment) {
              setAppointments((prev) => {
                // Evitar duplicar si ya existe
                if (prev.some((a) => a.id === single.appointment.id)) return prev
                return [single.appointment, ...prev]
              })
              setSelectedAppointmentId(qId)
            }
          } catch {/* ignore */}
        }
      } else {
        // New behavior: do NOT auto-select the first appointment when landing without appointmentId.
        // Preserve previous selection if it still exists; otherwise clear selection.
        setSelectedAppointmentId((prev) => (prev && data.appointments.some((a: Appointment) => a.id === prev) ? prev : null))
      }
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al cargar las consultas' })
    } finally {
      setLoadingAppointments(false)
    }
  }

  useEffect(() => {
    loadAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateFrom, filters.dateTo, filters.status, filters.patient, patientFilterId, refreshTicker, page, pageSize])

  // Si cambia el patientId en la URL y no coincide con el estado local, sincronizar.
  useEffect(() => {
    const pid = searchParams.get('patientId')
    if (pid && pid !== patientFilterId && !justClearedPatientFilterRef.current) {
      setPatientFilterId(pid)
      // reset page when patient changes
      setPage(1)
    } else if (!pid && patientFilterId) {
      // Si ya no está en URL y el estado lo conserva, limpiarlo.
      setPatientFilterId(null)
    }
    if (!pid) justClearedPatientFilterRef.current = false
  }, [searchParams, patientFilterId])

  // (Removed separate preselection effect; logic handled in loadAppointments)

  // Keep URL in sync when selection changes (replace state without full navigation)
  useEffect(() => {
    if (!selectedAppointmentId) return
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (params.get('appointmentId') !== selectedAppointmentId) {
      params.set('appointmentId', selectedAppointmentId)
      router.replace(`/profesional/consultas?${params.toString()}`)
    }
  }, [selectedAppointmentId, searchParams, router])

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(totalAppointments / pageSize))
    if (page > newTotalPages) {
      setPage(newTotalPages)
    }
  }, [page, pageSize, totalAppointments])

  useEffect(() => {
    if (skipPatientSuggestionFetch) {
      setSkipPatientSuggestionFetch(false)
      setPatientSuggestions([])
      setIsFetchingPatientSuggestions(false)
      return
    }

    const term = filters.patient.trim()
    if (term.length < 2) {
      setPatientSuggestions([])
      setIsFetchingPatientSuggestions(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        setIsFetchingPatientSuggestions(true)
        const response = await fetch(`/api/professional/patients/search?term=${encodeURIComponent(term)}&limit=6`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo obtener el listado de pacientes')
        }
        setPatientSuggestions(data.patients)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error(error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingPatientSuggestions(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [filters.patient, skipPatientSuggestionFetch])

  useEffect(() => {
    if (!selectedAppointment?.paciente.id) {
      setPatientMedications([])
      return
    }

    const fetchMedications = async () => {
      try {
        setPatientMedicationsLoading(true)
        const response = await fetch(`/api/professional/patient-medications?patientId=${selectedAppointment.paciente.id}`)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo obtener la medicación habitual')
        }
        setPatientMedications(data.medications)
      } catch (error) {
        console.error(error)
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al cargar la medicación del paciente' })
      } finally {
        setPatientMedicationsLoading(false)
      }
    }

    fetchMedications()
  }, [selectedAppointment?.paciente.id])

  const handleSelectAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId)
    setActiveTab('diagnosticos')
    setSelectedDiagnosisIds([])
    setPrescriptionItems([emptyMedicationForm])
    setPrescriptionNotes('')
    setStudyItems([emptyStudyForm])
    setStudyNotes('')
    setFeedback(null)
    // Resetear todas las paginaciones al cambiar de turno
    setDiagnosesPage(1)
    setPrescriptionsPage(1)
    setStudyOrdersPage(1)
    setMedicationsPage(1)
  }

  const resetToFirstPage = () => {
    setPage(1)
  }

  const handleQuickDateRange = (range: 'today' | 'tomorrow' | 'next7' | 'month') => {
    const today = startOfDay(new Date())
    let from = today
    let to = today

    switch (range) {
      case 'tomorrow':
        from = startOfDay(addDays(today, 1))
        to = from
        break
      case 'next7':
        to = startOfDay(addDays(today, 6))
        break
      case 'month':
        from = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1))
        to = startOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
        break
      case 'today':
      default:
        break
    }

    resetToFirstPage()
    setFilters((prev) => ({
      ...prev,
      dateFrom: from,
      dateTo: to,
    }))
  }

  const handleDiagnosisSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAppointment) return

    const principal = diagnosisForm.principal.trim()
    if (!principal) {
      setFeedback({ type: 'error', message: 'El diagnóstico principal es obligatorio' })
      return
    }

    try {
      setDiagnosisLoading(true)
      const response = await fetch('/api/professional/diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          principal,
          secundarios: normalizeSecondaries(diagnosisForm.secundarios),
          notas: diagnosisForm.notas.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar el diagnóstico')
      }

      setAppointments((prev) => prev.map((appointment) => (
        appointment.id === selectedAppointment.id
          ? { ...appointment, diagnoses: [data.diagnosis, ...appointment.diagnoses] }
          : appointment
      )))

      setDiagnosisForm(emptyDiagnosisForm)
      setSelectedDiagnosisIds((prev) => [data.diagnosis.id, ...prev])
      setFeedback({ type: 'success', message: data.message })
      // Navegar a la primera página donde está el nuevo diagnóstico
      setDiagnosesPage(1)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al registrar el diagnóstico' })
    } finally {
      setDiagnosisLoading(false)
    }
  }

  const handlePrescriptionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAppointment) return

    const validItems = prescriptionItems
      .map((item) => ({
        medicamento: item.medicamento.trim(),
        dosis: item.dosis.trim(),
        frecuencia: item.frecuencia.trim(),
        duracion: item.duracion.trim(),
        indicaciones: item.indicaciones.trim(),
      }))
      .filter((item) => item.medicamento && item.dosis && item.frecuencia && item.duracion)

    if (validItems.length === 0) {
      setFeedback({ type: 'error', message: 'Debe agregar al menos un medicamento con dosis, frecuencia y duración' })
      return
    }

    if (selectedDiagnosisIds.length === 0) {
      setFeedback({ type: 'error', message: 'Seleccione al menos un diagnóstico asociado a la receta' })
      return
    }

    try {
      setPrescriptionLoading(true)
      const response = await fetch('/api/professional/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          diagnosisIds: selectedDiagnosisIds,
          items: validItems,
          notas: prescriptionNotes.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar la receta')
      }

      setAppointments((prev) => prev.map((appointment) => (
        appointment.id === selectedAppointment.id
          ? { ...appointment, prescriptions: [data.prescription, ...appointment.prescriptions] }
          : appointment
      )))

      setPrescriptionItems([emptyMedicationForm])
      setPrescriptionNotes('')
      setFeedback({ type: 'success', message: data.message })
      // Navegar a la primera página donde está la nueva receta
      setPrescriptionsPage(1)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al registrar la receta' })
    } finally {
      setPrescriptionLoading(false)
    }
  }

  const handleStudySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAppointment) return

    const validStudies = studyItems
      .map((item) => ({
        estudio: item.estudio.trim(),
        indicaciones: item.indicaciones.trim(),
      }))
      .filter((item) => item.estudio)

    if (validStudies.length === 0) {
      setFeedback({ type: 'error', message: 'Seleccione al menos un estudio para registrar la orden' })
      return
    }

    try {
      setStudyLoading(true)
      const response = await fetch('/api/professional/study-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          estudios: validStudies,
          notas: studyNotes.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar la orden de estudios')
      }

      setAppointments((prev) => prev.map((appointment) => (
        appointment.id === selectedAppointment.id
          ? { ...appointment, studyOrders: [data.studyOrder, ...appointment.studyOrders] }
          : appointment
      )))

      setStudyItems([emptyStudyForm])
      setStudyNotes('')
      setFeedback({ type: 'success', message: data.message })
      // Navegar a la primera página donde está la nueva orden
      setStudyOrdersPage(1)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al registrar la orden de estudios' })
    } finally {
      setStudyLoading(false)
    }
  }

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

      // Actualizar el appointment con el nuevo resultado
      setAppointments(prev => prev.map(appointment => {
        if (appointment.id === selectedAppointment?.id) {
          return {
            ...appointment,
            studyOrders: appointment.studyOrders.map(order => ({
              ...order,
              items: order.items.map(item => 
                item.id === selectedStudyForResult.id
                  ? { ...item, estado: 'COMPLETADO' as StudyStatus, result: data.studyResult }
                  : item
              )
            }))
          }
        }
        return appointment
      }))

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

  const handleMedicationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAppointment) return

    const nombre = patientMedicationForm.nombre.trim()
    if (!nombre) {
      setFeedback({ type: 'error', message: 'El nombre del medicamento habitual es obligatorio' })
      return
    }

    try {
      setPatientMedicationLoading(true)
      const response = await fetch('/api/professional/patient-medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedAppointment.paciente.id,
          nombre,
          dosis: patientMedicationForm.dosis.trim() || undefined,
          frecuencia: patientMedicationForm.frecuencia.trim() || undefined,
          viaAdministracion: patientMedicationForm.viaAdministracion.trim() || undefined,
          fechaInicio: patientMedicationForm.fechaInicio || undefined,
          indicaciones: patientMedicationForm.indicaciones.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar la medicación habitual')
      }

      setPatientMedications((prev) => [data.medication, ...prev])
      setPatientMedicationForm(emptyPatientMedicationForm)
      setFeedback({ type: 'success', message: data.message })
      // Navegar a la primera página donde está la nueva medicación
      setMedicationsPage(1)
    } catch (error) {
      console.error(error)
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Error al registrar la medicación habitual' })
    } finally {
      setPatientMedicationLoading(false)
    }
  }

  const handleAddPrescriptionItem = () => {
    setPrescriptionItems((prev) => [...prev, emptyMedicationForm])
  }

  const handleRemovePrescriptionItem = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleAddStudyItem = () => {
    setStudyItems((prev) => [...prev, emptyStudyForm])
  }

  const handleRemoveStudyItem = (index: number) => {
    setStudyItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const toggleDiagnosisSelection = (diagnosisId: string) => {
    setSelectedDiagnosisIds((prev) => (
      prev.includes(diagnosisId)
        ? prev.filter((id) => id !== diagnosisId)
        : [...prev, diagnosisId]
    ))
  }

  const renderActiveTabContent = () => {
    if (!selectedAppointment) {
      return null
    }

    if (activeTab === 'diagnosticos') {
      return (
        <div className="space-y-6">
          <form onSubmit={handleDiagnosisSubmit} className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Registrar diagnóstico</h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Diagnóstico principal *</label>
              <textarea
                value={diagnosisForm.principal}
                onChange={(event) => setDiagnosisForm((prev) => ({ ...prev, principal: event.target.value }))}
                className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Describe el diagnóstico principal del turno"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Diagnósticos secundarios</label>
              <textarea
                value={diagnosisForm.secundarios}
                onChange={(event) => setDiagnosisForm((prev) => ({ ...prev, secundarios: event.target.value }))}
                className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                placeholder="Separar por coma o nueva línea"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notas</label>
              <textarea
                value={diagnosisForm.notas}
                onChange={(event) => setDiagnosisForm((prev) => ({ ...prev, notas: event.target.value }))}
                className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                placeholder="Observaciones adicionales"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={diagnosisLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {diagnosisLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar diagnóstico'
                )}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm shadow-sm">
            <div className="px-6 py-4 border-b border-emerald-200/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Diagnósticos registrados</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{selectedAppointment.diagnoses.length} registro(s)</span>
                <MiniPagination
                  currentPage={diagnosesPage}
                  totalItems={selectedAppointment.diagnoses.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setDiagnosesPage}
                />
              </div>
            </div>
            {selectedAppointment.diagnoses.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                Aún no se cargaron diagnósticos para este turno
              </div>
            ) : (
              <div className="divide-y">
                {selectedAppointment.diagnoses
                  .slice((diagnosesPage - 1) * itemsPerPage, diagnosesPage * itemsPerPage)
                  .map((diagnosis) => (
                    <div key={diagnosis.id} className="px-5 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">{diagnosis.principal}</div>
                          {diagnosis.secundarios?.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium text-gray-700">Secundarios:</span> {diagnosis.secundarios.join('; ')}
                            </div>
                          )}
                          {diagnosis.notas && (
                            <div className="mt-2 text-sm text-gray-600">{diagnosis.notas}</div>
                          )}
                        </div>
                        <Badge className="bg-gray-100 text-gray-700">{formatDate(diagnosis.createdAt)}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (activeTab === 'prescripciones') {
      const diagnosisList = selectedAppointment.diagnoses

      return (
        <div className="space-y-6">
          <form onSubmit={handlePrescriptionSubmit} className="rounded-2xl border border-sky-200 bg-white p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-sky-600" />
              <h3 className="text-lg font-semibold text-gray-900">Nueva receta</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Diagnósticos asociados *</label>
                {diagnosisList.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">Registre al menos un diagnóstico antes de emitir la receta.</p>
                ) : (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {diagnosisList.map((diagnosis) => (
                      <label key={diagnosis.id} className="flex items-start gap-3 border rounded-lg p-3 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedDiagnosisIds.includes(diagnosis.id)}
                          onChange={() => toggleDiagnosisSelection(diagnosis.id)}
                        />
                        <span>
                          <span className="font-medium text-gray-900">{diagnosis.principal}</span>
                          {diagnosis.secundarios.length > 0 && (
                            <span className="block text-gray-500">Secundarios: {diagnosis.secundarios.join('; ')}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {prescriptionItems.map((item, index) => {
                  const medicationSuggestions = filterCatalog(MEDICATIONS_CATALOG, item.medicamento)
                  return (
                    <div key={index} className="border border-sky-200 rounded-xl p-4 bg-sky-50/40">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-sky-700">Medicamento #{index + 1}</span>
                        {prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            className="text-sm text-red-500 hover:text-red-600"
                            onClick={() => handleRemovePrescriptionItem(index)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Fármaco *</label>
                          <input
                            list={`medication-suggestions-${index}`}
                            value={item.medicamento}
                            onChange={(event) => {
                              const value = event.target.value
                              setPrescriptionItems((prev) => prev.map((current, idx) => (
                                idx === index ? { ...current, medicamento: value } : current
                              )))
                            }}
                            placeholder="Ej. Paracetamol 500 mg"
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                          />
                          <datalist id={`medication-suggestions-${index}`}>
                            {medicationSuggestions.map((suggestion) => (
                              <option key={suggestion} value={suggestion} />
                            ))}
                          </datalist>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Dosis *</label>
                          <input
                            value={item.dosis}
                            onChange={(event) => setPrescriptionItems((prev) => prev.map((current, idx) => (
                              idx === index ? { ...current, dosis: event.target.value } : current
                            )))}
                            placeholder="Ej. 1 comprimido"
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Frecuencia *</label>
                          <input
                            value={item.frecuencia}
                            onChange={(event) => setPrescriptionItems((prev) => prev.map((current, idx) => (
                              idx === index ? { ...current, frecuencia: event.target.value } : current
                            )))}
                            placeholder="Ej. cada 8 horas"
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Duración *</label>
                          <input
                            value={item.duracion}
                            onChange={(event) => setPrescriptionItems((prev) => prev.map((current, idx) => (
                              idx === index ? { ...current, duracion: event.target.value } : current
                            )))}
                            placeholder="Ej. 5 días"
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Indicaciones</label>
                        <textarea
                          value={item.indicaciones}
                          onChange={(event) => setPrescriptionItems((prev) => prev.map((current, idx) => (
                            idx === index ? { ...current, indicaciones: event.target.value } : current
                          )))}
                          className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          rows={2}
                          placeholder="Indicaciones adicionales para el paciente"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button type="button" variant="outline" onClick={handleAddPrescriptionItem} className="border-sky-300 text-sky-700">
                <Plus className="h-4 w-4 mr-2" /> Agregar medicamento
              </Button>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Indicaciones generales</label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(event) => setPrescriptionNotes(event.target.value)}
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  rows={2}
                  placeholder="Recomendaciones generales, controles, etc."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={prescriptionLoading || diagnosisList.length === 0} className="bg-sky-600 hover:bg-sky-700">
                {prescriptionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar receta'
                )}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm shadow-sm">
            <div className="px-6 py-4 border-b border-emerald-200/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recetas generadas</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{selectedAppointment.prescriptions.length} registro(s)</span>
                <MiniPagination
                  currentPage={prescriptionsPage}
                  totalItems={selectedAppointment.prescriptions.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setPrescriptionsPage}
                />
              </div>
            </div>
            {selectedAppointment.prescriptions.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                Aún no se registraron recetas para este turno
              </div>
            ) : (
              <div className="divide-y">
                {selectedAppointment.prescriptions
                  .slice((prescriptionsPage - 1) * itemsPerPage, prescriptionsPage * itemsPerPage)
                  .map((prescription) => (
                    <div key={prescription.id} className="px-5 py-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm text-gray-600">Emitida el {formatDate(prescription.createdAt)}</div>
                          {prescription.diagnoses.length > 0 && (
                            <div className="mt-1 text-sm text-gray-700">
                              <span className="font-medium text-gray-800">Diagnósticos:</span> {prescription.diagnoses.map((link) => link.diagnosis.principal).join('; ')}
                            </div>
                          )}
                        </div>
                        <Badge className="bg-sky-100 text-sky-700">{prescription.items.length} medicamento(s)</Badge>
                      </div>
                      <div className="bg-sky-50 rounded-lg p-4 space-y-2">
                        {prescription.items.map((item) => (
                          <div key={item.id} className="text-sm text-gray-700">
                            <div className="font-semibold text-gray-900">{item.medicamento}</div>
                            <div>Dosis: {item.dosis} • Frecuencia: {item.frecuencia} • Duración: {item.duracion}</div>
                            {item.indicaciones && <div className="text-gray-600 mt-1">{item.indicaciones}</div>}
                          </div>
                        ))}
                      </div>
                      {prescription.notas && (
                        <div className="text-sm text-gray-600 bg-sky-50 rounded-md p-3">{prescription.notas}</div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (activeTab === 'estudios') {
      return (
        <div className="space-y-6">
          <form onSubmit={handleStudySubmit} className="rounded-2xl border border-orange-200 bg-white p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FlaskRound className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Orden de estudios</h3>
            </div>

            <div className="space-y-4">
              {studyItems.map((item, index) => {
                const studySuggestions = filterCatalog(STUDIES_CATALOG, item.estudio)
                return (
                  <div key={index} className="border border-orange-200 rounded-xl p-4 bg-orange-50/40">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-orange-700">Estudio #{index + 1}</span>
                      {studyItems.length > 1 && (
                        <button
                          type="button"
                          className="text-sm text-red-500 hover:text-red-600"
                          onClick={() => handleRemoveStudyItem(index)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Estudio *</label>
                      <input
                        list={`study-suggestions-${index}`}
                        value={item.estudio}
                        onChange={(event) => setStudyItems((prev) => prev.map((current, idx) => (
                          idx === index ? { ...current, estudio: event.target.value } : current
                        )))}
                        placeholder="Ej. Hemograma completo"
                        className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                      <datalist id={`study-suggestions-${index}`}>
                        {studySuggestions.map((suggestion) => (
                          <option key={suggestion} value={suggestion} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-2 mt-3">
                      <label className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Indicaciones</label>
                      <textarea
                        value={item.indicaciones}
                        onChange={(event) => setStudyItems((prev) => prev.map((current, idx) => (
                          idx === index ? { ...current, indicaciones: event.target.value } : current
                        )))}
                        className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={2}
                        placeholder="Indicaciones para el laboratorio o el paciente"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <Button type="button" variant="outline" onClick={handleAddStudyItem} className="border-orange-300 text-orange-700">
              <Plus className="h-4 w-4 mr-2" /> Agregar estudio
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notas para la orden</label>
              <textarea
                value={studyNotes}
                onChange={(event) => setStudyNotes(event.target.value)}
                className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
                placeholder="Indicaciones generales, urgencia, etc."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={studyLoading} className="bg-orange-600 hover:bg-orange-700">
                {studyLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar orden'
                )}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm shadow-sm">
            <div className="px-6 py-4 border-b border-emerald-200/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Órdenes registradas</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{selectedAppointment.studyOrders.length} registro(s)</span>
                <MiniPagination
                  currentPage={studyOrdersPage}
                  totalItems={selectedAppointment.studyOrders.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setStudyOrdersPage}
                />
              </div>
            </div>
            {selectedAppointment.studyOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                Aún no se registraron órdenes de estudio para este turno
              </div>
            ) : (
              <div className="divide-y">
                {selectedAppointment.studyOrders
                  .slice((studyOrdersPage - 1) * itemsPerPage, studyOrdersPage * itemsPerPage)
                  .map((order) => (
                  <div key={order.id} className="px-5 py-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-600">Emitida el {formatDate(order.createdAt)}</div>
                      <Badge className="bg-orange-100 text-orange-700">{order.items.length} estudio(s)</Badge>
                    </div>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="bg-orange-50 rounded-md p-3 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-gray-900">{item.estudio}</div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={
                                  item.estado === 'COMPLETADO'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {item.estado === 'COMPLETADO' ? 'Completado' : 'Pendiente'}
                              </Badge>
                              {item.estado === 'ORDENADO' && (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedStudyForResult(item)}
                                  className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Cargar resultado
                                </Button>
                              )}
                            </div>
                          </div>
                          {item.indicaciones && <div className="text-gray-600 mt-1">{item.indicaciones}</div>}
                          
                          {/* Mostrar resultado si existe */}
                          {item.result && (
                            <div className="mt-3 bg-white rounded-md p-3 border border-green-200">
                              <div className="text-xs text-green-700 font-medium mb-2">
                                Resultado - {formatDate(item.result.fechaRealizacion)}
                                {item.result.laboratorio && ` - ${item.result.laboratorio}`}
                              </div>
                              <div className="space-y-1">
                                {item.result.items.map((resultItem) => (
                                  <div key={resultItem.id} className="text-xs text-gray-700 flex justify-between">
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
                        </li>
                      ))}
                    </ul>
                    {order.notas && (
                      <div className="text-sm text-gray-600 bg-orange-50 rounded-md p-3">{order.notas}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal para cargar resultados */}
          {selectedStudyForResult && (
            <div 
              className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedStudyForResult(null)
                }
              }}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-100">
                <div className="px-6 py-5 border-b bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl flex items-center justify-between">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Cargar resultado: {selectedStudyForResult.estudio}
                  </h3>
                  <Button
                    onClick={() => setSelectedStudyForResult(null)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleStudyResultSubmit} className="p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Fecha de realización *</label>
                      <DatePicker
                        date={studyResultForm.fechaRealizacion ? new Date(studyResultForm.fechaRealizacion) : undefined}
                        onDateChange={(date) => setStudyResultForm(prev => ({ 
                          ...prev, 
                          fechaRealizacion: date ? date.toISOString().split('T')[0] : '' 
                        }))}
                        placeholder="Seleccionar fecha"
                        captionLayout="dropdown"
                        fromYear={2000}
                        toYear={new Date().getFullYear()}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Laboratorio/Centro</label>
                      <input
                        type="text"
                        value={studyResultForm.laboratorio}
                        onChange={(e) => setStudyResultForm(prev => ({ ...prev, laboratorio: e.target.value }))}
                        placeholder="Ej. Laboratorio Central"
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-emerald-500 transition-colors"
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
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Resultados *</label>
                      <Button
                        type="button"
                        onClick={() => setStudyResultForm(prev => ({
                          ...prev,
                          items: [...prev.items, { parametro: '', valor: '', unidad: '', valorReferencia: '', esNormal: null }]
                        }))}
                        size="sm"
                        className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar resultado
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {studyResultForm.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-md p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Resultado {index + 1}</span>
                            {studyResultForm.items.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => setStudyResultForm(prev => ({
                                  ...prev,
                                  items: prev.items.filter((_, i) => i !== index)
                                }))}
                                size="sm"
                                className="text-red-600 hover:text-red-800 bg-transparent hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-600">Parámetro *</label>
                              <input
                                type="text"
                                value={item.parametro}
                                onChange={(e) => {
                                  const newItems = [...studyResultForm.items]
                                  newItems[index] = { ...newItems[index], parametro: e.target.value }
                                  setStudyResultForm(prev => ({ ...prev, items: newItems }))
                                }}
                                placeholder="Ej. Hemoglobina, Glucosa"
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-emerald-500 transition-colors"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-600">Valor *</label>
                              <input
                                type="text"
                                value={item.valor}
                                onChange={(e) => {
                                  const newItems = [...studyResultForm.items]
                                  newItems[index] = { ...newItems[index], valor: e.target.value }
                                  setStudyResultForm(prev => ({ ...prev, items: newItems }))
                                }}
                                placeholder="Ej. 12.5, Negativo"
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-emerald-500 transition-colors"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-600">Unidad</label>
                              <input
                                type="text"
                                value={item.unidad || ''}
                                onChange={(e) => {
                                  const newItems = [...studyResultForm.items]
                                  newItems[index] = { ...newItems[index], unidad: e.target.value }
                                  setStudyResultForm(prev => ({ ...prev, items: newItems }))
                                }}
                                placeholder="Ej. mg/dl, g/dl"
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-emerald-500 transition-colors"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-600">Valor de referencia</label>
                              <input
                                type="text"
                                value={item.valorReferencia || ''}
                                onChange={(e) => {
                                  const newItems = [...studyResultForm.items]
                                  newItems[index] = { ...newItems[index], valorReferencia: e.target.value }
                                  setStudyResultForm(prev => ({ ...prev, items: newItems }))
                                }}
                                placeholder="Ej. 12-15 mg/dl"
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-emerald-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600">Estado</label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: true, label: 'Normal', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                                { value: false, label: 'Alterado', color: 'bg-red-100 text-red-700 border-red-200' },
                                { value: null, label: 'No especificado', color: 'bg-gray-100 text-gray-700 border-gray-200' }
                              ].map((option) => (
                                <label key={String(option.value)} className="cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`esNormal-${index}`}
                                    checked={item.esNormal === option.value}
                                    onChange={() => {
                                      const newItems = [...studyResultForm.items]
                                      newItems[index] = { ...newItems[index], esNormal: option.value }
                                      setStudyResultForm(prev => ({ ...prev, items: newItems }))
                                    }}
                                    className="sr-only"
                                  />
                                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                    item.esNormal === option.value 
                                      ? option.color + ' ring-2 ring-emerald-200' 
                                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                  }`}>
                                    {option.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      onClick={() => setSelectedStudyForResult(null)}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={studyResultLoading}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
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
        </div>
      )
    }

    if (activeTab === 'medicaciones') {
      return (
        <div className="space-y-6">
          <form onSubmit={handleMedicationSubmit} className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Medicaciones habituales</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Medicamento *</label>
                <input
                  value={patientMedicationForm.nombre}
                  onChange={(event) => setPatientMedicationForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  placeholder="Ej. Metformina 850 mg"
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dosis</label>
                <input
                  value={patientMedicationForm.dosis}
                  onChange={(event) => setPatientMedicationForm((prev) => ({ ...prev, dosis: event.target.value }))}
                  placeholder="Ej. 1 comprimido"
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Frecuencia</label>
                <input
                  value={patientMedicationForm.frecuencia}
                  onChange={(event) => setPatientMedicationForm((prev) => ({ ...prev, frecuencia: event.target.value }))}
                  placeholder="Ej. cada 12 horas"
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Vía de administración</label>
                <input
                  value={patientMedicationForm.viaAdministracion}
                  onChange={(event) => setPatientMedicationForm((prev) => ({ ...prev, viaAdministracion: event.target.value }))}
                  placeholder="Ej. Vía oral"
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha de inicio</label>
                <input
                  type="date"
                  value={patientMedicationForm.fechaInicio}
                  onChange={(event) => setPatientMedicationForm((prev) => ({ ...prev, fechaInicio: event.target.value }))}
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Indicaciones / Observaciones</label>
                <textarea
                  value={patientMedicationForm.indicaciones}
                  onChange={(event) => setPatientMedicationForm((prev) => ({ ...prev, indicaciones: event.target.value }))}
                  className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={2}
                  placeholder="Instrucciones para el paciente"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={patientMedicationLoading} className="bg-amber-600 hover:bg-amber-700">
                {patientMedicationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar medicamento habitual'
                )}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-emerald-200 bg-white/70 backdrop-blur-sm shadow-sm">
            <div className="px-6 py-4 border-b border-emerald-200/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Medicaciones del paciente</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{patientMedications.length} registro(s)</span>
                <MiniPagination
                  currentPage={medicationsPage}
                  totalItems={patientMedications.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setMedicationsPage}
                />
              </div>
            </div>
            {patientMedicationsLoading ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 mr-2 inline-block animate-spin" /> Cargando medicación...
              </div>
            ) : patientMedications.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">
                No hay medicación habitual registrada aún
              </div>
            ) : (
              <div className="divide-y">
                {patientMedications
                  .slice((medicationsPage - 1) * itemsPerPage, medicationsPage * itemsPerPage)
                  .map((medication) => (
                    <div key={medication.id} className="px-5 py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-900">{medication.nombre}</div>
                        <Badge className={medication.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}>
                          {medication.activo ? 'Activo' : 'Suspendido'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        {medication.dosis && <div><span className="font-medium">Dosis:</span> {medication.dosis}</div>}
                        {medication.frecuencia && <div><span className="font-medium">Frecuencia:</span> {medication.frecuencia}</div>}
                        {medication.viaAdministracion && <div><span className="font-medium">Vía:</span> {medication.viaAdministracion}</div>}
                        {medication.fechaInicio && <div><span className="font-medium">Inicio:</span> {new Date(medication.fechaInicio).toLocaleDateString('es-AR')}</div>}
                        {medication.fechaFin && <div><span className="font-medium">Fin:</span> {new Date(medication.fechaFin).toLocaleDateString('es-AR')}</div>}
                        {medication.indicaciones && <div className="text-gray-600">{medication.indicaciones}</div>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Consultas del profesional</h1>
            <p className="text-lg text-gray-600">Gestiona diagnósticos, recetas, estudios y medicación de tus pacientes desde una única vista</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <DatePicker
              date={filters.dateFrom}
              onDateChange={(date) => {
                resetToFirstPage()
                setFilters((prev) => ({ ...prev, dateFrom: date ?? undefined }))
              }}
              placeholder="Desde"
              captionLayout="dropdown"
              fromYear={2000}
              toYear={currentYear}
              className="w-40"
            />
            {filters.dateFrom && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  resetToFirstPage()
                  setFilters((prev) => ({ ...prev, dateFrom: undefined }))
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DatePicker
              date={filters.dateTo}
              onDateChange={(date) => {
                resetToFirstPage()
                setFilters((prev) => ({ ...prev, dateTo: date ?? undefined }))
              }}
              placeholder="Hasta"
              captionLayout="dropdown"
              fromYear={2000}
              toYear={currentYear}
              className="w-40"
            />
            {filters.dateTo && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  resetToFirstPage()
                  setFilters((prev) => ({ ...prev, dateTo: undefined }))
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
            <select
              value={filters.status}
              onChange={(event) => {
                resetToFirstPage()
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Estado: Todos</option>
              {(Object.entries(APPOINTMENT_STATUS_META) as Array<[AppointmentStatus, typeof APPOINTMENT_STATUS_META[AppointmentStatus]]>).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
            <div className="relative w-72">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar paciente (nombre, apellido o DNI)"
                value={filters.patient}
                onChange={(event) => {
                  resetToFirstPage()
                  setPatientFilterId(null)
                  setFilters((prev) => ({ ...prev, patient: event.target.value }))
                }}
                className="pl-9 pr-20"
              />
              {(filters.patient || patientFilterId) && (
                <button
                  type="button"
                  onClick={() => {
                    resetToFirstPage()
                    setPatientFilterId(null)
                    setFilters((prev) => ({ ...prev, patient: '' }))
                    setPatientSuggestions([])
                    // Limpiar patientId de la URL
                    const params = new URLSearchParams(Array.from(searchParams.entries()))
                    params.delete('patientId')
                    params.delete('appointmentId') // también eliminamos selección forzada
                    justClearedPatientFilterRef.current = true
                    router.replace(`/profesional/consultas?${params.toString()}`)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpiar
                </button>
              )}
              {(patientSuggestions.length > 0 || (isFetchingPatientSuggestions && filters.patient.trim().length >= 2)) && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-lg border bg-white shadow-lg">
                  <div className="max-h-48 overflow-y-auto py-2 text-sm">
                    {isFetchingPatientSuggestions && (
                      <div className="px-3 py-1 text-gray-500 flex items-center gap-2 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                      </div>
                    )}
                    {patientSuggestions.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        resetToFirstPage()
                        setSkipPatientSuggestionFetch(true)
                        setPatientFilterId(patient.id)
                        setFilters((prev) => ({ ...prev, patient: `${patient.apellido} ${patient.nombre}` }))
                        setPatientSuggestions([])
                      }}
                        className="w-full px-3 py-2 text-left hover:bg-sky-50"
                      >
                        <div className="font-medium text-gray-900">{patient.apellido}, {patient.nombre}</div>
                        <div className="text-xs text-gray-500">DNI: {patient.dni}</div>
                      </button>
                    ))}
                    {!isFetchingPatientSuggestions && patientSuggestions.length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-500">No se encontraron coincidencias</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => setRefreshTicker((prev) => prev + 1)}>
              <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-600 font-medium">Rango rápido:</span>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuickDateRange('today')}>
              Hoy
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuickDateRange('tomorrow')}>
              Mañana
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuickDateRange('next7')}>
              Próximos 7 días
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuickDateRange('month')}>
              Mes actual
            </Button>
            <button
              type="button"
              onClick={() => {
                resetToFirstPage()
                setFilters((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined }))
                setPatientSuggestions([])
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border border-emerald-200 hover:border-emerald-300 transition-all duration-200"
            >
              <X className="h-3 w-3" />
              Limpiar fechas
            </button>

          </div>
        </div>
      </section>

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          {feedback.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm">
            <div className="px-6 py-4 border-b border-emerald-200/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Consultas</h2>
              <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">{totalAppointments} turno(s)</Badge>
            </div>
            {loadingAppointments ? (
              <div className="py-10 text-center text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Cargando consultas...
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                No se encontraron turnos con los filtros seleccionados
              </div>
            ) : (
              <div className="divide-y max-h-[70vh] overflow-y-auto">
                {appointments.map((appointment, idx) => {
                  const statusMeta = APPOINTMENT_STATUS_META[appointment.estado]
                  const selected = appointment.id === selectedAppointmentId
                  return (
                    <button
                      key={`appt-${appointment.id}-${idx}`}
                      onClick={() => handleSelectAppointment(appointment.id)}
                      className={`w-full text-left px-4 py-3 transition ${selected ? 'bg-sky-50 border-l-4 border-sky-500' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {appointment.paciente.apellido}, {appointment.paciente.nombre}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> {new Date(appointment.fecha).toLocaleDateString('es-AR')} • <Clock className="h-3 w-3" /> {new Date(appointment.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {appointment.motivo && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              Motivo: {appointment.motivo}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                        <span>{appointment.diagnoses.length} diagnósticos</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {!loadingAppointments && totalAppointments > 0 && (
              <div className="px-4 py-3 border-t flex flex-col gap-2 text-sm text-gray-600">
                <div>
                  Mostrando {startItem}-{endItem} de {totalAppointments} turno(s)
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {!selectedAppointment ? (
            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm p-10 text-center text-emerald-600">
              Selecciona un turno para comenzar a trabajar
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm p-6">
                <div className="flex flex-wrap gap-4 sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAppointment.paciente.apellido}, {selectedAppointment.paciente.nombre}
                    </div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-3 mt-1">
                      <span>DNI: {selectedAppointment.paciente.dni}</span>
                      <span>Edad: {calculateAge(selectedAppointment.paciente.fechaNacimiento)} años</span>
                      <span>Género: {selectedAppointment.paciente.genero}</span>
                    </div>
                    {selectedAppointment.obraSocial && (
                      <div className="mt-1 text-sm text-gray-600">
                        Obra social: {selectedAppointment.obraSocial.nombre}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm text-gray-500">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-500 hover:text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-full px-4 font-medium"
                      >
                        <Link href={`/profesional/agenda/consulta?id=${selectedAppointment.id}`} className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          Detalle de Consulta
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-500 hover:text-white hover:border-slate-500 transition-all duration-200 rounded-full px-4 font-medium"
                      >
                        <Link href={`/profesional/historias-clinicas?patientId=${selectedAppointment.paciente.id}`} className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Historia clínica
                        </Link>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> {new Date(selectedAppointment.fecha).toLocaleDateString('es-AR')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> {selectedAppointment.duracion} minutos
                    </div>
                    {selectedAppointment.motivo && (
                      <div className="text-xs text-gray-600 max-w-xs text-right">Motivo: {selectedAppointment.motivo}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-sm">
                <div className="flex border-b border-emerald-200/50 overflow-x-auto">
                  {Tabs.map((tab) => {
                    const tabLabels: Record<(typeof Tabs)[number], string> = {
                      diagnosticos: 'Diagnósticos',
                      prescripciones: 'Recetas',
                      estudios: 'Estudios',
                      medicaciones: 'Medicaciones',
                    }
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-100/60' : 'text-gray-600 hover:text-emerald-600'}`}
                      >
                        {tabLabels[tab]}
                      </button>
                    )
                  })}
                </div>
                <div className="p-5">
                  {renderActiveTabContent()}
                </div>
              </div>
            </div>
          )}
        </div>
        {(filters.dateFrom || filters.dateTo || filters.status || patientFilterId) && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {filters.dateFrom && (
              <Badge variant="outline" className="flex items-center gap-1">
                Desde: {formatDisplayDate(filters.dateFrom)}
                <button
                  type="button"
                  onClick={() => {
                    resetToFirstPage()
                    setFilters((prev) => ({ ...prev, dateFrom: undefined }))
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="outline" className="flex items-center gap-1">
                Hasta: {formatDisplayDate(filters.dateTo)}
                <button
                  type="button"
                  onClick={() => {
                    resetToFirstPage()
                    setFilters((prev) => ({ ...prev, dateTo: undefined }))
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="outline" className="flex items-center gap-1">
                Estado: {filters.status ? getStatusLabel(filters.status as AppointmentStatus) : filters.status}
                <button
                  type="button"
                  onClick={() => {
                    resetToFirstPage()
                    setFilters((prev) => ({ ...prev, status: '' }))
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.patient || patientFilterId) && (
              <Badge variant="outline" className="flex items-center gap-1">
                Paciente: {filters.patient || 'Seleccionado'}
                <button
                  type="button"
                  onClick={() => {
                    resetToFirstPage()
                    setPatientFilterId(null)
                    setFilters((prev) => ({ ...prev, patient: '' }))
                    justClearedPatientFilterRef.current = true
                    const params = new URLSearchParams(Array.from(searchParams.entries()))
                    params.delete('patientId')
                    params.delete('appointmentId')
                    router.replace(`/profesional/consultas?${params.toString()}`)
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
