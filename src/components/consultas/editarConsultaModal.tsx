"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NotifySuccessComponent from "@/components/pacientes/notifySuccessPaciente";
import ObraSocialComboBox, {
  type ObraSocialOption,
} from "@/components/pacientes/obraSocialComboBox";
import type { Consulta } from "@/types/consulta";

type Props = {
  consulta: Consulta;
  idPaciente: number;
  onConsultaUpdated?: (consulta: Consulta) => void;
};

export default function EditarConsultaModal({
  consulta,
  idPaciente,
  onConsultaUpdated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingObras, setLoadingObras] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [obras, setObras] = useState<ObraSocialOption[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);

  const [selectedObraSocial, setSelectedObraSocial] =
    useState<ObraSocialOption | null>(
      consulta.obraSocial ? consulta.obraSocial : null
    );

  const [formData, setFormData] = useState({
    motivoConsulta: consulta.motivoConsulta,
    diagnosticoConsulta: consulta.diagnosticoConsulta || "",
    tratamientoConsulta: consulta.tratamientoConsulta || "",
    nroAfiliado: consulta.nroAfiliado || "",
    tipoConsultaType: consulta.tipoConsulta || "obra-social",
    montoConsulta: consulta.montoConsulta?.toString() || "",
  });

  const fetchObras = async () => {
    try {
      setLoadingObras(true);
      const response = await fetch("/api/obras-sociales");
      if (!response.ok) throw new Error("No se pudo cargar las obras sociales");

      const data = await response.json();
      const obrasData = Array.isArray(data) ? data : data.obras || [];
      setObras(obrasData);
    } catch (err) {
      console.error("Error al cargar obras sociales:", err);
      setFieldErrors({ obras: "Error al cargar las obras sociales" });
    } finally {
      setLoadingObras(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFieldErrors({});
      fetchObras();
    }
    setOpen(newOpen);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tipoConsultaType: value }));
    if (value === "particular") {
      setSelectedObraSocial(null);
    } else {
      setFormData((prev) => ({ ...prev, montoConsulta: "" }));
    }
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.tipoConsultaType;
      delete newErrors.montoConsulta;
      delete newErrors.nroAfiliado;
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: Record<string, string> = {};

    if (!formData.motivoConsulta.trim()) {
      errors.motivoConsulta = "El motivo de la consulta es requerido";
    }

    if (formData.tipoConsultaType === "particular") {
      if (!formData.montoConsulta) {
        errors.montoConsulta = "El monto es requerido para consultas particulares";
      }
    } else {
      if (!selectedObraSocial) {
        errors.idObraSocial = "La obra social es requerida";
      }
      if (!formData.nroAfiliado.trim()) {
        errors.nroAfiliado = "El número de afiliado es requerido";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);

      const idObraSocial =
        formData.tipoConsultaType === "obra-social"
          ? selectedObraSocial?.idObraSocial
          : null;

      const response = await fetch(
        `/api/pacientes/${idPaciente}/consultas/${consulta.idConsulta}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motivoConsulta: formData.motivoConsulta.trim(),
            diagnosticoConsulta: formData.diagnosticoConsulta.trim() || null,
            tratamientoConsulta: formData.tratamientoConsulta.trim() || null,
            nroAfiliado: formData.nroAfiliado.trim() || null,
            tipoConsulta: formData.tipoConsultaType,
            montoConsulta:
              formData.tipoConsultaType === "particular"
                ? parseFloat(formData.montoConsulta)
                : null,
            idObraSocial,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error: ${response.status} ${response.statusText}`
        );
      }

      const consultaActualizada = await response.json();
      setSuccessOpen(true);
      onConsultaUpdated?.(consultaActualizada);

      setTimeout(() => setOpen(false), 1500);
      setTimeout(() => setSuccessOpen(false), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido";
      setFieldErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NotifySuccessComponent
        open={successOpen}
        title="Éxito"
        description="Consulta actualizada exitosamente"
      />

      <Button
        variant="ghost"
        size="sm"
        className="text-cyan-600 hover:text-cyan-700"
        onClick={() => handleOpenChange(true)}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[90vw] sm:w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Editar Consulta</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de la consulta del paciente
            </DialogDescription>
          </DialogHeader>

          {fieldErrors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{fieldErrors.submit}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Motivo de la Consulta */}
            <div className="space-y-2">
              <Label htmlFor="motivoConsulta" className="text-cyan-900">
                Motivo de la Consulta *
              </Label>
              <Input
                id="motivoConsulta"
                name="motivoConsulta"
                placeholder="Ej: Control rutinario"
                value={formData.motivoConsulta}
                onChange={handleChange}
                disabled={loading}
                className={`border-cyan-200 focus:border-cyan-500 ${
                  fieldErrors.motivoConsulta ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              {fieldErrors.motivoConsulta && (
                <p className="text-xs text-red-600">{fieldErrors.motivoConsulta}</p>
              )}
            </div>

            {/* Tipo de Consulta */}
            <div className="space-y-2">
              <Label htmlFor="tipoConsultaType" className="text-cyan-900">
                Tipo de Consulta *
              </Label>
              <Select
                value={formData.tipoConsultaType}
                onValueChange={handleSelectChange}
                disabled={loading}
              >
                <SelectTrigger className="border-cyan-200 focus:border-cyan-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="obra-social">Obra Social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Obra Social */}
            {formData.tipoConsultaType === "obra-social" && (
              <div className="space-y-2">
                <Label className="text-cyan-900">Obra Social *</Label>
                <div className={`border rounded-md ${fieldErrors.idObraSocial ? "border-red-500" : "border-cyan-200"}`}>
                  <ObraSocialComboBox
                    options={obras}
                    value={selectedObraSocial}
                    onChange={setSelectedObraSocial}
                    onCreateNew={(newObra) => {
                      setObras((prev) => [...prev, newObra]);
                      setSelectedObraSocial(newObra);
                    }}
                    disabled={loading || loadingObras}
                    placeholder="Selecciona la obra social"
                  />
                </div>
                {fieldErrors.idObraSocial && (
                  <p className="text-xs text-red-600">{fieldErrors.idObraSocial}</p>
                )}
              </div>
            )}

            {/* Monto */}
            {formData.tipoConsultaType === "particular" && (
              <div className="space-y-2">
                <Label htmlFor="montoConsulta" className="text-cyan-900">
                  Monto *
                </Label>
                <Input
                  id="montoConsulta"
                  name="montoConsulta"
                  type="number"
                  placeholder="Ej: 150.00"
                  step="0.01"
                  value={formData.montoConsulta}
                  onChange={handleChange}
                  disabled={loading}
                  className={`border-cyan-200 focus:border-cyan-500 ${
                    fieldErrors.montoConsulta ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {fieldErrors.montoConsulta && (
                  <p className="text-xs text-red-600">{fieldErrors.montoConsulta}</p>
                )}
              </div>
            )}

            {/* Nro. Afiliado */}
            {formData.tipoConsultaType === "obra-social" && (
              <div className="space-y-2">
                <Label htmlFor="nroAfiliado" className="text-cyan-900">
                  Nro. de Afiliado *
                </Label>
                <Input
                  id="nroAfiliado"
                  name="nroAfiliado"
                  placeholder="Número de afiliado"
                  value={formData.nroAfiliado}
                  onChange={handleChange}
                  disabled={loading}
                  className={`border-cyan-200 focus:border-cyan-500 ${
                    fieldErrors.nroAfiliado ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {fieldErrors.nroAfiliado && (
                  <p className="text-xs text-red-600">{fieldErrors.nroAfiliado}</p>
                )}
              </div>
            )}

            {/* Diagnóstico */}
            <div className="space-y-2">
              <Label htmlFor="diagnosticoConsulta" className="text-cyan-900">
                Diagnóstico
              </Label>
              <Textarea
                id="diagnosticoConsulta"
                name="diagnosticoConsulta"
                placeholder="Descripción del diagnóstico..."
                value={formData.diagnosticoConsulta}
                onChange={handleChange}
                disabled={loading}
                className="border-cyan-200 focus:border-cyan-500 resize-none"
                rows={3}
              />
            </div>

            {/* Tratamiento */}
            <div className="space-y-2">
              <Label htmlFor="tratamientoConsulta" className="text-cyan-900">
                Tratamiento
              </Label>
              <Textarea
                id="tratamientoConsulta"
                name="tratamientoConsulta"
                placeholder="Medicación, indicaciones, recomendaciones..."
                value={formData.tratamientoConsulta}
                onChange={handleChange}
                disabled={loading}
                className="border-cyan-200 focus:border-cyan-500 resize-none"
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingObras}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Consulta"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
