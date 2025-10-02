'use client'

import React, { useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react'
import Link from 'next/link'
import styles from './agenda.module.css'
import { useHoverWithin } from '@/hooks/useHoverWithin'
import { AppointmentStatus } from '@prisma/client'
import { getStatusLabel } from '@/lib/appointment-status'
import {
  Calendar,
  CalendarDays,
  Clock,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Eye,
  X,
  ListChecks,
} from 'lucide-react'

type Appointment = {
  id: string
  professionalId: string
  patientId?: string | null
  title: string
  start: string // ISO
  end: string // ISO
  status: AppointmentStatus
  notes?: string | null
}

type View = 'day' | 'week' | 'month'

type StatusSummary = {
  status: AppointmentStatus
  total: number
  filtered: number
  percentage: number
}

const LOCALE = 'es-ES' as const

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function startOfWeek(d: Date) {
  const x = startOfDay(d)
  const day = x.getDay() // 0 Sun ... 6 Sat
  const diff = (day + 6) % 7 // Monday-based week
  x.setDate(x.getDate() - diff)
  return x
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d)
  return addDays(s, 6)
}
function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  x.setHours(23, 59, 59, 999)
  return x
}
function fmtISODate(d: Date) {
  return d.toISOString()
}
function getHoursRange() {
  // Working hours 07:00 - 20:00
  return { startHour: 7, endHour: 20 }
}
function minutesSinceStartOfGrid(date: Date) {
  const { startHour } = getHoursRange()
  return date.getHours() * 60 + date.getMinutes() - startHour * 60
}

