"use client";

import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import ObraSocialComboBox, {
  type ObraSocialOption,
} from "@/components/pacientes/obraSocialComboBox";
import NotifySuccessComponent from "@/components/pacientes/notifySuccessPaciente";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import type { Consulta } from "@/types/consulta";

type UltimaObraSocial = {
  ultimaObraSocial: {
    idObraSocial: number;
    nombreObraSocial: string;
  } | null;
  nroAfiliado: string | null;
  fechaConsulta?: string;
  mensaje?: string;
};

type Props = {
  idPaciente: number;
  onConsultaCreated?: (consulta: Consulta) => void;
  ultimaObraSocial?: UltimaObraSocial | null;
};

export default function RegistrarConsultaForm({
  idPaciente,
  onConsultaCreated,
  ultimaObraSocial,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingObras, setLoadingObras] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [obras, setObras] = useState<ObraSocialOption[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [usarUltimaObraSocial, setUsarUltimaObraSocial] = useState(false);

  // Para el combobox de obra social
  const [selectedObraSocial, setSelectedObraSocial] =
    useState<ObraSocialOption | null>(null);

  const [formData, setFormData] = useState({
    motivoConsulta: "",
    diagnosticoConsulta: "",
    tratamientoConsulta: "",
    nroAfiliado: "",
    tipoConsultaType: "obra-social", // "particular" o "obra-social"
    montoConsulta: "",
  });

  // Cargar obras sociales al montar
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

  React.useEffect(() => {
    fetchObras();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando empieza a escribir
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
    // Limpiar obra social o monto según el tipo
    if (value === "particular") {
      setSelectedObraSocial(null);
    } else {
      setFormData((prev) => ({ ...prev, montoConsulta: "" }));
    }
    // Limpiar errores relacionados
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
        `/api/pacientes/${idPaciente}/consultas`,
        {
          method: "POST",
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

      const consulta = await response.json();
      setSuccessOpen(true);
      onConsultaCreated?.(consulta);

      // Resetear formulario
      setFormData({
        motivoConsulta: "",
        diagnosticoConsulta: "",
        tratamientoConsulta: "",
        nroAfiliado: "",
        tipoConsultaType: "obra-social",
        montoConsulta: "",
      });
      setSelectedObraSocial(null);
      setUsarUltimaObraSocial(false);

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

      <Card className="border-cyan-200 sticky top-6 w-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-cyan-900">Registrar Nueva Consulta</CardTitle>
        </CardHeader>
        
        {/* Form con altura fija - no scrolleable */}
        <CardContent className="flex-1 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
            {/* Error de submit */}
            {fieldErrors.submit && (
              <Alert variant="destructive" className="mb-2">
                <AlertDescription>{fieldErrors.submit}</AlertDescription>
              </Alert>
            )}

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

            {/* Tipo de Consulta: Particular o Obra Social */}
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

          {/* Checkbox: Usar Última Obra Social Utilizada */}
          {formData.tipoConsultaType === "obra-social" && 
           ultimaObraSocial?.ultimaObraSocial && (
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-cyan-200">
              <Checkbox
                id="usarUltimaObraSocial"
                checked={usarUltimaObraSocial}
                onCheckedChange={(checked: CheckedState) => {
                  const isChecked = checked === true;
                  setUsarUltimaObraSocial(isChecked);
                  if (isChecked) {
                    // Rellenar con la última obra social
                    const ultimaObraEnLista = obras.find(
                      (o) => o.idObraSocial === ultimaObraSocial.ultimaObraSocial?.idObraSocial
                    );
                    if (ultimaObraEnLista) {
                      setSelectedObraSocial(ultimaObraEnLista);
                    }
                    setFormData((prev) => ({
                      ...prev,
                      nroAfiliado: ultimaObraSocial.nroAfiliado || "",
                    }));
                  } else {
                    // Limpiar campos
                    setSelectedObraSocial(null);
                    setFormData((prev) => ({
                      ...prev,
                      nroAfiliado: "",
                    }));
                  }
                }}
                disabled={loading || loadingObras}
              />
              <label 
                htmlFor="usarUltimaObraSocial"
                className="text-sm font-medium text-cyan-900 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Usar última obra social utilizada
              </label>
            </div>
          )}

          {/* Obra Social (solo si tipo es "obra-social") */}
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

          {/* Monto (solo si tipo es "particular") */}
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

          {/* Nro. Afiliado (solo si tipo es "obra-social") */}
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
              rows={2}
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
              rows={2}
            />
          </div>

          {/* Botón Submit */}
          <Button
            type="submit"
            disabled={loading || loadingObras}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white mt-auto"
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
          </form>
        </CardContent>
      </Card>
    </>
  );
}
