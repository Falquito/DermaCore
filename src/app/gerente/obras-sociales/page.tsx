"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, BadgeCheck, Pencil, Plus, Power, RefreshCw, Search } from "lucide-react";

// ====== Tipos ======
type ObraSocial = {
  id: string;
  nombre: string;
  codigo: string | null;
  activa: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type ListResponse = { obrasSociales?: ObraSocial[]; error?: string };
type CreateResponse = { obraSocial?: ObraSocial; message?: string; error?: string };
type UpdateResponse = { obraSocial?: ObraSocial; error?: string };
type DeleteResponse = { obraSocial?: ObraSocial; error?: string };

type CreateDTO = { nombre: string; codigo?: string };
type UpdateDTO = { nombre?: string; codigo?: string | null; activa?: boolean };

// ====== Página ======
export default function ObrasSocialesPage() {
  // --- Datos / UI ---
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
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
  const [formCodigo, setFormCodigo] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // confirmación baja/alta
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [confirmTarget, setConfirmTarget] = useState<ObraSocial | null>(null);

  // POPUP genérico (éxito / error / validación) usando Dialog
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [popupTitle, setPopupTitle] = useState<string>("");
  const [popupMsg, setPopupMsg] = useState<string>("");
  const [popupKind, setPopupKind] = useState<"ok" | "err" | "warn">("ok");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

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
  const fetchObrasSociales = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/obras-sociales${incluirInactivas ? "?incluirInactivas=true" : ""}`,
        { cache: "no-store" }
      );
      const json: ListResponse = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al cargar obras sociales");
      setObrasSociales(json.obrasSociales ?? []);
      setLoadedOnce(true);
    } catch (e: unknown) {
      openPopup("err", "Error", e instanceof Error ? e.message : "Error desconocido al cargar");
    } finally {
      setLoading(false);
    }
  }, [incluirInactivas]);

  useEffect(() => {
    void fetchObrasSociales();
  }, [fetchObrasSociales]);

  // --- Validación ---
  const validateForm = (): string => {
    if (!formNombre.trim()) return "El nombre de la obra social es obligatorio.";
    if (formNombre.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
    return "";
  };

  const resetForm = (): void => {
    setEditId(null);
    setFormNombre("");
    setFormCodigo("");
    setFormError("");
  };

  // --- Crear / Editar ---
  const openCreate = (): void => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (obraSocial: ObraSocial): void => {
    setEditId(obraSocial.id);
    setFormNombre(obraSocial.nombre);
    setFormCodigo(obraSocial.codigo ?? "");
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
        const body: UpdateDTO = { 
          nombre: formNombre.trim(), 
          codigo: formCodigo.trim() || null 
        };
        const res = await fetch(`/api/obras-sociales/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json: UpdateResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo actualizar");
        openPopup("ok", "Cambios guardados", "La obra social fue actualizada correctamente.");
      } else {
        const body: CreateDTO = {
          nombre: formNombre.trim(),
          ...(formCodigo.trim() ? { codigo: formCodigo.trim() } : {}),
        };
        const res = await fetch("/api/obras-sociales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json: CreateResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo crear");
        openPopup("ok", "Éxito", "Obra social registrada exitosamente");
      }
      setShowForm(false);
      resetForm();
      await fetchObrasSociales();
    } catch (e: unknown) {
      openPopup("err", "Error", e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // --- Baja lógica / Activar ---
  const requestToggle = (obraSocial: ObraSocial): void => {
    setConfirmTarget(obraSocial);
    setConfirmOpen(true);
  };

  const confirmToggle = async (): Promise<void> => {
    if (!confirmTarget) return;
    const obraSocial = confirmTarget;
    setConfirmOpen(false);
    try {
      setLoading(true);
      if (obraSocial.activa) {
        const res = await fetch(`/api/obras-sociales/${obraSocial.id}`, { method: "DELETE" });
        const json: DeleteResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo desactivar");
        openPopup("ok", "Listo", "Obra social desactivada.");
      } else {
        const res = await fetch(`/api/obras-sociales/${obraSocial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activa: true } as UpdateDTO),
        });
        const json: UpdateResponse = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo activar");
        openPopup("ok", "Listo", "Obra social activada.");
      }
      await fetchObrasSociales();
    } catch (e: unknown) {
      openPopup("err", "Error", e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // --- Paginación + filtro local ---
  const filteredData = useMemo((): ObraSocial[] => {
    if (!searchTerm.trim()) return obrasSociales;
    const lower = searchTerm.toLowerCase();
    return obrasSociales.filter(
      (os) =>
        os.nombre.toLowerCase().includes(lower) ||
        (os.codigo && os.codigo.toLowerCase().includes(lower))
    );
  }, [obrasSociales, searchTerm]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentItems = filteredData.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, incluirInactivas]);

  // --- Renders ---
  const getIconForPopup = () => {
    if (popupKind === "ok") return <BadgeCheck className="h-6 w-6 text-green-600" />;
    if (popupKind === "warn") return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    return <AlertTriangle className="h-6 w-6 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Obras Sociales</h1>
          <p className="text-gray-600">Administra las obras sociales del sistema</p>
        </div>

        {/* Controles principales */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar obras sociales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIncluirInactivas(!incluirInactivas)}
                className={incluirInactivas ? "bg-blue-50 border-blue-200" : ""}
              >
                {incluirInactivas ? "Mostrar solo activas" : "Incluir inactivas"}
              </Button>
              <Button variant="outline" onClick={fetchObrasSociales} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button onClick={openCreate} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Obra Social
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {!loadedOnce && loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando obras sociales...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No se encontraron resultados" : "No hay obras sociales"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Comienza agregando una nueva obra social"}
            </p>
            {!searchTerm && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primera obra social
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Creada</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((obraSocial) => (
                      <tr key={obraSocial.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{obraSocial.nombre}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600">{obraSocial.codigo || "-"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              obraSocial.activa
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {obraSocial.activa ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDateTime(obraSocial.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(obraSocial)}
                              disabled={loading}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => requestToggle(obraSocial)}
                              disabled={loading}
                              className={
                                obraSocial.activa
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-green-200 text-green-600 hover:bg-green-50"
                              }
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, totalItems)} de{" "}
                  {totalItems} obras sociales
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Formulario */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editId ? "Editar Obra Social" : "Nueva Obra Social"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="form-nombre">Nombre *</Label>
                <Input
                  id="form-nombre"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: OSDE, Swiss Medical, IOMA..."
                  className={formError && !formNombre.trim() ? "border-red-300" : ""}
                />
              </div>
              <div>
                <Label htmlFor="form-codigo">Código</Label>
                <Input
                  id="form-codigo"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  placeholder="Código interno (opcional)"
                />
              </div>
              {formError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editId ? "Guardar cambios" : "Crear obra social"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Confirmación */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                {confirmTarget?.activa ? "Desactivar" : "Activar"} Obra Social
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                {confirmTarget?.activa
                  ? `¿Estás seguro que deseas desactivar "${confirmTarget?.nombre}"? Esta acción se puede revertir.`
                  : `¿Estás seguro que deseas activar "${confirmTarget?.nombre}"?`}
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  onClick={confirmToggle}
                  disabled={loading}
                  className={
                    confirmTarget?.activa
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {confirmTarget?.activa ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Popup genérico */}
        <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getIconForPopup()}
                {popupTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">{popupMsg}</p>
              <div className="flex justify-end">
                <Button onClick={() => setPopupOpen(false)}>Entendido</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
