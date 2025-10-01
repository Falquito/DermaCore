'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AppointmentStatus } from '@prisma/client'
import {
  Plus,
  Calendar as CalendarIcon,
  CalendarCheck,
  Clock,
  User,
  CreditCard,
  AlertTriangle,
  Users,
  Loader2,
  RefreshCcw,
  Search,
  XCircle,
  CheckCircle2,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FormularioAsignacionTurnos } from '@/components/turnos/FormularioAsignacionTurnos'
import { TurnoCompleto } from '@/types/appointment'

const CANCELABLE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PROGRAMADO,
  AppointmentStatus.CONFIRMADO,
  AppointmentStatus.EN_SALA_DE_ESPERA
]

const estadoConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  [AppointmentStatus.PROGRAMADO]: {
    label: 'Programado',
    className: 'bg-blue-100 text-blue-800 border border-blue-200'
  },
  [AppointmentStatus.CONFIRMADO]: {
    label: 'Confirmado',
    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
  },
  [AppointmentStatus.EN_SALA_DE_ESPERA]: {
    label: 'En sala de espera',
    className: 'bg-amber-100 text-amber-800 border border-amber-200'
  },
  [AppointmentStatus.COMPLETADO]: {
    label: 'Completado',
    className: 'bg-slate-200 text-slate-800 border border-slate-300'
  },
  [AppointmentStatus.CANCELADO]: {
    label: 'Cancelado',
    className: 'bg-rose-100 text-rose-800 border border-rose-200'
  },
  [AppointmentStatus.NO_ASISTIO]: {
    label: 'No asistió',
    className: 'bg-zinc-200 text-zinc-800 border border-zinc-300'
  }
}