export default function AgendaPage() {
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [active, setActive] = useState<Appointment | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [anchorOffset, setAnchorOffset] = useState<{ dx: number; dy: number } | null>(null)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus[]>([])
  const [search, setSearch] = useState('')
  const hoverTimerRef = useRef<number | null>(null)
  const lastHoverIdRef = useRef<string | null>(null)
  const { ref: hoverWithinRef, inside: isPointerInside } = useHoverWithin<HTMLElement>()

  useEffect(() => {
    if (!active || !anchorEl) return
    function update() {
      const rect = anchorEl?.getBoundingClientRect()
      if (rect) setAnchorRect(rect)
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [active, anchorEl])

  const { from, to } = useMemo(() => {
    if (view === 'day') {
      const s = startOfDay(date)
      const e = addDays(s, 1)
      return { from: s, to: e }
    }
    if (view === 'week') {
      return { from: startOfWeek(date), to: addDays(endOfWeek(date), 1) }
    }
    return { from: startOfMonth(date), to: addDays(endOfMonth(date), 1) }
  }, [view, date])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          from: fmtISODate(from),
          to: fmtISODate(to),
        })
        if (statusFilter.length) params.set('status', statusFilter.join(','))
        if (search.trim()) params.set('q', search.trim())
        const res = await fetch(`/api/agenda?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Appointment[] = await res.json()
        if (!ignore) setAppointments(data)
      } catch (error) {
        console.error('Agenda fetch error', error)
        if (!ignore) setAppointments([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [from, to, statusFilter, search])

  const weekDays = useMemo(() => {
    const start = startOfWeek(date)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [date])

  const periodLabel = useMemo(() => {
    if (view === 'day') {
      return date.toLocaleDateString(LOCALE, {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
    if (view === 'week') {
      const s = startOfWeek(date)
      const e = endOfWeek(date)
      const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
      if (sameMonth) {
        return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString(LOCALE, { month: 'short', year: 'numeric' })}`
      }
      return `${s.getDate()} ${s.toLocaleDateString(LOCALE, { month: 'short' })} – ${e.getDate()} ${e.toLocaleDateString(LOCALE, { month: 'short', year: 'numeric' })}`
    }
    return date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
  }, [view, date])

  function goPrev() {
    if (view === 'day') setDate(addDays(date, -1))
    else if (view === 'week') setDate(addDays(date, -7))
    else setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
  }

  function goNext() {
    if (view === 'day') setDate(addDays(date, 1))
    else if (view === 'week') setDate(addDays(date, 7))
    else setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  }

  function goToday() {
    setDate(new Date())
  }

  function navigateToAppointment(appointment: Appointment) {
    window.location.href = `/profesional/agenda/consulta?id=${appointment.id}`
  }

  function byDay(d: Date) {
    const y = d.getFullYear()
    const m = d.getMonth()
    const day = d.getDate()
    return appointments.filter((appointment) => {
      const start = new Date(appointment.start)
      return start.getFullYear() === y && start.getMonth() === m && start.getDate() === day
    })
  }

  const toggleStatus = (status: AppointmentStatus) => {
    setActive(null)
    setAnchorRect(null)
    setAnchorEl(null)
    setAnchorOffset(null)
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]))
  }

  const clearFilters = () => {
    setActive(null)
    setAnchorRect(null)
    setAnchorEl(null)
    setAnchorOffset(null)
    setStatusFilter([])
    setSearch('')
  }

  const filteredAppointments = useMemo(() => {
    let data = appointments
    if (statusFilter.length) data = data.filter((appointment) => statusFilter.includes(appointment.status))
    if (search.trim()) {
      const query = search.trim().toLowerCase()
      data = data.filter((appointment) => {
        const titleMatch = appointment.title.toLowerCase().includes(query)
        const notesMatch = appointment.notes?.toLowerCase().includes(query)
        const patientMatch = appointment.patientId?.toLowerCase().includes(query)
        return titleMatch || Boolean(notesMatch) || Boolean(patientMatch)
      })
    }
    return data
  }, [appointments, statusFilter, search])

  const hasActiveFilters = statusFilter.length > 0 || Boolean(search.trim())

  const statusSummary = useMemo<StatusSummary[]>(() => {
    const statuses = Object.values(AppointmentStatus) as AppointmentStatus[]
    const base = new Map<AppointmentStatus, StatusSummary>()
    statuses.forEach((status) => {
      base.set(status, {
        status,
        total: 0,
        filtered: 0,
        percentage: 0,
      })
    })

    appointments.forEach((appointment) => {
      const entry = base.get(appointment.status)
      if (entry) entry.total += 1
    })

    filteredAppointments.forEach((appointment) => {
      const entry = base.get(appointment.status)
      if (entry) entry.filtered += 1
    })

    const totalFiltered = filteredAppointments.length
    return Array.from(base.values()).map((entry) => ({
      ...entry,
      percentage: totalFiltered > 0 ? Math.round((entry.filtered / totalFiltered) * 100) : 0,
    }))
  }, [appointments, filteredAppointments])

  const todayCount = useMemo(() => {
    const today = startOfDay(new Date())
    return filteredAppointments.filter((appointment) => {
      const start = new Date(appointment.start)
      return (
        start.getFullYear() === today.getFullYear() &&
        start.getMonth() === today.getMonth() &&
        start.getDate() === today.getDate()
      )
    }).length
  }, [filteredAppointments])

  return (
    <main ref={hoverWithinRef} className="w-full px-6 py-6 lg:px-10">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-600/90 p-3 text-white shadow-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-emerald-950">Mi agenda</h1>
                <p className="mt-1 text-sm text-emerald-800/80">{periodLabel}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-emerald-900/90">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 font-medium shadow-sm backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    {filteredAppointments.length} turnos visibles
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 font-medium shadow-sm backdrop-blur-sm">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    {todayCount} hoy
                  </span>
                  {hasActiveFilters && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow-sm backdrop-blur-sm">
                      Filtros activos
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-2xl bg-white/90 p-1 shadow-sm backdrop-blur">
                <button
                  onClick={goPrev}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-emerald-700 transition hover:bg-emerald-50"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToday}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                >
                  Hoy
                </button>
                <button
                  onClick={goNext}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-emerald-700 transition hover:bg-emerald-50"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/90 p-1 shadow-sm backdrop-blur">
                <button
                  type="button"
                  onClick={() => setView('day')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${view === 'day' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'}`}
                  aria-pressed={view === 'day'}
                >
                  <Clock className="h-4 w-4" />
                  Día
                </button>
                <button
                  type="button"
                  onClick={() => setView('week')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${view === 'week' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'}`}
                  aria-pressed={view === 'week'}
                >
                  <Calendar className="h-4 w-4" />
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setView('month')}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${view === 'month' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'}`}
                  aria-pressed={view === 'month'}
                >
                  <CalendarDays className="h-4 w-4" />
                  Mes
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,2.4fr)_minmax(280px,1fr)]">
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-2">
                      <Filter className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-emerald-900">Herramientas de filtro</h2>
                      <p className="text-sm text-emerald-700/80">Personaliza la vista de tu agenda</p>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <X className="h-4 w-4" />
                      Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusSummary.map(({ status, filtered, total }) => {
                    const active = statusFilter.includes(status)
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleStatus(status)}
                        aria-pressed={active}
                        className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'}`}
                      >
                        <span className={`${styles.badge} ${styles[`status_${status}`]}`} />
                        <span>{getStatusLabel(status)}</span>
                        <span className={`text-xs ${active ? 'text-emerald-100' : 'text-emerald-700/70'}`}>
                          {filtered}/{total}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-4 border-t border-emerald-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar por paciente, título o notas"
                      className="w-full rounded-xl border border-emerald-200 bg-white py-2.5 pl-10 pr-10 text-sm text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 transition hover:text-emerald-600"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-700/80">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                      <Calendar className="h-3 w-3" />
                      {periodLabel}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {statusFilter.length ? statusFilter.map((status) => getStatusLabel(status)).join(', ') : 'Todos los estados'}
                    </span>
                    {search && (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                        Buscando &ldquo;{search}&rdquo;
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {filteredAppointments.length} turnos en la vista
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    <span className="text-sm font-semibold">Cargando agenda...</span>
                  </div>
                </div>
              )}
              <div className={loading ? 'pointer-events-none opacity-40' : ''}>
                {view === 'day' && (
                  <DayView
                    date={date}
                    items={byDay(date).filter((appointment) => filteredAppointments.includes(appointment))}
                    onOpen={(appointment, element, point) => {
                      if (lastHoverIdRef.current !== appointment.id) {
                        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                        lastHoverIdRef.current = appointment.id
                      }
                      const doOpen = () => {
                        setActive(appointment)
                        setAnchorEl(element)
                        const rect = element.getBoundingClientRect()
                        setAnchorRect(rect)
                        if (point) {
                          setAnchorOffset({ dx: point.x - rect.left, dy: point.y - rect.top })
                        } else {
                          setAnchorOffset(null)
                        }
                      }
                      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                      hoverTimerRef.current = window.setTimeout(doOpen, 400)
                    }}
                    onHoverLeave={() => {
                      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                    }}
                    onClickOpen={(appointment: Appointment) => navigateToAppointment(appointment)}
                  />
                )}
                {view === 'week' && (
                  <WeekView
                    days={weekDays}
                    items={filteredAppointments}
                    onOpen={(appointment, element) => {
                      if (lastHoverIdRef.current !== appointment.id) {
                        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                        lastHoverIdRef.current = appointment.id
                      }
                      const doOpen = () => {
                        setActive(appointment)
                        setAnchorEl(element)
                        setAnchorRect(element.getBoundingClientRect())
                        setAnchorOffset(null)
                      }
                      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                      hoverTimerRef.current = window.setTimeout(doOpen, 400)
                    }}
                    onHoverLeave={() => {
                      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                    }}
                    onClickOpen={(appointment: Appointment) => navigateToAppointment(appointment)}
                  />
                )}
                {view === 'month' && (
                  <MonthView
                    date={date}
                    items={filteredAppointments}
                    onSelectDay={(selectedDate) => {
                      setDate(selectedDate)
                      setView('day')
                    }}
                    onOpen={(appointment, element) => {
                      if (lastHoverIdRef.current !== appointment.id) {
                        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                        lastHoverIdRef.current = appointment.id
                      }
                      const doOpen = () => {
                        setActive(appointment)
                        setAnchorEl(element)
                        setAnchorRect(element.getBoundingClientRect())
                        setAnchorOffset(null)
                      }
                      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                      hoverTimerRef.current = window.setTimeout(doOpen, 400)
                    }}
                    onHoverLeave={() => {
                      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                    }}
                    onClickOpen={(appointment: Appointment) => navigateToAppointment(appointment)}
                  />
                )}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <StatusLegend summary={statusSummary} total={filteredAppointments.length} />
          </aside>
        </section>

        <AppointmentPopover
          appointment={active}
          anchorRect={anchorRect}
          anchorOffset={anchorOffset}
          inside={isPointerInside}
          onClose={() => {
            setActive(null)
            setAnchorRect(null)
            setAnchorEl(null)
            setAnchorOffset(null)
          }}
        />
      </div>
    </main>
  )
}

function StatusLegend({ summary, total }: { summary: StatusSummary[]; total: number }) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-2">
            <ListChecks className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">Resumen de estados</h3>
            <p className="text-xs text-emerald-700/70">
              {total > 0 ? `${total} turnos en la vista actual` : 'Sin turnos en la vista actual'}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {summary.map(({ status, filtered, total: stateTotal, percentage }) => (
          <div key={status} className="flex items-center gap-3">
            <span className={`${styles.badge} ${styles[`status_${status}`]}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm font-medium text-emerald-900">
                <span>{getStatusLabel(status)}</span>
                <span className="text-xs font-semibold text-emerald-700/80">{filtered}</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-emerald-50">
                <div
                  className={`${styles[`status_${status}`]} h-full rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-emerald-700/70">
                {stateTotal > 0 ? `${filtered} de ${stateTotal} turnos (${percentage}%)` : 'Sin turnos con este estado'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({
  date,
  items,
  onOpen,
  onHoverLeave,
  onClickOpen,
}: {
  date: Date
  items: Appointment[]
  onOpen: (appointment: Appointment, element: HTMLElement, point?: { x: number; y: number }) => void
  onHoverLeave: () => void
  onClickOpen: (appointment: Appointment) => void
}) {
  const hours = Array.from({ length: getHoursRange().endHour - getHoursRange().startHour + 1 }, (_, i) => getHoursRange().startHour + i)
  const hourHeight = 56
  return (
    <div
      className={styles.dayContainer}
      aria-label={`Agenda del ${date.toLocaleDateString(LOCALE)}`}
      style={{ ['--hour-height']: `${hourHeight}px`, ['--hours-count']: hours.length } as React.CSSProperties}
    >
      <div className={styles.dayHeader}>
        <div className={styles.timeCol} />
        <div className={styles.headerCell}>
          <div className={styles.headerDayName}>{date.toLocaleDateString(LOCALE, { weekday: 'long' })}</div>
          <div className={styles.headerDayNum}>{date.getDate()}</div>
        </div>
      </div>
      <div className={styles.dayScroll}>
        <div className={styles.dayGrid}>
          <div className={styles.timeCol}>
            {hours.map((hour) => (
              <div key={hour} className={styles.timeCell}>
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div className={styles.dayCol}>
            <div className={styles.eventsLayer}>
              {items.map((appointment) => {
                const start = new Date(appointment.start)
                const end = new Date(appointment.end)
                const timeLabel = `${start.toLocaleTimeString(LOCALE, {
                  hour: '2-digit',
                  minute: '2-digit',
                })} – ${end.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })}`
                const patientOrTitle = appointment.title || 'Turno sin título'
                const notePreview = appointment.notes?.trim()
                const statusLabel = getStatusLabel(appointment.status)
                const topPx = Math.max(0, (minutesSinceStartOfGrid(start) / 60) * hourHeight)
                const heightPx = Math.max(24, ((end.getTime() - start.getTime()) / 60000 / 60) * hourHeight)
                const isCompact = heightPx < 72
                const isTiny = heightPx < 48
                const eventClassName = [
                  styles.event,
                  styles[`status_${appointment.status}`],
                  isCompact ? styles.eventCompact : '',
                  isTiny ? styles.eventTiny : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                const eventTitleClass = [
                  styles.eventTitle,
                  isCompact ? styles.eventTitleCompact : '',
                  isTiny ? styles.eventTitleTiny : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div
                    key={appointment.id}
                    className={eventClassName}
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    title={`${patientOrTitle} · ${statusLabel} · ${timeLabel}`}
                    onMouseEnter={(event) => {
                      onOpen(appointment, event.currentTarget as HTMLElement, {
                        x: event.clientX,
                        y: event.clientY,
                      })
                    }}
                    onMouseMove={(event) => {
                      onOpen(appointment, event.currentTarget as HTMLElement, {
                        x: event.clientX,
                        y: event.clientY,
                      })
                    }}
                    onMouseLeave={() => {
                      onHoverLeave()
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      onClickOpen(appointment)
                    }}
                  >
                    <div className={styles.eventHeader}>
                      <span className={styles.eventTime}>{timeLabel}</span>
                      {isTiny ? (
                        <span
                          className={`${styles.eventStatusDot} ${styles[`status_${appointment.status}`]}`}
                          aria-label={statusLabel}
                          title={statusLabel}
                        />
                      ) : (
                        <span className={`${styles.eventStatus} ${styles[`status_${appointment.status}`]}`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className={eventTitleClass}>
                      <span className={styles.ellipsis}>{patientOrTitle}</span>
                    </div>
                    {!isTiny && notePreview && (
                      <div className={styles.eventNotes}>
                        <span className={styles.ellipsis}>{notePreview}</span>
                      </div>
                    )}
                    {isTiny && notePreview && (
                      <div className={styles.eventNotesCompact}>
                        <span className={styles.ellipsis}>{notePreview}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className={styles.hourLines}>
              {hours.map((hour) => (
                <div key={hour} className={styles.hourLine} />
              ))}
              <div className={styles.hourLineBottom} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekView({
  days,
  items,
  onOpen,
  onHoverLeave,
  onClickOpen,
}: {
  days: Date[]
  items: Appointment[]
  onOpen: (appointment: Appointment, element: HTMLElement) => void
  onHoverLeave: () => void
  onClickOpen: (appointment: Appointment) => void
}) {
  const hours = Array.from({ length: getHoursRange().endHour - getHoursRange().startHour + 1 }, (_, i) => getHoursRange().startHour + i)
  const hourHeight = 56

  function itemsForDay(d: Date) {
    return items.filter((appointment) => {
      const start = new Date(appointment.start)
      return start.toDateString() === d.toDateString()
    })
  }

  return (
    <div
      className={styles.weekGrid}
      style={{ ['--hour-height']: `${hourHeight}px`, ['--hours-count']: hours.length } as React.CSSProperties}
    >
      <div className={styles.gridHeader}>
        <div className={styles.cornerCell} />
        {days.map((day) => (
          <div key={day.toISOString()} className={styles.headerCell}>
            <div className={styles.headerDayName}>{day.toLocaleDateString(LOCALE, { weekday: 'short' })}</div>
            <div className={styles.headerDayNum}>{day.getDate()}</div>
          </div>
        ))}
      </div>
      <div className={styles.gridBody}>
        <div className={styles.timeCol}>
          {hours.map((hour) => (
            <div key={hour} className={styles.timeCell}>
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((day) => (
          <div key={day.toISOString()} className={styles.dayCol}>
            <div className={styles.eventsLayer}>
              {itemsForDay(day).map((appointment) => {
                const start = new Date(appointment.start)
                const end = new Date(appointment.end)
                const timeLabel = `${start.toLocaleTimeString(LOCALE, {
                  hour: '2-digit',
                  minute: '2-digit',
                })} – ${end.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })}`
                const patientOrTitle = appointment.title || 'Turno sin título'
                const notePreview = appointment.notes?.trim()
                const statusLabel = getStatusLabel(appointment.status)
                const topPx = Math.max(0, (minutesSinceStartOfGrid(start) / 60) * hourHeight)
                const heightPx = Math.max(24, ((end.getTime() - start.getTime()) / 60000 / 60) * hourHeight)
                const isCompact = heightPx < 72
                const isTiny = heightPx < 48
                const eventClassName = [
                  styles.event,
                  styles[`status_${appointment.status}`],
                  isCompact ? styles.eventCompact : '',
                  isTiny ? styles.eventTiny : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                const eventTitleClass = [
                  styles.eventTitle,
                  isCompact ? styles.eventTitleCompact : '',
                  isTiny ? styles.eventTitleTiny : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div
                    key={appointment.id}
                    className={eventClassName}
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    title={`${patientOrTitle} · ${statusLabel} · ${timeLabel}`}
                    onMouseEnter={(event) => {
                      onOpen(appointment, event.currentTarget as HTMLElement)
                    }}
                    onMouseMove={(event) => {
                      onOpen(appointment, event.currentTarget as HTMLElement)
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      onClickOpen(appointment)
                    }}
                    onMouseLeave={() => {
                      onHoverLeave()
                    }}
                  >
                    <div className={styles.eventHeader}>
                      <span className={styles.eventTime}>{timeLabel}</span>
                      {isTiny ? (
                        <span
                          className={`${styles.eventStatusDot} ${styles[`status_${appointment.status}`]}`}
                          aria-label={statusLabel}
                          title={statusLabel}
                        />
                      ) : (
                        <span className={`${styles.eventStatus} ${styles[`status_${appointment.status}`]}`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className={eventTitleClass}>
                      <span className={styles.ellipsis}>{patientOrTitle}</span>
                    </div>
                    {!isTiny && notePreview && (
                      <div className={styles.eventNotes}>
                        <span className={styles.ellipsis}>{notePreview}</span>
                      </div>
                    )}
                    {isTiny && notePreview && (
                      <div className={styles.eventNotesCompact}>
                        <span className={styles.ellipsis}>{notePreview}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className={styles.hourLines}>
              {hours.map((hour) => (
                <div key={hour} className={styles.hourLine} />
              ))}
              <div className={styles.hourLineBottom} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthView({
  date,
  items,
  onSelectDay,
  onOpen,
  onHoverLeave,
  onClickOpen,
}: {
  date: Date
  items: Appointment[]
  onSelectDay: (day: Date) => void
  onOpen: (appointment: Appointment, element: HTMLElement) => void
  onHoverLeave: () => void
  onClickOpen: (appointment: Appointment) => void
}) {
  const start = startOfWeek(startOfMonth(date))
  const end = endOfWeek(endOfMonth(date))
  const days: Date[] = []
  const msPerDay = 24 * 60 * 60 * 1000
  const totalDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1
  for (let i = 0; i < totalDays; i++) {
    const day = new Date(start.getTime() + i * msPerDay)
    days.push(day)
  }

  function itemsForDay(d: Date) {
    return items.filter((appointment) => {
      const startDate = new Date(appointment.start)
      return startDate.toDateString() === d.toDateString()
    })
  }

  const currentMonth = date.getMonth()

  return (
    <div className={styles.monthGrid}>
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => (
        <div key={label} className={styles.monthHeaderCell}>
          {label}
        </div>
      ))}
      {days.map((day) => (
        <button
          key={day.toISOString()}
          className={`${styles.monthCell} ${day.getMonth() === currentMonth ? '' : styles.monthCellMuted}`}
          onClick={() => onSelectDay(day)}
        >
          <div className={styles.monthCellDateWrap}>
            <span className={styles.monthCellDate}>{day.getDate()}</span>
            {itemsForDay(day).length > 0 && (
              <span className={`${styles.countBadge} ${itemsForDay(day).length > 6 ? styles.countBadgeDense : ''}`}>
                {itemsForDay(day).length}
              </span>
            )}
          </div>
          {(() => {
            const itemsFor = itemsForDay(day)
            const dense = itemsFor.length > 3
            const max = dense ? 6 : 4
            return (
              <div className={`${styles.monthEvents} ${dense ? styles.monthEventsDense : ''}`}>
                {itemsFor.slice(0, max).map((appointment) => {
                  const start = new Date(appointment.start)
                  const end = new Date(appointment.end)
                  const timeLabel = `${start.toLocaleTimeString(LOCALE, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} – ${end.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })}`
                  const statusLabel = getStatusLabel(appointment.status)
                  const displayTitle = appointment.title || 'Turno sin título'
                  return (
                    <div
                      key={appointment.id}
                      className={`${styles.monthEvent} ${styles[`status_${appointment.status}`]} status_${appointment.status}`}
                      title={`${appointment.title} · ${statusLabel} · ${timeLabel}`}
                      onMouseEnter={(event) => {
                        event.stopPropagation()
                        onOpen(appointment, event.currentTarget as HTMLElement)
                      }}
                      onMouseMove={(event) => {
                        event.stopPropagation()
                        onOpen(appointment, event.currentTarget as HTMLElement)
                      }}
                      onMouseLeave={() => {
                        if (onHoverLeave) onHoverLeave()
                      }}
                      onClick={(event) => {
                        event.stopPropagation()
                        event.preventDefault()
                        onClickOpen(appointment)
                      }}
                    >
                      <div className={styles.monthEventHeader}>
                        <span className={styles.monthEventTime}>{timeLabel}</span>
                        <span className={`${styles.monthEventStatus} ${styles[`status_${appointment.status}`]}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <span className={`${styles.ellipsis} ${styles.monthEventTitle}`}>{displayTitle}</span>
                    </div>
                  )
                })}
                {itemsFor.length > max && <div className={styles.more}>+{itemsFor.length - max} más</div>}
              </div>
            )
          })()}
        </button>
      ))}
    </div>
  )
}

function AppointmentPopover({
  appointment,
  anchorRect,
  anchorOffset,
  inside,
  onClose,
}: {
  appointment: Appointment | null
  anchorRect: DOMRect | null
  anchorOffset?: { dx: number; dy: number } | null
  inside: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [obs, setObs] = useState<string>('')

  const appointmentId = appointment?.id ?? null

  useLayoutEffect(() => {
    if (!appointment || !anchorRect) return
    const element = ref.current
    const margin = 12
    const fallbackWidth = 320
    const fallbackHeight = 160
    const width = element?.offsetWidth ?? fallbackWidth
    const height = element?.offsetHeight ?? fallbackHeight

    let baseX: number
    let baseY: number
    if (anchorOffset) {
      baseX = anchorRect.left + anchorOffset.dx
      baseY = anchorRect.top + anchorOffset.dy
    } else {
      baseX = anchorRect.right
      baseY = anchorRect.top
    }

    let x = baseX + margin
    if (x + width > window.innerWidth - margin) x = baseX - width - margin
    if (x < margin) x = margin

    let y = anchorOffset ? baseY - height / 2 : baseY
    if (y + height > window.innerHeight - margin) y = window.innerHeight - height - margin
    if (y < margin) y = margin

    setPos({ x, y })
  }, [appointment, anchorRect, anchorOffset])

  useEffect(() => {
    if (!appointmentId) return
    let cancelled = false

    setObs((appointment?.notes ?? '').trim())

    async function fetchObs() {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/observaciones`, { cache: 'no-store' })
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json()
            const text = (data?.text ?? '').trim()
            setObs(text || 'Sin observaciones.')
          } else if (res.status === 404) {
            setObs('Sin observaciones.')
          } else {
            setObs('Sin observaciones.')
          }
        }
      } catch {
        if (!cancelled) setObs('Sin observaciones.')
      }
    }

    if (inside) fetchObs()

    const handler = (event: Event) => {
      const detailId = (event as CustomEvent).detail?.id as string | undefined
      if (detailId && detailId === appointmentId) fetchObs()
    }
    window.addEventListener('obs:saved', handler as EventListener)

    return () => {
      cancelled = true
      window.removeEventListener('obs:saved', handler as EventListener)
    }
  }, [appointmentId, inside, appointment?.notes])

  if (!appointment || !anchorRect || !pos) return null

  const start = new Date(appointment.start)
  const end = new Date(appointment.end)

  return (
    <div className={styles.popoverBackdrop} onClick={onClose}>
      <div
        ref={ref}
        className={styles.popover}
        style={{ top: pos.y, left: pos.x }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.popoverHeader}>
          <div className={`${styles.popoverStatus} ${styles[`status_${appointment.status}`]}`} />
          <div className={styles.popoverTitle}>{appointment.title}</div>
        </div>
        <div className={styles.popoverSection}>
          <div className={styles.popoverLabel}>
            <Clock className="mr-1 inline h-3 w-3" />
            Horario
          </div>
          <div className={styles.popoverValue}>
            {start.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })} –{' '}
            {end.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className={styles.popoverSection}>
          <div className={styles.popoverLabel}>
            <Filter className="mr-1 inline h-3 w-3" />
            Estado
          </div>
          <div className={styles.popoverValue}>{getStatusLabel(appointment.status)}</div>
        </div>
        {appointment.patientId && (
          <div className={styles.popoverSection}>
            <div className={styles.popoverLabel}>
              <Users className="mr-1 inline h-3 w-3" />
              Paciente
            </div>
            <Link
              href={`/profesional/pacientes?patientId=${appointment.patientId}`}
              className="font-medium text-emerald-600 underline transition-colors hover:text-emerald-700"
            >
              <Eye className="mr-1 inline h-4 w-4" />
              Ver ficha completa
            </Link>
          </div>
        )}
        <div className={styles.popoverSection}>
          <div className={styles.popoverLabel}>Observaciones</div>
          <div className={styles.popoverNotes}>{obs || 'Sin observaciones.'}</div>
        </div>
        <div className={styles.popoverActionsInfo}>Haz click fuera para cerrar</div>
      </div>
    </div>
  )
}
