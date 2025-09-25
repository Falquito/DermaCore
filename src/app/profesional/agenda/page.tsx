'use client'
import ProfesionalSidebar from '@/components/ui/profesional-sidebar'
import ProfesionalTopbar from '@/components/ui/profesional-topbar'
import React, { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react'
import styles from './agenda.module.css'
import { AppointmentStatus } from '@prisma/client'

// UI-specific appointment type (transformed from Prisma Appointment)
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

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROGRAMADO: 'Programado',
  CONFIRMADO: 'Confirmado',
  EN_SALA_DE_ESPERA: 'En sala de espera',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
  NO_ASISTIO: 'No asistió',
}

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
// removed percent-based totalGridMinutes; using px-based layout now



export default function AgendaPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [active, setActive] = useState<Appointment | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [anchorOffset, setAnchorOffset] = useState<{ dx: number; dy: number } | null>(null) // click offset within anchor (day view)
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus[]>([])
  const [search, setSearch] = useState('')
  const hoverTimerRef = useRef<number | null>(null)
  const lastHoverIdRef = useRef<string | null>(null)

  // Track anchor element rect on scroll/resize for dynamic popover positioning
  useEffect(() => {
    if (!active || !anchorEl) return
    function update() {
      if (!anchorEl) return
      const rect = anchorEl.getBoundingClientRect()
      setAnchorRect(rect)
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
      } catch (e) {
        console.error('Agenda fetch error', e)
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
    const locale = undefined
    if (view === 'day') {
      return date.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
    }
    if (view === 'week') {
      const s = startOfWeek(date)
      const e = endOfWeek(date)
      const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
      if (sameMonth) {
        return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString(locale, { month: 'short', year: 'numeric' })}`
      }
      return `${s.getDate()} ${s.toLocaleDateString(locale, { month: 'short' })} – ${e.getDate()} ${e.toLocaleDateString(locale, { month: 'short', year: 'numeric' })}`
    }
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
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

  function navigateToAppointment(a: Appointment) {
    // Redirige a la nueva página de consulta
    window.location.href = `/profesional/agenda/consulta?id=${a.id}`;
  }

  function byDay(d: Date) {
    const y = d.getFullYear()
    const m = d.getMonth()
    const day = d.getDate()
    return appointments.filter((a) => {
      const s = new Date(a.start)
      return s.getFullYear() === y && s.getMonth() === m && s.getDate() === day
    })
  }

  const toggleStatus = (s: AppointmentStatus) => {
    setActive(null)
    setAnchorRect(null)
    setAnchorEl(null)
    setAnchorOffset(null)
    setStatusFilter((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const clearFilters = () => {
    setStatusFilter([])
    setSearch('')
  }

  const filteredAppointments = useMemo(() => {
    // Server already filters, but keep client-side guard if user changes quickly
    let data = appointments
    if (statusFilter.length) data = data.filter(a => statusFilter.includes(a.status))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      data = data.filter(a => a.title.toLowerCase().includes(q) || a.notes?.toLowerCase().includes(q) || a.patientId?.toLowerCase().includes(q))
    }
    return data
  }, [appointments, statusFilter, search])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ProfesionalSidebar 
        userRole="PROFESIONAL" 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <ProfesionalTopbar 
          userName="Dr. Profesional"
          userEmail="doctor@carelink.com"
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
        {/* Agenda Content */}
  <main className="px-6 lg:px-8 py-6 space-y-4 w-full">
          <div className="flex flex-col gap-3">
            <div className={`flex flex-wrap items-center gap-2 bg-white ${styles.borderAgenda} rounded-lg p-3 shadow-sm`}>
              <div className="flex items-center gap-2">
                <button onClick={goPrev} className={`inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs md:text-sm hover:bg-emerald-50 ${styles.borderCtrl} ${styles.textAgenda}`} aria-label="Anterior">‹</button>
                <button onClick={goToday} className={`inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs md:text-sm hover:bg-emerald-50 ${styles.borderCtrl} ${styles.textAgenda}`}>Hoy</button>
                <button onClick={goNext} className={`inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs md:text-sm hover:bg-emerald-50 ${styles.borderCtrl} ${styles.textAgenda}`} aria-label="Siguiente">›</button>
              </div>
              <span className={`text-sm font-medium ml-1 ${styles.textAgenda}`}>{periodLabel}</span>
              <div className={`inline-flex rounded-lg border ${styles.borderCtrl} overflow-hidden ml-auto`}>
                <button className={view === 'day' ? styles.viewActiveTail : styles.viewBtnTail} onClick={() => setView('day')}><span >Día</span></button>
                <button className={view === 'week' ? styles.viewActiveTail : styles.viewBtnTail} onClick={() => setView('week')}><span >Semana</span></button>
                <button className={view === 'month' ? styles.viewActiveTail : styles.viewBtnTail} onClick={() => setView('month')}><span >Mes</span></button>
              </div>
            </div>
            <div className={`flex flex-col gap-2 bg-white ${styles.borderAgenda} rounded-lg p-3 shadow-sm`}>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 flex-wrap items-center">
                  {(Object.values(AppointmentStatus) as AppointmentStatus[]).map(s => {
                    const active = statusFilter.includes(s)
                    return (
                      <button key={s} type="button" onClick={() => toggleStatus(s)}
                        className={`px-2.5 py-1 text-xs md:text-sm rounded-md border ${active ? 'bg-emerald-600 text-white border-emerald-600' : `bg-white ${styles.textAgenda} ${styles.borderCtrl} hover:bg-emerald-50`}`}
                      ><span >{STATUS_LABELS[s]}</span></button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2 ml-auto w-full md:w-auto">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar (paciente, título, nota)" 
                    className={`flex-1 md:flex-none md:w-64 rounded-md border ${styles.borderCtrl} px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${styles.textAgenda}`}
                  />
                  {(statusFilter.length > 0 || search.trim()) && (
                    <button onClick={clearFilters} className={`text-xs hover:underline ${styles.textAgenda}`}>Limpiar</button>
                  )}
                </div>
              </div>
              <div className={`text-[11px] md:text-xs flex flex-wrap gap-3 ${styles.textAgenda}`}>
                <span>Filtrando: {statusFilter.length ? statusFilter.map(s=>STATUS_LABELS[s]).join(', ') : 'Todos los estados'}</span>
                {search && <span>Búsqueda: “{search}”</span>}
                <span>Total: {filteredAppointments.length}</span>
              </div>
            </div>
            <StatusLegend />
          </div>

          {loading && <div className="text-sm text-emerald-700">Cargando…</div>}

          {view === 'day' && <DayView date={date} items={byDay(date).filter(a => filteredAppointments.includes(a))} onOpen={(a, el, point) => {
            // Hover delay (200ms)
            if (lastHoverIdRef.current !== a.id) {
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
              lastHoverIdRef.current = a.id
            }
            const doOpen = () => {
              setActive(a)
              setAnchorEl(el)
              const rect = el.getBoundingClientRect()
              setAnchorRect(rect)
              if (point) {
                setAnchorOffset({ dx: point.x - rect.left, dy: point.y - rect.top })
              } else {
                setAnchorOffset(null)
              }
            }
            if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = window.setTimeout(doOpen, 400)
          }} onHoverLeave={() => { if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current) }} onClickOpen={(a: Appointment) => navigateToAppointment(a)} />}
          {view === 'week' && <WeekView days={weekDays} items={filteredAppointments} onOpen={(a, el) => {
            if (lastHoverIdRef.current !== a.id) {
              if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
              lastHoverIdRef.current = a.id
            }
            const doOpen = () => {
              setActive(a)
              setAnchorEl(el)
              setAnchorRect(el.getBoundingClientRect())
              setAnchorOffset(null)
            }
            if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = window.setTimeout(doOpen, 400)
          }} onHoverLeave={() => { if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current) }} onClickOpen={(a: Appointment) => navigateToAppointment(a)} />} 
          {view === 'month' && (
            <MonthView
              date={date}
              items={filteredAppointments}
              onSelectDay={(d) => {
                setDate(d)
                setView('day')
              }}
              onOpen={(a, el) => {
                if (lastHoverIdRef.current !== a.id) {
                  if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                  lastHoverIdRef.current = a.id
                }
                const doOpen = () => {
                  setActive(a)
                  setAnchorEl(el)
                  setAnchorRect(el.getBoundingClientRect())
                  setAnchorOffset(null)
                }
                if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current)
                hoverTimerRef.current = window.setTimeout(doOpen, 400)
              }}
              onHoverLeave={() => { if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current) }}
              onClickOpen={(a: Appointment) => navigateToAppointment(a)}
            />
          )}
          <AppointmentPopover
            appointment={active}
            anchorRect={anchorRect}
            anchorOffset={anchorOffset}
            onClose={() => {
              setActive(null)
              setAnchorRect(null)
              setAnchorEl(null)
              setAnchorOffset(null)
            }}
          />
        </main>
      </div>
    </div>
  )
}

function StatusLegend() {
  return (
    <div className={styles.legend}> 
      {(Object.values(AppointmentStatus) as AppointmentStatus[]).map((s) => (
        <div key={s} className={styles.legendItem}>
          <span className={`${styles.badge} ${styles[`status_${s}`]}`} />
          <span>{STATUS_LABELS[s]}</span>
        </div>
      ))}
    </div>
  )
}

function DayView({ date, items, onOpen, onHoverLeave, onClickOpen }: { date: Date; items: Appointment[]; onOpen: (a: Appointment, el: HTMLElement, point?: { x: number; y: number }) => void; onHoverLeave: () => void; onClickOpen: (a: Appointment) => void }) {
  const hours = Array.from({ length: getHoursRange().endHour - getHoursRange().startHour + 1 }, (_, i) => getHoursRange().startHour + i)
  const hourHeight = 56 // px per hour
  return (
    <div
      className={styles.dayContainer}
      aria-label={`Agenda del ${date.toLocaleDateString()}`}
      style={{ ['--hour-height']: `${hourHeight}px`, ['--hours-count']: hours.length } as React.CSSProperties}
    >
      <div className={styles.dayHeader}>
        <div className={styles.timeCol} />
        <div className={styles.headerCell}>
          <div className={styles.headerDayName}>{date.toLocaleDateString(undefined, { weekday: 'long' })}</div>
          <div className={styles.headerDayNum}>{date.getDate()}</div>
        </div>
      </div>
      <div className={styles.dayScroll}>
        <div className={styles.dayGrid}>
          <div className={styles.timeCol}>
            {hours.map((h) => (
              <div key={h} className={styles.timeCell}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div className={styles.dayCol}>
            <div className={styles.eventsLayer}>
              {items.map((a) => {
                const s = new Date(a.start)
                const e = new Date(a.end)
                const topPx = Math.max(0, (minutesSinceStartOfGrid(s) / 60) * hourHeight)
                const heightPx = Math.max(18, ((e.getTime() - s.getTime()) / 60000 / 60) * hourHeight)
                return (
                  <div
                    key={a.id}
                    className={`${styles.event} ${styles[`status_${a.status}`]} status_${a.status}`}
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    title={`${a.title} (${STATUS_LABELS[a.status]})`}
                    onMouseEnter={(e) => { onOpen(a, e.currentTarget as HTMLElement, { x: e.clientX, y: e.clientY }) }}
                    onMouseMove={(e) => { onOpen(a, e.currentTarget as HTMLElement, { x: e.clientX, y: e.clientY }) }}
                    onMouseLeave={() => { onHoverLeave() }}
                    onClick={(e) => { e.stopPropagation(); onClickOpen(a) }}
                  >
                    <div className={styles.eventTitle}>
                      <span className={styles.ellipsis}>{a.title}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.hourLines}>
              {hours.map((h) => (
                <div key={h} className={styles.hourLine} />
              ))}
              {/* Dedicated bottom border for last row */}
              <div className={styles.hourLineBottom} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekView({ days, items, onOpen, onHoverLeave, onClickOpen }: { days: Date[]; items: Appointment[]; onOpen: (a: Appointment, el: HTMLElement) => void; onHoverLeave: () => void; onClickOpen: (a: Appointment) => void }) {
  const hours = Array.from({ length: getHoursRange().endHour - getHoursRange().startHour + 1 }, (_, i) => getHoursRange().startHour + i)
  const hourHeight = 56

  function itemsForDay(d: Date) {
    return items.filter((a) => {
      const s = new Date(a.start)
      return s.toDateString() === d.toDateString()
    })
  }

  return (
    <div
      className={styles.weekGrid}
      style={{ ['--hour-height']: `${hourHeight}px`, ['--hours-count']: hours.length } as React.CSSProperties}
    >
      <div className={styles.gridHeader}>
        <div className={styles.cornerCell} />
        {days.map((d) => (
          <div key={d.toISOString()} className={styles.headerCell}>
            <div className={styles.headerDayName}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
            <div className={styles.headerDayNum}>{d.getDate()}</div>
          </div>
        ))}
      </div>
      <div className={styles.gridBody}>
        <div className={styles.timeCol}>
          {hours.map((h) => (
            <div key={h} className={styles.timeCell}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((d) => (
          <div key={d.toISOString()} className={styles.dayCol}>
            <div className={styles.eventsLayer}>
              {itemsForDay(d).map((a) => {
                const s = new Date(a.start)
                const e = new Date(a.end)
                const topPx = Math.max(0, (minutesSinceStartOfGrid(s) / 60) * hourHeight)
                const heightPx = Math.max(18, ((e.getTime() - s.getTime()) / 60000 / 60) * hourHeight)
                return (
                  <div
                    key={a.id}
                    className={`${styles.event} ${styles[`status_${a.status}`]} status_${a.status}`}
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    title={`${a.title} (${STATUS_LABELS[a.status]})`}
                    onMouseEnter={(e) => { onOpen(a, e.currentTarget as HTMLElement) }}
                    onMouseMove={(e) => { onOpen(a, e.currentTarget as HTMLElement) }}
                    onClick={(e) => { e.stopPropagation(); onClickOpen(a) }}
                    onMouseLeave={() => { onHoverLeave() }}
                  >
                    <div className={styles.eventTitle}>
                      <span className={styles.ellipsis}>{a.title}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.hourLines}>
              {hours.map((h) => (
                <div key={h} className={styles.hourLine} />
              ))}
              {/* Dedicated bottom border for last row */}
              <div className={styles.hourLineBottom} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

  function MonthView({ date, items, onSelectDay, onOpen, onHoverLeave, onClickOpen }: { date: Date; items: Appointment[]; onSelectDay: (d: Date) => void; onOpen: (a: Appointment, el: HTMLElement) => void; onHoverLeave: () => void; onClickOpen: (a: Appointment) => void }) {
  const start = startOfWeek(startOfMonth(date))
  const end = endOfWeek(endOfMonth(date))
  const days: Date[] = []
  {
    const msPerDay = 24 * 60 * 60 * 1000
    const totalDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start.getTime() + i * msPerDay)
      days.push(d)
    }
  }
  function itemsForDay(d: Date) {
    return items.filter((a) => {
      const s = new Date(a.start)
      return s.toDateString() === d.toDateString()
    })
  }
  const currentMonth = date.getMonth()

  return (
    <div className={styles.monthGrid}>
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((lbl) => (
        <div key={lbl} className={styles.monthHeaderCell}>
          {lbl}
        </div>
      ))}
      {days.map((d) => (
        <button
          key={d.toISOString()}
          className={`${styles.monthCell} ${d.getMonth() === currentMonth ? '' : styles.monthCellMuted}`}
          onClick={() => onSelectDay(d)}
        >
          <div className={styles.monthCellDateWrap}>
            <span className={styles.monthCellDate}>{d.getDate()}</span>
            {itemsForDay(d).length > 0 && (
              <span className={`${styles.countBadge} ${itemsForDay(d).length > 6 ? styles.countBadgeDense : ''}`}>{itemsForDay(d).length}</span>
            )}
          </div>
          {(() => {
            const itemsFor = itemsForDay(d)
            const max = 3;
            return (
              <div className={styles.monthEvents}>
                {itemsFor.slice(0, max).map((a) => (
                  <div key={a.id} className={`${styles.monthEvent} ${styles[`status_${a.status}`]} status_${a.status}`}
                    onMouseEnter={(e) => { e.stopPropagation(); onOpen(a, e.currentTarget as HTMLElement) }}
                    onMouseMove={(e) => { e.stopPropagation(); onOpen(a, e.currentTarget as HTMLElement) }}
                    onMouseLeave={() => { if (onHoverLeave) onHoverLeave() }}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClickOpen(a) }}
                  >
                    <span className={styles.monthEventDot} />
                    <span className={styles.ellipsis}>{a.title}</span>
                  </div>
                ))}
                {itemsFor.length > max && <div className={styles.more}>+{itemsFor.length - max} más</div>}
              </div>
            )
          })()}
        </button>
      ))}
    </div>
  )
}

// Popover component with intelligent positioning
function AppointmentPopover({ appointment, anchorRect, anchorOffset, onClose }: { appointment: Appointment | null; anchorRect: DOMRect | null; anchorOffset?: { dx: number; dy: number } | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    if (!appointment || !anchorRect) return
    const el = ref.current
    const margin = 8
    const fallbackWidth = 260
    const fallbackHeight = 140
    const width = el?.offsetWidth ?? fallbackWidth
    const height = el?.offsetHeight ?? fallbackHeight

    // Base coordinates: if anchorOffset provided (day view click) use click point; else anchor top-right
    let baseX: number
    let baseY: number
    if (anchorOffset) {
      baseX = anchorRect.left + anchorOffset.dx
      baseY = anchorRect.top + anchorOffset.dy
    } else {
      baseX = anchorRect.right
      baseY = anchorRect.top
    }

    // Prefer placing to the right of click/anchor
    let x = baseX + margin
    // If overflow right, try left of anchor/point
    if (x + width > window.innerWidth - margin) {
      x = baseX - width - margin
    }
    if (x < margin) x = margin

    // Vertical: center around click point if possible when using offset, else align top
    let y: number
    if (anchorOffset) {
      y = baseY - height / 2
    } else {
      y = baseY
    }
    if (y + height > window.innerHeight - margin) {
      y = window.innerHeight - height - margin
    }
    if (y < margin) y = margin
    setPos({ x, y })
  }, [appointment, anchorRect, anchorOffset])

  if (!appointment || !anchorRect || !pos) return null
  const s = new Date(appointment.start)
  const e = new Date(appointment.end)
  return (
    <div className={styles.popoverBackdrop} onClick={onClose}>
      <div
        ref={ref}
        className={styles.popover}
        style={{ top: pos.y, left: pos.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.popoverHeader}>
          <span className={styles.popoverStatus + ' ' + styles[`status_${appointment.status}`]} />
          <h3 className={styles.popoverTitle}>{appointment.title}</h3>
        </div>
        <div className={styles.popoverSection}>
          <div className={styles.popoverLabel}>Horario</div>
          <div className={styles.popoverValue}>{s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className={styles.popoverSection}>
          <div className={styles.popoverLabel}>Estado</div>
          <div className={styles.popoverValue}>{STATUS_LABELS[appointment.status]}</div>
        </div>
        {appointment.notes && (
          <div className={styles.popoverSection}>
            <div className={styles.popoverLabel}>Notas</div>
            <div className={styles.popoverNotes}>{appointment.notes}</div>
          </div>
        )}
        <div className={styles.popoverActionsInfo}>Click fuera para cerrar</div>
      </div>
    </div>
  )
}