function formatFechaLarga(date: Date) {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatHora(date: Date) {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function TurnosPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [turnoRecienCreado, setTurnoRecienCreado] = useState<TurnoCompleto | null>(null)
  const [cancelacionReciente, setCancelacionReciente] = useState<{
    turno: TurnoCompleto
    motivo: string
  } | null>(null)
  const [turnos, setTurnos] = useState<TurnoCompleto[]>([])
  const [cargandoTurnos, setCargandoTurnos] = useState(false)
  const [errorTurnos, setErrorTurnos] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | AppointmentStatus>('TODOS')
  const [filtroProfesional, setFiltroProfesional] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [turnoACancelar, setTurnoACancelar] = useState<TurnoCompleto | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [perfil, setPerfil] = useState<{ id: string; name: string } | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalTurnos, setTotalTurnos] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [resumen, setResumen] = useState({
    total: 0,
    cancelables: 0,
    enSala: 0,
    cancelados: 0,
    completados: 0
  })
  const [proximoTurno, setProximoTurno] = useState<TurnoCompleto | null>(null)
  const [profesionales, setProfesionales] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim())
    }, 400)

    return () => clearTimeout(timeout)
  }, [busqueda])

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroEstado, filtroProfesional, busquedaDebounced])

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas || 1)
    }
  }, [paginaActual, totalPaginas])

  const cargarTurnosHoy = useCallback(async () => {
    try {
      setCargandoTurnos(true)
      setErrorTurnos(null)
      const hoy = new Date()
      const fechaStr = hoy.toISOString().split('T')[0]
      const params = new URLSearchParams()
      params.set('fecha', fechaStr)
      params.set('page', String(paginaActual))
      params.set('pageSize', String(pageSize))
      if (filtroEstado !== 'TODOS') {
        params.set('estado', filtroEstado)
      }
      if (filtroProfesional !== 'TODOS') {
        params.set('profesionalId', filtroProfesional)
      }
      if (busquedaDebounced) {
        params.set('q', busquedaDebounced)
      }

      const response = await fetch(`/api/turnos?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('No se pudo obtener la agenda del día')
      }
      const data = await response.json()
      const turnosObtenidos: TurnoCompleto[] = (data.turnos || []).map((turno: TurnoCompleto) => ({
        ...turno,
        fecha: new Date(turno.fecha),
        createdAt: new Date(turno.createdAt),
        updatedAt: new Date(turno.updatedAt)
      }))
      setTurnos(turnosObtenidos)
      setTotalTurnos(data.total || 0)
      setTotalPaginas(data.totalPages || 1)
      if (data.resumen) {
        setResumen({
          total: data.resumen.total ?? data.total ?? 0,
          cancelables: data.resumen.cancelables ?? 0,
          enSala: data.resumen.enSala ?? 0,
          cancelados: data.resumen.cancelados ?? 0,
          completados: data.resumen.completados ?? 0
        })
      } else {
        setResumen({
          total: data.total || 0,
          cancelables: 0,
          enSala: 0,
          cancelados: 0,
          completados: 0
        })
      }
      if (data.proximoTurno) {
        setProximoTurno({
          ...data.proximoTurno,
          fecha: new Date(data.proximoTurno.fecha),
          createdAt: new Date(data.proximoTurno.createdAt),
          updatedAt: new Date(data.proximoTurno.updatedAt)
        })
      } else {
        setProximoTurno(null)
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      setErrorTurnos('No se pudo cargar la agenda del día. Intente nuevamente.')
    } finally {
      setCargandoTurnos(false)
    }
  }, [busquedaDebounced, filtroEstado, filtroProfesional, pageSize, paginaActual])

  useEffect(() => {
    cargarTurnosHoy()
  }, [cargarTurnosHoy])

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('No se pudo obtener el perfil')
        }
        const data = await response.json()
        if (data.user) {
          setPerfil({
            id: data.user.id,
            name: data.user.name || data.user.email || 'Usuario'
          })
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error)
        setPerfil(null)
      }
    }

    obtenerPerfil()
  }, [])

  useEffect(() => {
    const cargarProfesionales = async () => {
      try {
        const response = await fetch('/api/turnos/profesionales', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de profesionales')
        }
        const data = await response.json()
        const listado = (data.profesionales || []).map((profesional: { id: string; name: string }) => ({
          id: profesional.id,
          name: profesional.name
        }))
        setProfesionales(listado)
      } catch (error) {
        console.error('Error al cargar profesionales:', error)
        setProfesionales([])
      }
    }

    cargarProfesionales()
  }, [])

  const handleTurnoCreado = (turno: TurnoCompleto) => {
    setTurnoRecienCreado(turno)
    setMostrarFormulario(false)
    setPaginaActual(1)
    cargarTurnosHoy()

    setTimeout(() => {
      setTurnoRecienCreado(null)
    }, 5000)
  }

  const cerrarDialogoCancelacion = () => {
    setTurnoACancelar(null)
    setMotivoCancelacion('')
    setErrorCancelacion(null)
  }

  const confirmarCancelacion = async () => {
    if (!turnoACancelar || !perfil) return

    const motivo = motivoCancelacion.trim()
    if (motivo.length < 4) {
      setErrorCancelacion('Ingrese un motivo para registrar la cancelación.')
      return
    }

    try {
      setCancelando(true)
      setErrorCancelacion(null)
      const response = await fetch(`/api/turnos/${turnoACancelar.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo,
          cancelledById: perfil.id
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo cancelar el turno')
      }

      setCancelacionReciente({
        turno: { ...turnoACancelar, estado: AppointmentStatus.CANCELADO },
        motivo
      })
      setTimeout(() => setCancelacionReciente(null), 5000)

      cerrarDialogoCancelacion()
      await cargarTurnosHoy()
    } catch (error) {
      console.error('Error al cancelar turno:', error)
      setErrorCancelacion(error instanceof Error ? error.message : 'No se pudo cancelar el turno')
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600">Agenda del {formatFechaLarga(new Date())}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/mesa-entrada/lista-turnos">Ver agenda completa</Link>
          </Button>

          <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Turno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-full max-w-[95vw] overflow-y-auto p-0 lg:max-w-6xl xl:max-w-7xl">
              <DialogHeader className="border-b px-4 py-4 sm:px-6">
                <DialogTitle>Asignar Nuevo Turno</DialogTitle>
              </DialogHeader>
              <div className="px-4 py-4 sm:px-6">
                <FormularioAsignacionTurnos
                  onTurnoCreado={handleTurnoCreado}
                  onCancel={() => setMostrarFormulario(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {turnoRecienCreado && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-green-900">¡Turno creado exitosamente!</h3>
                <div className="text-sm text-green-800">
                  <p className="mb-2">
                    <strong>Paciente:</strong> {turnoRecienCreado.paciente.apellido}, {turnoRecienCreado.paciente.nombre}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <span className="flex items-center gap-1 text-xs sm:text-sm">
                      <CalendarIcon className="h-3 w-3" />
                      {formatFechaLarga(turnoRecienCreado.fecha)}
                    </span>
                    <span className="flex items-center gap-1 text-xs sm:text-sm">
                      <Clock className="h-3 w-3" />
                      {formatHora(turnoRecienCreado.fecha)}
                    </span>
                    <span className="flex items-center gap-1 text-xs sm:text-sm">
                      <User className="h-3 w-3" />
                      {turnoRecienCreado.profesional.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs sm:text-sm">
                      <CreditCard className="h-3 w-3" />
                      {turnoRecienCreado.tipoConsulta === 'OBRA_SOCIAL' ? 'Obra Social' : 'Particular'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {cancelacionReciente && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-sm text-amber-900">
              <h3 className="mb-1 font-semibold">Turno cancelado</h3>
              <p className="mb-2">
                {cancelacionReciente.turno.paciente.apellido}, {cancelacionReciente.turno.paciente.nombre} · {formatHora(cancelacionReciente.turno.fecha)} con {cancelacionReciente.turno.profesional.name}
              </p>
              <p className="text-xs sm:text-sm">
                <strong>Motivo:</strong> {cancelacionReciente.motivo}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {errorTurnos && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-rose-800">
            <XCircle className="h-5 w-5" />
            <span>{errorTurnos}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden border-none bg-gradient-to-br from-blue-50 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Turnos del día</CardTitle>
            <span className="rounded-full bg-blue-100 p-2 text-blue-600">
              <CalendarCheck className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-blue-900">{resumen.total}</div>
            <p className="text-xs text-blue-700/80">Registros programados para hoy</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none bg-gradient-to-br from-amber-50 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Turnos pendientes</CardTitle>
            <span className="rounded-full bg-amber-100 p-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-amber-900">{resumen.cancelables}</div>
            <p className="text-xs text-amber-800/80">
              Programados, confirmados o en sala listos para gestionar
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none bg-gradient-to-br from-purple-50 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">En sala de espera</CardTitle>
            <span className="rounded-full bg-purple-100 p-2 text-purple-600">
              <Users className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-purple-900">{resumen.enSala}</div>
            <p className="text-xs text-purple-800/80">Pacientes esperando ser atendidos</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Completados</CardTitle>
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-emerald-900">{resumen.completados}</div>
            <p className="text-xs text-emerald-800/80">Consultas finalizadas hoy</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-1 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Turnos del día</CardTitle>
            <CardDescription>Buscá, filtrá y cancelá turnos rápidamente</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={cargarTurnosHoy} disabled={cargandoTurnos}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${cargandoTurnos ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por paciente, profesional o DNI"
                className="pl-9"
              />
            </div>

            <Select
              value={filtroEstado}
              onValueChange={(value) => setFiltroEstado(value as 'TODOS' | AppointmentStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                {Object.entries(estadoConfig).map(([estado, cfg]) => (
                  <SelectItem key={estado} value={estado}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroProfesional} onValueChange={(value) => setFiltroProfesional(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los profesionales</SelectItem>
                {profesionales.map((profesional) => (
                  <SelectItem key={profesional.id} value={profesional.id}>
                    {profesional.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {proximoTurno && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-medium">Próximo turno</p>
              <div className="mt-1 flex flex-wrap gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatHora(proximoTurno.fecha)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {proximoTurno.paciente.apellido}, {proximoTurno.paciente.nombre}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {proximoTurno.profesional.name}
                </span>
              </div>
            </div>
          )}

          {cargandoTurnos ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 py-10 text-sm text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando turnos...
            </div>
          ) : turnos.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
                <div className="bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 md:grid md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_160px_210px]">
                  <span>Horario</span>
                  <span>Paciente</span>
                  <span>Profesional</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>
                {turnos.map((turno) => {
                  const estado = estadoConfig[turno.estado]
                  const puedeCancelar = CANCELABLE_STATUSES.includes(turno.estado)
                  const canceladoEnProceso = cancelando && turnoACancelar?.id === turno.id

                  return (
                    <div
                      key={turno.id}
                      className="grid gap-3 border-t border-gray-100 px-4 py-4 text-sm transition hover:bg-gray-50 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_160px_210px] md:items-center"
                    >
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="hidden h-4 w-4 text-gray-400 md:inline" />
                        <div>
                          <p className="font-medium text-gray-900">{formatHora(turno.fecha)}</p>
                          <p className="text-xs text-gray-500 md:hidden">{formatFechaLarga(turno.fecha)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {turno.paciente.apellido}, {turno.paciente.nombre}
                        </p>
                        <p className="text-xs text-gray-500">DNI: {turno.paciente.dni}</p>
                      </div>

                      <div className="text-gray-700">
                        <p className="font-medium">{turno.profesional.name}</p>
                      </div>

                      <div>
                        <Badge variant="outline" className={`shadow-sm ${estado.className}`}>
                          {estado.label}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!puedeCancelar || !perfil || canceladoEnProceso}
                          onClick={() => {
                            setTurnoACancelar(turno)
                            setMotivoCancelacion('Cancelación solicitada por paciente')
                            setErrorCancelacion(null)
                          }}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 sm:w-auto"
                        >
                          {canceladoEnProceso ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Cancelar
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="w-full whitespace-nowrap bg-blue-50 text-blue-700 hover:bg-blue-100 sm:w-auto"
                        >
                          <Link className="flex items-center gap-1" href={`/mesa-entrada/lista-turnos`}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3 md:hidden">
                {turnos.map((turno) => {
                  const estado = estadoConfig[turno.estado]
                  const puedeCancelar = CANCELABLE_STATUSES.includes(turno.estado)
                  const canceladoEnProceso = cancelando && turnoACancelar?.id === turno.id

                  return (
                    <div key={turno.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {turno.paciente.apellido}, {turno.paciente.nombre}
                          </p>
                          <p className="text-xs text-gray-500">DNI: {turno.paciente.dni}</p>
                        </div>
                        <Badge variant="outline" className={`shadow-sm ${estado.className}`}>
                          {estado.label}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-blue-500" />
                          {formatFechaLarga(turno.fecha)} · {formatHora(turno.fecha)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4 text-purple-500" />
                          {turno.profesional.name}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!puedeCancelar || !perfil || canceladoEnProceso}
                          onClick={() => {
                            setTurnoACancelar(turno)
                            setMotivoCancelacion('Cancelación solicitada por paciente')
                            setErrorCancelacion(null)
                          }}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {canceladoEnProceso ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Cancelar turno
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          <Link className="flex items-center justify-center gap-1" href={`/mesa-entrada/lista-turnos`}>
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-gray-600">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
              <p>No encontramos turnos con los filtros seleccionados.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Mostrando{' '}
              {totalTurnos === 0
                ? '0'
                : `${(paginaActual - 1) * pageSize + 1} - ${Math.min(paginaActual * pageSize, totalTurnos)}`}
              {' '}de {totalTurnos} turnos
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={paginaActual === 1 || cargandoTurnos}
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              >
                Anterior
              </Button>
              <span className="text-xs text-gray-500">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={paginaActual >= totalPaginas || cargandoTurnos}
                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
              >
                Siguiente
              </Button>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  const size = parseInt(value, 10)
                  setPageSize(size)
                  setPaginaActual(1)
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Por página" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 15, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
          <CardDescription>Atajos útiles para el equipo de mesa de entrada</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button asChild variant="ghost" className="justify-start gap-3">
            <Link href="/mesa-entrada/pacientes">
              <User className="h-4 w-4" />
              Gestionar pacientes
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start gap-3">
            <Link href="/mesa-entrada/lista-turnos">
              <CalendarCheck className="h-4 w-4" />
              Agenda completa de turnos
            </Link>
          </Button>
          <Button asChild variant="ghost" className="justify-start gap-3">
            <Link href="/mesa-entrada/reportes">
              <AlertTriangle className="h-4 w-4" />
              Reportes y seguimientos
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={Boolean(turnoACancelar)} onOpenChange={(open) => !open && cerrarDialogoCancelacion()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
            <DialogDescription>
              Esta acción registrará la cancelación y liberará el horario seleccionado.
            </DialogDescription>
          </DialogHeader>

          {turnoACancelar && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md bg-gray-50 p-3">
                <p className="font-medium text-gray-900">
                  {turnoACancelar.paciente.apellido}, {turnoACancelar.paciente.nombre}
                </p>
                <p className="text-gray-700">{turnoACancelar.profesional.name}</p>
                <p className="text-gray-600">
                  {formatFechaLarga(turnoACancelar.fecha)} · {formatHora(turnoACancelar.fecha)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="cancel-reason">
                  Motivo de cancelación
                </label>
                <textarea
                  id="cancel-reason"
                  placeholder="Ej: El paciente avisó que no podrá asistir"
                  value={motivoCancelacion}
                  onChange={(event) => setMotivoCancelacion(event.target.value)}
                  rows={3}
                  className="min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errorCancelacion && (
                  <p className="text-xs text-rose-600">{errorCancelacion}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={cerrarDialogoCancelacion} disabled={cancelando}>
              Cerrar
            </Button>
            <Button variant="destructive" onClick={confirmarCancelacion} disabled={cancelando}>
              {cancelando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
