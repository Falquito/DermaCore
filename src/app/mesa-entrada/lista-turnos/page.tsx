'use client'

import React, { useState, useEffect } from 'react'
import { Search, User, Calendar, Clock, ChevronRight } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { AppointmentStatus } from '@prisma/client'

// Types
type Professional = {
  id: string
  name: string
  email: string
  roles: string[]
}

type Appointment = {
  id: string
  professionalId: string
  patientId?: string | null
  title: string
  start: string
  end: string
  status: AppointmentStatus
  notes?: string | null
}

// Status labels and colors
const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROGRAMADO: 'Programado',
  CONFIRMADO: 'Confirmado',
  EN_SALA_DE_ESPERA: 'En sala de espera',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  NO_ASISTIO: 'No asistió',
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PROGRAMADO: 'bg-blue-100 text-blue-800',
  CONFIRMADO: 'bg-green-100 text-green-800',
  EN_SALA_DE_ESPERA: 'bg-yellow-100 text-yellow-800',
  COMPLETADO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-red-100 text-red-800',
  NO_ASISTIO: 'bg-gray-100 text-gray-800',
}

// Modal placeholder component
function AppointmentModal({ 
  appointment, 
  isOpen, 
  onClose 
}: { 
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void 
}) {
  if (!isOpen || !appointment) return null

  const startTime = new Date(appointment.start).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const endTime = new Date(appointment.end).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const date = new Date(appointment.start).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Detalles del Turno</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <p className="text-sm text-gray-900">{appointment.title}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <p className="text-sm text-gray-900 capitalize">{date}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
            <p className="text-sm text-gray-900">{startTime} - {endTime}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[appointment.status]}`}>
              {STATUS_LABELS[appointment.status]}
            </span>
          </div>
          
          {appointment.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{appointment.notes}</p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              [Placeholder] Aquí se implementarán las acciones del turno
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ListaTurnosPage() {
  // State
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProfessionals, setLoadingProfessionals] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const currentYear = new Date().getFullYear()

  // Initialize default dates
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextMonth = new Date(today)
    nextMonth.setDate(nextMonth.getDate() + 30)
    
    setDateFrom(today)
    setDateTo(nextMonth)
  }, [])

  // Fetch professionals on component mount
  useEffect(() => {
    async function fetchProfessionals() {
      try {
        setLoadingProfessionals(true)
        const response = await fetch('/api/users')
        if (!response.ok) throw new Error('Error fetching professionals')
        
        const data = await response.json()
        // Filter only users with PROFESIONAL role
        const professionalsOnly = data.users.filter((user: Professional) => 
          user.roles.includes('PROFESIONAL')
        )
        setProfessionals(professionalsOnly)
      } catch (error) {
        console.error('Error fetching professionals:', error)
      } finally {
        setLoadingProfessionals(false)
      }
    }

    fetchProfessionals()
  }, [])

  // Fetch appointments when professional is selected or date range changes
  useEffect(() => {
    if (!selectedProfessional) {
      setAppointments([])
      return
    }

    async function fetchAppointments() {
      try {
        setLoading(true)
        // Use selected date range or default to next 30 days
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const from = dateFrom ? new Date(dateFrom) : new Date(today)
        from.setHours(0, 0, 0, 0)

        const toBase = dateTo ? new Date(dateTo) : new Date(from)
        toBase.setHours(0, 0, 0, 0)

        if (!dateTo) {
          toBase.setDate(toBase.getDate() + 30)
        } else if (toBase < from) {
          toBase.setTime(from.getTime())
        }

        // Add one day to 'to' date to include the entire selected day
        const to = new Date(toBase)
        to.setDate(to.getDate() + 1)

        const params = new URLSearchParams({
          from: from.toISOString(),
          to: to.toISOString(),
          professionalId: selectedProfessional?.id || ''
        })

        const response = await fetch(`/api/agenda?${params.toString()}`)
        if (!response.ok) throw new Error('Error fetching appointments')
        
        const data: Appointment[] = await response.json()
        setAppointments(data)
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [selectedProfessional, dateFrom, dateTo])

  // Helper function to normalize text (remove accents and special characters)
  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim()
  }

  // Filter professionals based on search
  const filteredProfessionals = professionals.filter(prof => {
    const normalizedSearchTerm = normalizeText(searchTerm)
    return normalizeText(prof.name).includes(normalizedSearchTerm) ||
           normalizeText(prof.email).includes(normalizedSearchTerm)
  })

  // Filter appointments based on search
  const filteredAppointments = appointments.filter(appointment => {
    const normalizedSearchTerm = normalizeText(appointmentSearchTerm)
    return normalizeText(appointment.title).includes(normalizedSearchTerm) ||
           (appointment.notes && normalizeText(appointment.notes).includes(normalizedSearchTerm)) ||
           normalizeText(STATUS_LABELS[appointment.status]).includes(normalizedSearchTerm)
  })

  // Handle appointment click
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setModalOpen(true)
  }

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedAppointment(null)
  }

  // Group appointments by date (using filtered appointments)
  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const date = new Date(appointment.start).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(appointment)
    return groups
  }, {} as Record<string, Appointment[]>)

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Lista de Turnos por Profesional</h1>
        <p className="text-gray-600">Busque y seleccione un profesional para ver su agenda de turnos</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Panel - Professional Selection */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <User className="mr-2 h-5 w-5 text-emerald-600" />
              Seleccionar Profesional
            </h2>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Buscar profesional por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Professionals List */}
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {loadingProfessionals ? (
                <div className="py-4 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-emerald-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando profesionales...</p>
                </div>
              ) : filteredProfessionals.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  <User className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm">
                    {searchTerm ? 'No se encontraron profesionales' : 'No hay profesionales disponibles'}
                  </p>
                </div>
              ) : (
                filteredProfessionals.map((professional) => (
                  <button
                    key={professional.id}
                    onClick={() => setSelectedProfessional(professional)}
                    className={`w-full rounded-md border p-3 text-left transition-all duration-200 ${
                      selectedProfessional?.id === professional.id
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{professional.name}</h3>
                        <p className="text-sm text-gray-600">{professional.email}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
                        selectedProfessional?.id === professional.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Appointments List */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <Calendar className="mr-2 h-5 w-5 text-emerald-600" />
              {selectedProfessional ? `Turnos de ${selectedProfessional.name}` : 'Turnos del Profesional'}
            </h2>

            {selectedProfessional && (
              <div className="mb-4 space-y-4">
                {/* Date Range Selector */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Fecha desde</label>
                    <DatePicker
                      date={dateFrom}
                      onDateChange={(value) => setDateFrom(value)}
                      placeholder="Selecciona una fecha"
                      captionLayout="dropdown"
                      fromYear={currentYear - 10}
                      toYear={currentYear + 5}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Fecha hasta</label>
                    <DatePicker
                      date={dateTo}
                      onDateChange={(value) => setDateTo(value)}
                      placeholder="Selecciona una fecha"
                      captionLayout="dropdown"
                      fromYear={currentYear - 10}
                      toYear={currentYear + 5}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar turnos por paciente, estado o notas..."
                    value={appointmentSearchTerm}
                    onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                {/* Reset filters button */}
                {(dateFrom || dateTo || appointmentSearchTerm) && (
                  <button
                    onClick={() => {
                      setDateFrom(undefined)
                      setDateTo(undefined)
                      setAppointmentSearchTerm('')
                    }}
                    className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}

            {!selectedProfessional ? (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-lg font-medium">Selecciona un profesional</p>
                <p className="text-sm">Elige un profesional de la lista para ver sus turnos</p>
              </div>
            ) : loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600"></div>
                <p className="text-sm text-gray-500">Cargando turnos...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-lg font-medium">No hay turnos programados</p>
                <p className="text-sm">
                  {dateFrom && dateTo
                    ? `No hay turnos entre ${dateFrom.toLocaleDateString('es-ES')} y ${dateTo.toLocaleDateString('es-ES')}`
                    : 'Este profesional no tiene turnos en los próximos 30 días'
                  }
                </p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-lg font-medium">No se encontraron turnos</p>
                <p className="text-sm">No hay turnos que coincidan con la búsqueda</p>
              </div>
            ) : (
              <div className="max-h-96 space-y-6 overflow-y-auto">
                {Object.entries(groupedAppointments)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .map(([dateString, dayAppointments]) => (
                    <div key={dateString} className="space-y-2">
                      <h3 className="border-b border-gray-200 pb-1 text-sm font-semibold text-gray-700">
                        {new Date(dateString).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <div className="space-y-2">
                        {dayAppointments
                          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                          .map((appointment) => {
                            const startTime = new Date(appointment.start).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                            const endTime = new Date(appointment.end).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                            
                            return (
                              <button
                                key={appointment.id}
                                onClick={() => handleAppointmentClick(appointment)}
                                className="w-full rounded-md border border-gray-200 p-3 text-left transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50"
                              >
                                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                      <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                                        {startTime} - {endTime}
                                      </span>
                                    </div>
                                    <p className="min-w-0 text-sm text-gray-700 sm:flex-1 sm:truncate">{appointment.title}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[appointment.status]}`}>
                                      {STATUS_LABELS[appointment.status]}
                                    </span>
                                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={modalOpen}
        onClose={handleModalClose}
      />
    </div>
  )
}
