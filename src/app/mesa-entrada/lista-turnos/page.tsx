"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import {
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  Search,
  User,
} from "lucide-react";

import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Professional = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

type Appointment = {
  id: string;
  professionalId: string;
  patientId?: string | null;
  title: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  notes?: string | null;
};

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; badgeClassName: string }
> = {
  PROGRAMADO: {
    label: "Programado",
    badgeClassName: "border border-blue-200 bg-blue-50 text-blue-700",
  },
  CONFIRMADO: {
    label: "Confirmado",
    badgeClassName: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  EN_SALA_DE_ESPERA: {
    label: "En sala de espera",
    badgeClassName: "border border-amber-200 bg-amber-50 text-amber-800",
  },
  COMPLETADO: {
    label: "Completado",
    badgeClassName: "border border-slate-200 bg-slate-50 text-slate-700",
  },
  CANCELADO: {
    label: "Cancelado",
    badgeClassName: "border border-rose-200 bg-rose-50 text-rose-700",
  },
  NO_ASISTIO: {
    label: "No asistió",
    badgeClassName: "border border-zinc-200 bg-zinc-50 text-zinc-700",
  },
};

const LOCALE = "es-AR";

function formatLongDate(value: string | Date) {
  return new Date(value).toLocaleDateString(LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function AppointmentDetailsDialog({
  appointment,
  open,
  onClose,
}: {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
}) {
  // Hooks deben ir siempre al inicio del componente
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorAction, setErrorAction] = useState("");

  // Estado para el perfil del usuario logueado
  const [perfil, setPerfil] = useState<{ id: string; name?: string } | null>(
    null
  );

  useEffect(() => {
    async function obtenerPerfil() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (data.user && data.user.id) {
          setPerfil({
            id: data.user.id,
            name: data.user.name || data.user.email,
          });
        }
      } catch {
        setPerfil(null);
      }
    }
    obtenerPerfil();
  }, []);

  if (!appointment) return null;

  const startTime = formatTime(appointment.start);
  const endTime = formatTime(appointment.end);
  const fullDate = formatLongDate(appointment.start);
  const statusMeta = STATUS_META[appointment.status];

    // Opciones de cambio de estado, excluyendo el estado actual
    const accionesPosibles = [
      { value: "CANCELAR", label: "Cancelar turno", status: "CANCELADO" },
      { value: "NO_ASISTIO", label: "No asistió", status: "NO_ASISTIO" },
      { value: "EN_SALA_DE_ESPERA", label: "En sala de espera", status: "EN_SALA_DE_ESPERA" },
    ];
    const opcionesFiltradas = accionesPosibles.filter(
      (op) => op.status !== appointment.status
    );

  // Función para cambiar estado
  async function handleChangeStatus(action: string) {
    setErrorAction("");
    setLoadingAction(true);
    try {
      if (action === "CANCELAR") {
        setShowCancelDialog(true);
        setLoadingAction(false);
        return;
      }
      let newStatus = "";
      if (action === "NO_ASISTIO") newStatus = "NO_ASISTIO";
      if (action === "EN_SALA_DE_ESPERA") newStatus = "EN_SALA_DE_ESPERA";
      if (newStatus && appointment) {
        const res = await fetch(`/api/turnos/${appointment.id}/estado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: newStatus }),
        });
        if (!res.ok) throw new Error("Error actualizando estado");
        window.location.reload();
      }
    } catch {
      setErrorAction("Ocurrió un error al cambiar el estado.");
    } finally {
      setLoadingAction(false);
    }
  }

  // Función para cancelar turno
  async function handleCancelTurn() {
    setErrorAction("");
    setLoadingAction(true);
    try {
      if (appointment && perfil?.id) {
        const body = { motivo: cancelReason, cancelledById: perfil.id }
        console.log('Cancelando turno, body enviado:', body)
        const res = await fetch(`/api/turnos/${appointment.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!res.ok) {
          let errorMsg = 'Error cancelando turno'
          try {
            const data = await res.json()
            if (data?.error) errorMsg = data.error
          } catch {}
          throw new Error(errorMsg)
        }
        setShowCancelDialog(false)
        window.location.reload()
      } else {
        setErrorAction('No se pudo obtener el usuario logueado.')
      }
    } catch (err) {
      setErrorAction(err instanceof Error ? err.message : 'Ocurrió un error al cancelar el turno.')
    } finally {
      setLoadingAction(false)
    }
  }

  // Limpiar error al cerrar el modal
  const handleDialogOpenChange = (value: boolean) => {
    if (!value) {
      setErrorAction('')
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalles del turno</DialogTitle>
          <DialogDescription>
            Información del turno seleccionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-slate-700">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">
              Paciente
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {appointment.title}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Fecha
              </p>
              <p className="mt-1 capitalize text-slate-900">{fullDate}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Horario
              </p>
              <p className="mt-1 text-slate-900">
                {startTime} - {endTime}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-slate-500">
              Estado
            </p>
            <Badge
              className={cn(
                "mt-1 gap-1.5 text-xs font-medium",
                statusMeta.badgeClassName
              )}
            >
              {statusMeta.label}
            </Badge>
            {/* Selector de acción para cambiar estado */}
            <div className="mt-4">
              <label className="text-xs font-medium uppercase text-slate-500">
                Cambiar estado
              </label>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  disabled={loadingAction}
                >
                  <option value="">Seleccionar acción...</option>
                  {opcionesFiltradas.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              {selectedAction && (
                <Button
                  className="mt-2"
                  type="button"
                  variant="destructive"
                  onClick={() => handleChangeStatus(selectedAction)}
                  disabled={loadingAction}
                >
                  {loadingAction ? "Procesando..." : "Confirmar cambio"}
                </Button>
              )}
              {errorAction && (
                <p className="mt-2 text-xs text-red-600">{errorAction}</p>
              )}
            </div>
            {/* Diálogo para motivo de cancelación */}
            {showCancelDialog && (
              <Dialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cancelar turno</DialogTitle>
                    <DialogDescription>
                      Ingrese el motivo de la cancelación
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Motivo de cancelación"
                      className="w-full"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCancelDialog(false)}
                        disabled={loadingAction}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleCancelTurn}
                        disabled={loadingAction || !cancelReason}
                      >
                        {loadingAction ? "Procesando..." : "Confirmar"}
                      </Button>
                    </div>
                    {errorAction && (
                      <p className="text-xs text-red-600">{errorAction}</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {appointment.notes && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Notas
              </p>
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-700">
                {appointment.notes}
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Próximamente se agregarán acciones y herramientas adicionales para
            gestionar este turno.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ListaTurnosPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    setDateFrom(today);
    setDateTo(nextMonth);
  }, []);

  useEffect(() => {
    async function fetchProfessionals() {
      try {
        setLoadingProfessionals(true);
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) throw new Error("Error fetching professionals");

        const data = await response.json();
        const professionalsOnly = data.users.filter((user: Professional) =>
          user.roles.includes("PROFESIONAL")
        );
        setProfessionals(professionalsOnly);
      } catch (error) {
        console.error("Error fetching professionals:", error);
      } finally {
        setLoadingProfessionals(false);
      }
    }

    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (!selectedProfessional) {
      setAppointments([]);
      return;
    }

    async function fetchAppointments() {
      try {
        setLoading(true);
        if (!selectedProfessional) {
          setAppointments([]);
          return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const from = dateFrom ? new Date(dateFrom) : new Date(today);
        from.setHours(0, 0, 0, 0);

        const toBase = dateTo ? new Date(dateTo) : new Date(from);
        toBase.setHours(0, 0, 0, 0);

        if (!dateTo) {
          toBase.setDate(toBase.getDate() + 30);
        } else if (toBase < from) {
          toBase.setTime(from.getTime());
        }

        const to = new Date(toBase);
        to.setDate(to.getDate() + 1);

        const params = new URLSearchParams({
          from: from.toISOString(),
          to: to.toISOString(),
          professionalId: selectedProfessional.id,
        });

        const response = await fetch(`/api/agenda?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Error fetching appointments");

        const data: Appointment[] = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [selectedProfessional, dateFrom, dateTo]);

  const filteredProfessionals = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm);

    return professionals.filter((prof) => {
      const normalizedName = normalizeText(prof.name);
      const normalizedEmail = normalizeText(prof.email);

      return (
        normalizedName.includes(normalizedSearchTerm) ||
        normalizedEmail.includes(normalizedSearchTerm)
      );
    });
  }, [professionals, searchTerm]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearchTerm = normalizeText(appointmentSearchTerm);

    if (!normalizedSearchTerm) return appointments;

    return appointments.filter((appointment) => {
      const matchesTitle = normalizeText(appointment.title).includes(
        normalizedSearchTerm
      );
      const matchesNotes = appointment.notes
        ? normalizeText(appointment.notes).includes(normalizedSearchTerm)
        : false;
      const matchesStatus = normalizeText(
        STATUS_META[appointment.status].label
      ).includes(normalizedSearchTerm);

      return matchesTitle || matchesNotes || matchesStatus;
    });
  }, [appointments, appointmentSearchTerm]);

  const groupedAppointments = useMemo(() => {
    return filteredAppointments.reduce((groups, appointment) => {
      const dateKey = new Date(appointment.start).toISOString().split("T")[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(appointment);
      return groups;
    }, {} as Record<string, Appointment[]>);
  }, [filteredAppointments]);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Agenda Completa por Profesional
          </h1>
          <p className="text-sm text-slate-600">
            Consultá los turnos agendados para cada profesional con filtros por
            rango de fechas y búsqueda rápida.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/mesa-entrada/turnos">Volver a turnos del día</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:gap-8">
        <Card className="h-full">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <User className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Profesionales
                </CardTitle>
                <CardDescription>
                  Filtrá y seleccioná un profesional para revisar su agenda
                  completa.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="pl-9"
              />
            </div>

            <div className="max-h-[28rem] overflow-y-auto pr-1">
              {loadingProfessionals ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 py-12 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  Cargando profesionales...
                </div>
              ) : filteredProfessionals.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
                  <User className="h-6 w-6 text-slate-400" />
                  <p>
                    {searchTerm
                      ? "No encontramos profesionales con ese criterio."
                      : "Todavía no hay profesionales registrados."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredProfessionals.map((professional) => (
                    <Button
                      key={professional.id}
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedProfessional(professional)}
                      className={cn(
                        "h-auto w-full justify-between gap-3 rounded-md border px-4 py-4 text-left text-sm font-medium transition-all duration-150",
                        "hover:border-emerald-200 hover:bg-emerald-50/80",
                        selectedProfessional?.id === professional.id
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm"
                          : "border-slate-200 text-slate-700"
                      )}
                    >
                      <span className="flex flex-1 flex-col">
                        <span>{professional.name}</span>
                        <span className="text-xs font-normal text-slate-500">
                          {professional.email}
                        </span>
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-slate-400 transition-transform",
                          selectedProfessional?.id === professional.id &&
                            "translate-x-1"
                        )}
                      />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-base sm:text-lg">
                  {selectedProfessional
                    ? `Agenda de ${selectedProfessional.name}`
                    : "Agenda del profesional"}
                </CardTitle>
                <CardDescription>
                  Aplicá filtros por fechas o estado para encontrar turnos
                  específicos.
                </CardDescription>
              </div>
            </div>
            {selectedProfessional && (
              <Badge className="w-fit gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700">
                <User className="h-3.5 w-3.5" />
                {selectedProfessional.email}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedProfessional ? (
              <>
                <div className="grid gap-5 rounded-md border border-emerald-100 bg-emerald-50/40 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase text-emerald-700">
                        Fecha desde
                      </p>
                      <DatePicker
                        date={dateFrom}
                        onDateChange={setDateFrom}
                        placeholder="Seleccioná una fecha"
                        captionLayout="dropdown"
                        fromYear={currentYear - 10}
                        toYear={currentYear + 5}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase text-emerald-700">
                        Fecha hasta
                      </p>
                      <DatePicker
                        date={dateTo}
                        onDateChange={setDateTo}
                        placeholder="Seleccioná una fecha"
                        captionLayout="dropdown"
                        fromYear={currentYear - 10}
                        toYear={currentYear + 5}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                      <Input
                        value={appointmentSearchTerm}
                        onChange={(event) =>
                          setAppointmentSearchTerm(event.target.value)
                        }
                        placeholder="Buscar turnos por paciente, estado o nota..."
                        className="pl-9"
                      />
                    </div>
                    {(dateFrom || dateTo || appointmentSearchTerm) && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setDateFrom(undefined);
                          setDateTo(undefined);
                          setAppointmentSearchTerm("");
                        }}
                        className="justify-self-start text-sm text-emerald-700 hover:text-emerald-800 sm:justify-self-end"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    Cargando turnos...
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-sm text-slate-500">
                    <Calendar className="h-6 w-6 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-600">
                        No hay turnos programados
                      </p>
                      <p className="text-xs text-slate-500">
                        {dateFrom && dateTo
                          ? `Sin turnos entre ${dateFrom.toLocaleDateString(
                              "es-AR"
                            )} y ${dateTo.toLocaleDateString("es-AR")}`
                          : "No se registran turnos en el rango seleccionado."}
                      </p>
                    </div>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-sm text-slate-500">
                    <Search className="h-6 w-6 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-600">
                        No encontramos coincidencias
                      </p>
                      <p className="text-xs text-slate-500">
                        Revisá el término de búsqueda o ajustá los filtros.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[30rem] space-y-7 overflow-y-auto pr-1">
                    {Object.entries(groupedAppointments)
                      .sort(
                        ([a], [b]) =>
                          new Date(a).getTime() - new Date(b).getTime()
                      )
                      .map(([dateKey, dayAppointments]) => (
                        <div key={dateKey} className="space-y-4">
                          <h3 className="text-sm font-semibold capitalize text-slate-700">
                            {formatLongDate(dateKey)}
                          </h3>
                          <div className="space-y-3">
                            {dayAppointments
                              .sort(
                                (a, b) =>
                                  new Date(a.start).getTime() -
                                  new Date(b.start).getTime()
                              )
                              .map((appointment) => {
                                const startTime = formatTime(appointment.start);
                                const endTime = formatTime(appointment.end);
                                const statusMeta =
                                  STATUS_META[appointment.status];

                                return (
                                  <button
                                    key={appointment.id}
                                    type="button"
                                    onClick={() =>
                                      handleAppointmentClick(appointment)
                                    }
                                    className="group flex w-full items-start justify-between rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                                  >
                                    <div className="flex flex-1 flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
                                      <div className="flex items-center gap-2 text-slate-700">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium text-slate-900">
                                          {startTime} - {endTime}
                                        </span>
                                      </div>
                                      <p className="min-w-0 flex-1 truncate text-slate-600">
                                        {appointment.title}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        className={cn(
                                          "gap-1.5 text-xs",
                                          statusMeta.badgeClassName
                                        )}
                                      >
                                        {statusMeta.label}
                                      </Badge>
                                      <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-sm text-slate-500">
                <Calendar className="h-6 w-6 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-600">
                    Seleccioná un profesional
                  </p>
                  <p className="text-xs text-slate-500">
                    Elegí un profesional de la lista para ver sus turnos
                    programados.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        open={modalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
