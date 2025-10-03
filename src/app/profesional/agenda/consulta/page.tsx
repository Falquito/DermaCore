"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  Phone,
  Mail,
  ClipboardList,
  Pill,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  AlertCircle,
  NotebookPen,
  FileText,
} from "lucide-react"
import { AppointmentStatus } from "@prisma/client"

import ObservacionesEditor from "@/components/ObservacionesEditor"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { APPOINTMENT_STATUS_META, getStatusLabel } from '@/lib/appointment-status'

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PROGRAMADO,
  AppointmentStatus.CONFIRMADO,
  AppointmentStatus.EN_SALA_DE_ESPERA,
]

type FeedbackState = {
  type: "success" | "error"
  message: string
} | null

interface AppointmentCancellationInfo {
  id: string
  motivo: string
  cancelledAt: string
  cancelledBy: {
    id: string
    name: string | null
  } | null
}

interface Diagnosis {
  id: string
  appointmentId: string
  professionalId: string
  patientId: string
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

interface StudyOrderItem {
  id: string
  orderId: string
  estudio: string
  indicaciones: string | null
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

interface RelatedAppointment {
  id: string
  fecha: string
  estado: AppointmentStatus
  motivo: string | null
  createdAt: string
}

interface AppointmentDetail {
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
  numeroAfiliado?: string | null
  tipoConsulta: "OBRA_SOCIAL" | "PARTICULAR"
  copago?: string | null
  autorizacion?: string | null
  pacienteId: string
  paciente: PatientSummary
  AppointmentCancellation: AppointmentCancellationInfo | null
  diagnoses: Diagnosis[]
  prescriptions: Prescription[]
  studyOrders: StudyOrder[]
  createdAt: string
  updatedAt: string
}

interface AppointmentDetailResponse {
  appointment: AppointmentDetail
  patientMedications: PatientMedication[]
  relatedAppointments: RelatedAppointment[]
  message?: string
}

interface ProfileResponse {
  user: {
    id: string
    name: string | null
    apellido: string | null
    roles: string[]
  }
}

type ActionKey = AppointmentStatus | "CANCEL"

const STATUS_HINTS: Partial<Record<AppointmentStatus, string>> = {
  [AppointmentStatus.COMPLETADO]: 'La consulta fue finalizada',
  // No mostrar hint para cancelado, se maneja por separado con AppointmentCancellation
}

function formatDate(value: string, withTime = false) {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    if (withTime) {
      return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return value
  }
}

function formatTime(value: string) {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return "-"
  }
}

function formatCurrency(value?: string | null) {
  if (!value) return null
  const amount = Number(value)
  if (Number.isNaN(amount)) return value
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(amount)
}

function calculateAge(birthDate?: string) {
  if (!birthDate) return "-"
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return "-"
  const diff = Date.now() - date.getTime()
  const ageDate = new Date(diff)
  return `${Math.abs(ageDate.getUTCFullYear() - 1970)} años`
}

function formatTipoConsulta(tipo: AppointmentDetail["tipoConsulta"]) {
  return tipo === "OBRA_SOCIAL" ? "Obra social" : "Particular"
}

export default function ConsultaDesdeAgendaPage() {
  const router = useRouter()
  const query = useSearchParams()
  const appointmentId = query.get("id") ?? ""

  const [detail, setDetail] = useState<AppointmentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [actionLoading, setActionLoading] = useState<ActionKey | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileResponse["user"] | null>(null)

  const statusMeta = useMemo(() => {
    if (!detail) return null
    return APPOINTMENT_STATUS_META[detail.appointment.estado]
  }, [detail])

  const statusHint = useMemo(() => {
    if (!detail) return undefined
    return STATUS_HINTS[detail.appointment.estado]
  }, [detail])

  const fetchDetail = useCallback(async () => {
    if (!appointmentId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/professional/appointments/${appointmentId}`)
      const data: AppointmentDetailResponse | { error: string } = await response.json()
      if (!response.ok || "error" in data) {
        throw new Error((data as { error?: string }).error || "No se pudo obtener la consulta")
      }
      setDetail(data as AppointmentDetailResponse)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error al cargar la consulta")
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    if (!appointmentId) return
    fetchDetail()
  }, [appointmentId, fetchDetail])

  useEffect(() => {
    let ignore = false
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" })
        const data: ProfileResponse | { error: string } = await response.json()
        if (!ignore && response.ok && "user" in data) {
          setProfile(data.user)
        }
      } catch (err) {
        console.error(err)
        if (!ignore) setProfile(null)
      }
    }
    loadProfile()
    return () => {
      ignore = true
    }
  }, [])

  const handleStatusUpdate = async (status: AppointmentStatus) => {
    if (!appointmentId) return
    setActionLoading(status)
    setFeedback(null)
    try {
      const response = await fetch(`/api/professional/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data: AppointmentDetailResponse | { error: string; message?: string } = await response.json()
      if (!response.ok || "error" in data) {
        throw new Error((data as { error?: string }).error || "No se pudo actualizar el estado")
      }
      setDetail(data as AppointmentDetailResponse)
      setFeedback({ type: "success", message: (data as AppointmentDetailResponse).message ?? "Estado actualizado" })
    } catch (err) {
      console.error(err)
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "No se pudo actualizar el estado" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelSubmit = async () => {
    if (!appointmentId) return
    const motivo = cancelReason.trim()
    if (!motivo) {
      setCancelError("Especificá el motivo de la cancelación")
      return
    }
    if (!profile?.id) {
      setCancelError("No pudimos identificar al profesional. Intenta nuevamente")
      return
    }
    setCancelError(null)
    setActionLoading("CANCEL")
    setFeedback(null)
    try {
      const response = await fetch(`/api/turnos/${appointmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo, cancelledById: profile.id }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo cancelar el turno")
      }
      setFeedback({ type: "success", message: data?.message || "Turno cancelado" })
      setCancelDialogOpen(false)
      setCancelReason("")
      await fetchDetail()
    } catch (err) {
      console.error(err)
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "No se pudo cancelar el turno" })
    } finally {
      setActionLoading(null)
    }
  }

  if (!appointmentId) {
    return (
      <div className="w-full px-6 py-6">
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Falta el identificador del turno</h1>
            <p className="text-sm text-gray-600">Reingresá desde la agenda para cargar la consulta correspondiente.</p>
          </div>
          <Button onClick={() => router.push(`/profesional/consultas?appointmentId=${appointmentId}`)}>Volver a consultas</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="bg-white border rounded-lg shadow-sm p-12 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-gray-600">Preparando la consulta...</p>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="w-full px-6 py-6">
        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">No pudimos abrir la consulta</h1>
            <p className="text-sm text-gray-600">{error || "Intentá nuevamente más tarde."}</p>
          </div>
          <Button onClick={() => router.push(`/profesional/consultas?appointmentId=${appointmentId}`)}>Volver a consultas</Button>
        </div>
      </div>
    )
  }

  const { appointment, patientMedications, relatedAppointments } = detail

  const canFinalize = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.estado)

  const canMarkNoShow = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.estado)

  const canCancel = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.estado)

  return (
    <div className="w-full px-6 py-6 space-y-8">
      {/* Header mejorado con gradiente */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-2xl px-4 py-2"
              onClick={() => router.push(`/profesional/consultas?appointmentId=${appointmentId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a consultas
            </Button>
          </div>
          <div className="flex-1 lg:text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Detalle de consulta</h1>
            <p className="text-gray-600">Gestioná el encuentro, registrá hallazgos y accedé al historial clínico del paciente</p>
          </div>
          {statusMeta && (
            <div className={`inline-flex flex-col gap-1 rounded-2xl px-6 py-3 text-sm font-semibold shadow-lg ${statusMeta.solidClass}`}>
              <span className="uppercase tracking-wide">{getStatusLabel(detail.appointment.estado)}</span>
              {statusHint && <span className="text-xs font-normal normal-case opacity-90">{statusHint}</span>}
            </div>
          )}
        </div>
      </section>

      {feedback && (
        <div className={`flex items-start gap-3 rounded-2xl border-0 px-6 py-4 shadow-lg ${feedback.type === "error" ? "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700" : "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700"}`}>
          {feedback.type === "error" ? <AlertCircle className="h-5 w-5 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 mt-0.5" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="px-8 py-6 border-b border-emerald-100 flex flex-wrap gap-6 justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <Stethoscope className="h-4 w-4" />
                  Consulta #{appointment.id.slice(-6)}
                </div>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {appointment.paciente.apellido}, {appointment.paciente.nombre}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl"
                    asChild
                  >
                    <Link href={`/profesional/historias-clinicas?patientId=${appointment.paciente.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Historia clínica
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full"><Calendar className="h-4 w-4 text-emerald-600" /> {formatDate(appointment.fecha)}</span>
                  <span className="inline-flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-full"><Clock className="h-4 w-4 text-sky-600" /> {formatTime(appointment.fecha)} · {appointment.duracion} min</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                {appointment.motivo && appointment.estado !== AppointmentStatus.CANCELADO && (
                  <div className="max-w-xs">
                    <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wide">Motivo de consulta</span>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{appointment.motivo}</p>
                  </div>
                )}
                {appointment.obraSocial && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800 text-xs uppercase tracking-wide">Cobertura</span>
                    <p>{appointment.obraSocial.nombre}</p>
                    {appointment.numeroAfiliado && <p className="text-xs text-gray-500">Afiliado: {appointment.numeroAfiliado}</p>}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-800 text-xs uppercase tracking-wide">Modalidad</span>
                  <p>{formatTipoConsulta(appointment.tipoConsulta)}</p>
                  {formatCurrency(appointment.copago) && <p className="text-xs text-gray-500">Copago: {formatCurrency(appointment.copago)}</p>}
                  {appointment.autorizacion && <p className="text-xs text-gray-500">Autorización: {appointment.autorizacion}</p>}
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t bg-slate-50 text-xs text-gray-500">
              Creado el {formatDate(appointment.createdAt, true)} · Última actualización {formatDate(appointment.updatedAt, true)}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="px-8 py-6 border-b border-emerald-100 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <NotebookPen className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Notas y observaciones</h3>
            </div>
            <div className="px-8 py-8">
              <ObservacionesEditor appointmentId={appointment.id} />
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="px-8 py-6 border-b border-emerald-100 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                <ClipboardList className="h-5 w-5 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Documentos generados en la consulta</h3>
            </div>
            <div className="px-8 py-8 space-y-8">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Diagnósticos</h4>
                  <span className="text-xs text-gray-500">{appointment.diagnoses.length}</span>
                </div>
                {appointment.diagnoses.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">Todavía no registraste diagnósticos para este turno.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {appointment.diagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-emerald-900">{diagnosis.principal}</p>
                            {diagnosis.secundarios.length > 0 && (
                              <p className="text-xs text-emerald-700/80 mt-1">Secundarios: {diagnosis.secundarios.join("; ")}</p>
                            )}
                            {diagnosis.notas && (
                              <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">{diagnosis.notas}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(diagnosis.createdAt, true)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-sky-700 uppercase tracking-wide">Recetas emitidas</h4>
                  <span className="text-xs text-gray-500">{appointment.prescriptions.length}</span>
                </div>
                {appointment.prescriptions.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No hay recetas asociadas a esta consulta.</p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {appointment.prescriptions.map((prescription) => (
                      <div key={prescription.id} className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            {prescription.items.map((item) => (
                              <div key={item.id} className="border-l-2 border-sky-400 pl-3">
                                <p className="text-sm font-semibold text-sky-900">{item.medicamento}</p>
                                <p className="text-xs text-sky-700/80">{item.dosis} • {item.frecuencia} • {item.duracion}</p>
                                {item.indicaciones && (
                                  <p className="text-xs text-sky-700/70 mt-1">Indicaciones: {item.indicaciones}</p>
                                )}
                              </div>
                            ))}
                            {prescription.notas && (
                              <p className="text-xs text-sky-700/70">Notas: {prescription.notas}</p>
                            )}
                            {prescription.diagnoses.length > 0 && (
                              <p className="text-xs text-sky-700/70">
                                Asociado a: {prescription.diagnoses.map((link) => link.diagnosis.principal).join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(prescription.createdAt, true)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Órdenes de estudio</h4>
                  <span className="text-xs text-gray-500">{appointment.studyOrders.length}</span>
                </div>
                {appointment.studyOrders.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No se registraron estudios complementarios.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {appointment.studyOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="border-l-2 border-orange-400 pl-3">
                                <p className="text-sm font-semibold text-orange-900">{item.estudio}</p>
                                {item.indicaciones && <p className="text-xs text-orange-700/80 mt-1">Indicaciones: {item.indicaciones}</p>}
                              </div>
                            ))}
                            {order.notas && <p className="text-xs text-orange-700/80">Notas: {order.notas}</p>}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(order.createdAt, true)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="px-8 py-6 border-b border-emerald-100 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Últimos encuentros con el paciente</h3>
            </div>
            {relatedAppointments.length === 0 ? (
              <div className="px-8 py-8 text-center">
                <div className="text-gray-400 mb-3">
                  <History className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500 font-medium">No hay registros previos recientes</p>
                <p className="text-sm text-gray-400 mt-1">Los encuentros anteriores aparecerán aquí</p>
              </div>
            ) : (
              <div className="px-8 py-6 space-y-4">
                {relatedAppointments.map((item) => {
                  const meta = APPOINTMENT_STATUS_META[item.estado]
                  return (
                    <Link
                      key={item.id}
                      href={`/profesional/agenda/consulta?id=${item.id}`}
                      className="block rounded-lg border px-4 py-3 hover:border-emerald-400 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-gray-900">{formatDate(item.fecha, true)}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}>{getStatusLabel(item.estado)}</span>
                      </div>
                      {item.motivo && <p className="text-xs text-gray-600 mt-1">Motivo: {item.motivo}</p>}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="px-6 py-5 border-b border-emerald-100 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <Stethoscope className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Datos del paciente</h3>
            </div>
            <div className="px-5 py-5 space-y-4 text-sm text-gray-700">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900">
                  {appointment.paciente.apellido}, {appointment.paciente.nombre}
                </p>
                <p className="text-xs text-gray-500">DNI {appointment.paciente.dni}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Stethoscope className="h-4 w-4 text-emerald-600" /> {calculateAge(appointment.paciente.fechaNacimiento)}</div>
                <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-emerald-600" /> {appointment.paciente.telefono || appointment.paciente.celular || "Sin teléfono"}</div>
                <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-emerald-600" /> {appointment.paciente.email || "Sin correo"}</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="px-6 py-5 border-b border-emerald-100 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Acciones sobre el turno</h3>
            </div>
            <div className="px-5 py-5 space-y-3">
              {canFinalize && (
                <Button
                  onClick={() => handleStatusUpdate(AppointmentStatus.COMPLETADO)}
                  disabled={actionLoading !== null}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {actionLoading === AppointmentStatus.COMPLETADO ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Finalizar consulta
                    </>
                  )}
                </Button>
              )}

              {canMarkNoShow && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate(AppointmentStatus.NO_ASISTIO)}
                  disabled={actionLoading !== null}
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  {actionLoading === AppointmentStatus.NO_ASISTIO ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" /> Registrar inasistencia
                    </>
                  )}
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={actionLoading !== null}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4" /> Cancelar turno
                </Button>
              )}

              <p className="text-xs text-gray-500 leading-relaxed">
                Estas acciones actualizan la agenda en tiempo real y notifican a otros módulos del sistema.
              </p>
              {appointment.AppointmentCancellation && appointment.AppointmentCancellation.motivo && (
                <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 px-4 py-4 text-sm text-rose-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4" />
                    <p className="font-bold">Turno cancelado</p>
                  </div>
                  <p className="mb-2"><span className="font-semibold">Motivo:</span> {appointment.AppointmentCancellation.motivo}</p>
                  <p className="text-xs opacity-80">
                    Registrado por {appointment.AppointmentCancellation.cancelledBy?.name || "-"} · {formatDate(appointment.AppointmentCancellation.cancelledAt, true)}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="px-6 py-5 border-b border-emerald-100 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <Pill className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wide">Medicaciones habituales</h3>
            </div>
            {patientMedications.length === 0 ? (
              <div className="px-5 py-5 text-sm text-gray-500">Sin medicación registrada para este paciente.</div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                {patientMedications.slice(0, 6).map((medication) => (
                  <div key={medication.id} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3 text-xs text-orange-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-orange-900 text-sm">{medication.nombre}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${medication.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {medication.activo ? "Activa" : "Suspendida"}
                      </span>
                    </div>
                    <p className="mt-1">{[medication.dosis, medication.frecuencia].filter(Boolean).join(" • ") || "Sin dosis cargada"}</p>
                    {medication.viaAdministracion && <p className="mt-1">Vía: {medication.viaAdministracion}</p>}
                    {medication.indicaciones && <p className="mt-1">Notas: {medication.indicaciones}</p>}
                  </div>
                ))}
                {patientMedications.length > 6 && (
                  <p className="text-xs text-gray-500">Mostrando las últimas {patientMedications.length} medicaciones</p>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
            <DialogDescription>
              La cancelación notifica a la agenda y registra el motivo en la historia del turno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="cancel-reason">Motivo de cancelación</label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value)
                setCancelError(null)
              }}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej. Paciente reprograma, indicación médica, etc."
            />
            {cancelError && <p className="text-xs text-rose-600">{cancelError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Cerrar</Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={actionLoading === "CANCEL"}
            >
              {actionLoading === "CANCEL" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
