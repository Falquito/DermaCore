"use client";

import { useState, useEffect } from "react";
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
import { Plus, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NotifySuccessComponent from "@/components/pacientes/notifySuccessPaciente";
import type { Consulta } from "@/types/consulta";

type ObraSocial = {
  idObraSocial: number;
  nombreObraSocial: string;
};

type Props = {
  idPaciente: number;
  onConsultaCreated?: (consulta: Consulta) => void;
};

export default function RegistrarConsultaModal({
  idPaciente,
  onConsultaCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingObras, setLoadingObras] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [obras, setObras] = useState<ObraSocial[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);

  const [formData, setFormData] = useState({
    motivoConsulta: "",
    diagnosticoConsulta: "",
    tratamientoConsulta: "",
    nroAfiliado: "",
    tipoConsulta: "",
    montoConsulta: "",
    idObraSocial: "",
  });

  // Cargar obras sociales cuando se abre el modal
  useEffect(() => {
    if (open) {
      fetchObras();
    }
  }, [open]);

  const fetchObras = async () => {
    try {
      setLoadingObras(true);
      const response = await fetch("/api/obras-sociales");
      if (!response.ok) throw new Error("No se pudo cargar las obras sociales");

      const data = await response.json();
      // El endpoint devuelve un array directamente
      setObras(Array.isArray(data) ? data : data.obras || []);
    } catch (err) {
      console.error("Error al cargar obras sociales:", err);
      setFieldErrors({ obras: "Error al cargar las obras sociales" });
    } finally {
      setLoadingObras(false);
    }
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: Record<string, string> = {};

    if (!formData.motivoConsulta.trim()) {
      errors.motivoConsulta = "El motivo de la consulta es requerido";
    }

    if (!formData.idObraSocial) {
      errors.idObraSocial = "La obra social es requerida";
    }

    if (!formData.nroAfiliado.trim()) {
      errors.nroAfiliado = "El número de afiliado es requerido";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/pacientes/${idPaciente}/consultas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motivoConsulta: formData.motivoConsulta.trim(),
            diagnosticoConsulta: formData.diagnosticoConsulta.trim() || null,
            tratamientoConsulta: formData.tratamientoConsulta.trim() || null,
            nroAfiliado: formData.nroAfiliado.trim() || null,
            tipoConsulta: formData.tipoConsulta.trim() || null,
            montoConsulta: formData.montoConsulta
              ? parseFloat(formData.montoConsulta)
              : null,
            idObraSocial: parseInt(formData.idObraSocial),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error al registrar la consulta"
        );
      }

      const consulta = await response.json();
      setSuccessOpen(true);
      onConsultaCreated?.(consulta);

      // Resetear formulario y cerrar
      setFormData({
        motivoConsulta: "",
        diagnosticoConsulta: "",
        tratamientoConsulta: "",
        nroAfiliado: "",
        tipoConsulta: "",
        montoConsulta: "",
        idObraSocial: "",
      });
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
        description="Consulta registrada exitosamente"
      />

      <Button
        className="bg-cyan-600 hover:bg-cyan-700 text-white"
        onClick={() => {
          setFieldErrors({});
          setFormData({
            motivoConsulta: "",
            diagnosticoConsulta: "",
            tratamientoConsulta: "",
            nroAfiliado: "",
            tipoConsulta: "",
            montoConsulta: "",
            idObraSocial: "",
          });
          setOpen(true);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Consulta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Consulta</DialogTitle>
            <DialogDescription>
              Completa los detalles de la nueva consulta del paciente
            </DialogDescription>
          </DialogHeader>

          {fieldErrors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{fieldErrors.submit}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fila 1: Motivo y Obra Social */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="idObraSocial" className="text-cyan-900">
                  Obra Social *
                </Label>
                <Select
                  value={formData.idObraSocial}
                  onValueChange={(value) =>
                    handleSelectChange("idObraSocial", value)
                  }
                  disabled={loading || loadingObras}
                >
                  <SelectTrigger className={`border-cyan-200 focus:border-cyan-500 ${
                    fieldErrors.idObraSocial ? "border-red-500 focus:border-red-500" : ""
                  }`}>
                    <SelectValue placeholder="Selecciona una obra social" />
                  </SelectTrigger>
                  <SelectContent>
                    {obras.map((obra) => (
                      <SelectItem
                        key={obra.idObraSocial}
                        value={String(obra.idObraSocial)}
                      >
                        {obra.nombreObraSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.idObraSocial && (
                  <p className="text-xs text-red-600">{fieldErrors.idObraSocial}</p>
                )}
              </div>
            </div>

            {/* Fila 2: Diagnóstico */}
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

            {/* Fila 3: Tratamiento */}
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

            {/* Fila 4: Tipo de Consulta y Nro. Afiliado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoConsulta" className="text-cyan-900">
                  Tipo de Consulta
                </Label>
                <Input
                  id="tipoConsulta"
                  name="tipoConsulta"
                  placeholder="Ej: Primera consulta"
                  value={formData.tipoConsulta}
                  onChange={handleChange}
                  disabled={loading}
                  className="border-cyan-200 focus:border-cyan-500"
                />
              </div>

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
            </div>

            {/* Fila 5: Monto */}
            <div className="space-y-2">
              <Label htmlFor="montoConsulta" className="text-cyan-900">
                Monto
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
                className="border-cyan-200 focus:border-cyan-500"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
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
                    Guardando...
                  </>
                ) : (
                  "Guardar Consulta"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
