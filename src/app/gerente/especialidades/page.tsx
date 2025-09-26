"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, BadgeCheck, Pencil, Plus, Power, RefreshCw, Search } from "lucide-react";

// ====== Tipos (sin any) ======
type AuditUser = { name: string | null; email: string };

type Especialidad = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  createdBy?: AuditUser | null;
  updatedBy?: AuditUser | null;
  deactivatedBy?: AuditUser | null;
  deactivatedAt?: string | null;
};

type ListResponse = { especialidades?: Especialidad[]; error?: string };
type CreateResponse = { especialidad?: Especialidad; message?: string; error?: string };
type UpdateResponse = { especialidad?: Especialidad; error?: string };
type DeleteResponse = { especialidad?: Especialidad; error?: string };

type CreateDTO = { nombre: string; descripcion?: string };
type UpdateDTO = { nombre?: string; descripcion?: string | null; activa?: boolean };

// ====== Página ======
export default function EspecialidadesPage() {
  // --- Datos / UI ---
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadedOnce, setLoadedOnce] = useState<boolean>(false);

  // búsqueda
  const [searchTerm, setSearchTerm] = useState<string>("");

  // filtro: incluir o no inactivas
  const [incluirInactivas, setIncluirInactivas] = useState<boolean>(false);

  // formulario
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>("");
  const [formDescripcion, setFormDescripcion] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // confirmación baja/alta
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmTarget, setConfirmTarget] = useState<Especialidad | null>(null);

  // POPUP genérico (éxito / error / validación) usando Dialog
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [popupTitle, setPopupTitle] = useState<string>("");
  const [popupMsg, setPopupMsg] = useState<string>("");
  const [popupKind, setPopupKind] = useState<"ok" | "err" | "warn">("ok");

  const openPopup = (kind: "ok" | "err" | "warn", title: string, msg: string): void => {
    setPopupKind(kind);
    setPopupTitle(title);
    setPopupMsg(msg);
    setPopupOpen(true);
  };

  const formatDateTime = (iso?: string | null): string => {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.valueOf())
      ? "-"
      : d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
  };

  // --- Carga (según incluirInactivas) ---
  const fetchEspecialidades = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/especialidades${incluirInactivas ? "?incluirInactivas=true" : ""}`,
        { cache: "no-store" }
      );
      const json: ListResponse = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al cargar especialidades");
      setEspecialidades(json.especialidades ?? []);
      setLoadedOnce(true);
    } catch (e: unknown) {
      openPopup("err", "Error", e instanceof Error ? e.message : "Error desconocido al cargar");
    } finally {
      setLoading(false);
    }
  }, [incluirInactivas]);

  useEffect(() => {
    void fetchEspecialidades();
  }, [fetchEspecialidades]);

  // --- Validación ---
  const validateForm = (): string => {
    if (!formNombre.trim()) return "El nombre de la especialidad es obligatorio.";
    if (formNombre.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
    return "";
  };

  const resetForm = (): void => {
    setEditId(null);
    setFormNombre("");
    setFormDescripcion("");
    setFormError("");
  };

  // --- Crear / Editar ---
  const openCreate = (): void => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (esp: Especialidad): void => {
    setEditId(esp.id);
    setFormNombre(esp.nombre);
    setFormDescripcion(esp.descripcion ?? "");
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async (): Promise<void> => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      openPopup("warn", "Validación", err);
      return;
    }
    try {
      setLoading(true);
      if (editId) {
        const body: UpdateDTO = { nombre: formNombre.trim(), descripcion: formDescripcion.trim() || "" };
        const res = await fetch(`/api/especialidades/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json: UpdateResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo actualizar");
        openPopup("ok", "Cambios guardados", "La especialidad fue actualizada correctamente.");
      } else {
        const body: CreateDTO = {
          nombre: formNombre.trim(),
          ...(formDescripcion.trim() ? { descripcion: formDescripcion.trim() } : {}),
        };
        const res = await fetch("/api/especialidades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json: CreateResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo crear");
        // Requisito: mensaje explícito
        openPopup("ok", "Éxito", "Especialidad registrada exitosamente");
      }
      setShowForm(false);
      resetForm();
      await fetchEspecialidades();
    } catch (e: unknown) {
      openPopup("err", "Error", e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // --- Baja lógica / Activar ---
  const requestToggle = (esp: Especialidad): void => {
    setConfirmTarget(esp);
    setConfirmOpen(true);
  };

  const confirmToggle = async (): Promise<void> => {
    if (!confirmTarget) return;
    const esp = confirmTarget;
    setConfirmOpen(false);
    try {
      setLoading(true);
      if (esp.activa) {
        const res = await fetch(`/api/especialidades/${esp.id}`, { method: "DELETE" });
        const json: DeleteResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo desactivar");
        openPopup("ok", "Listo", "Especialidad desactivada.");
      } else {
        const res = await fetch(`/api/especialidades/${esp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activa: true } as UpdateDTO),
        });
        const json: UpdateResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo activar");
        openPopup("ok", "Listo", "Especialidad activada.");
      }
      await fetchEspecialidades();
    } catch (e: unknown) {
      openPopup("err", "Error", e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
      setConfirmTarget(null);
    }
  };

  // --- Filtro búsqueda (cliente) ---
  const filtered = useMemo<Especialidad[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return especialidades;
    return especialidades.filter((e) => {
      const n = e.nombre.toLowerCase();
      const d = (e.descripcion ?? "").toLowerCase();
      return n.includes(term) || d.includes(term);
    });
  }, [especialidades, searchTerm]);

  // =================== RENDER (sidebar + topbar) ===================
  return (
        <main className="flex-1 p-5 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Catálogo de Especialidades</h1>
            <p className="text-base text-gray-700">
              Administrá especialidades (activas e inactivas). Creá, editá o aplicá baja lógica.
            </p>
          </div>

          {/* Barra de acciones */}
          <Card className="mb-6 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    className="pl-10 text-base"
                    placeholder="Buscar por nombre o descripción…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {/* Toggle Activas/Inactivas */}
                  <Button
                    variant="outline"
                    onClick={() => setIncluirInactivas((v) => !v)}
                    disabled={loading}
                    className="text-base"
                    title={incluirInactivas ? "Mostrar solo activas" : "Mostrar también inactivas"}
                  >
                    {incluirInactivas ? "Solo activas" : "Mostrar inactivas"}
                  </Button>

                  <Button variant="secondary" onClick={fetchEspecialidades} disabled={loading} className="text-base">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Actualizar
                  </Button>

                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-base"
                    onClick={openCreate}
                    disabled={loading}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva especialidad
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista vertical (cards con degradado) */}
          <div className="space-y-4">
            {!loading && filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-600 text-lg">
                  {loadedOnce ? "No hay especialidades que coincidan" : "Cargando…"}
                </CardContent>
              </Card>
            ) : (
              filtered.map((esp) => (
                <div
                  key={esp.id}
                  className={`rounded-xl border shadow-sm p-5 transition-all
                    ${esp.activa
                      ? "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white"
                      : "border-red-200 bg-gradient-to-r from-red-50 via-white to-white"
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Info principal */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">{esp.nombre}</h3>
                        {esp.activa ? (
                          <span className="inline-flex items-center text-green-800 bg-green-100 border border-green-200 text-xs px-2.5 py-0.5 rounded-full">
                            <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-800 bg-red-100 border border-red-200 text-xs px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Inactiva
                          </span>
                        )}
                      </div>

                      {esp.descripcion && (
                        <p className="mt-1.5 text-base text-gray-800">{esp.descripcion}</p>
                      )}

                      <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                        <span>Creada: <span className="text-gray-900">{formatDateTime(esp.createdAt)}</span></span>
                        <span>Últ. cambio: <span className="text-gray-900">{formatDateTime(esp.updatedAt)}</span></span>
                        {esp.deactivatedAt && (
                          <span>Baja: <span className="text-gray-900">{formatDateTime(esp.deactivatedAt)}</span></span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button variant="outline" onClick={() => openEdit(esp)} disabled={loading} className="text-base">
                        <Pencil className="h-5 w-5 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant={esp.activa ? "destructive" : "default"}
                        onClick={() => requestToggle(esp)}
                        disabled={loading}
                        title={esp.activa ? "Desactivar (baja lógica)" : "Activar"}
                        className="text-base"
                      >
                        <Power className="h-5 w-5 mr-2" />
                        {esp.activa ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Crear/Editar */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editId ? "Editar especialidad" : "Nueva especialidad"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre" className="text-base">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formNombre}
                    onChange={(e) => {
                      setFormNombre(e.target.value);
                      if (formError) setFormError("");
                    }}
                    placeholder="Ej: Cardiología"
                    className={`text-base ${formError ? "border-red-300 focus-visible:ring-red-400" : ""}`}
                    aria-invalid={!!formError}
                    aria-describedby={formError ? "nombre-error" : undefined}
                  />
                  {formError && (
                    <p id="nombre-error" className="mt-1 text-sm text-red-600" role="alert">
                      {formError}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="desc" className="text-base">Descripción (opcional)</Label>
                  <Input
                    id="desc"
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Breve descripción"
                    className="text-base"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="text-base">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-base"
                    title="Guardar especialidad"
                  >
                    {editId ? "Guardar cambios" : "Guardar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Confirmación Baja/Alta */}
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className={`text-xl ${confirmTarget?.activa ? "text-red-700" : "text-emerald-700"}`}>
                  {confirmTarget?.activa ? "Desactivar especialidad" : "Activar especialidad"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  className={`text-base rounded-md border px-3 py-2 ${
                    confirmTarget?.activa
                      ? "bg-red-50 border-red-200 text-red-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  {confirmTarget?.activa
                    ? "La especialidad quedará INACTIVA. ¿Deseás continuar?"
                    : "La especialidad se ACTIVARÁ. ¿Deseás continuar?"}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfirmOpen(false)} className="text-base">
                    Cancelar
                  </Button>
                  <Button onClick={confirmToggle} variant={confirmTarget?.activa ? "destructive" : "default"} className="text-base">
                    Confirmar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* POPUP genérico (validaciones / éxito / error) */}
          <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle
                  className={
                    popupKind === "ok" ? "text-emerald-700" : popupKind === "err" ? "text-red-700" : "text-amber-700"
                  }
                >
                  {popupTitle}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-base text-gray-800">{popupMsg}</p>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setPopupOpen(false)} className="text-base">
                    Aceptar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
  );
}
