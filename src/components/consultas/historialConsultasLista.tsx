"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, X, ChevronDownIcon } from "lucide-react";
import { formatFechaAR } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Consulta } from "@/types/consulta";
import EditarConsultaModal from "@/components/consultas/editarConsultaModal";

type Props = {
  consultas: Consulta[];
  idPaciente: number;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: (from?: Date, to?: Date) => void;
  onConsultaUpdated?: (consulta: Consulta) => void;
};

export default function HistorialConsultasLista({
  consultas,
  idPaciente,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onConsultaUpdated,
}: Props) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleDateRangeChange = (newRange: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setDateRange(newRange);
    // Notificar al padre para que recargue consultas con nuevo rango
    onLoadMore?.(newRange.from, newRange.to);
  };

  const handleClearFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    // Notificar al padre para recargue con rango por defecto
    onLoadMore?.(undefined, undefined);
  };

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && onLoadMore) {
          onLoadMore(dateRange.from, dateRange.to);
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, isLoadingMore, onLoadMore, dateRange]);

  return (
    <div className="space-y-4">
      {/* Date pickers para rango de fechas - SIEMPRE VISIBLE */}
      <div className="flex flex-col gap-3">
        <Label className="text-cyan-900 font-semibold">Filtrar por fechas</Label>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Label y Picker: Desde */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-cyan-900">Desde:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between border-cyan-200 hover:border-cyan-400 text-cyan-900 w-48"
                >
                  <span className="text-sm">
                    {dateRange.from
                      ? dateRange.from.toLocaleDateString("es-AR")
                      : "Seleccionar fecha"}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  captionLayout="dropdown"
                  disabled={(date) =>
                    dateRange.to ? date > dateRange.to : false
                  }
                  onSelect={(date) => {
                    handleDateRangeChange({
                      ...dateRange,
                      from: date,
                    });
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Label y Picker: Hasta */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-cyan-900">Hasta:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between border-cyan-200 hover:border-cyan-400 text-cyan-900 w-48"
                >
                  <span className="text-sm">
                    {dateRange.to
                      ? dateRange.to.toLocaleDateString("es-AR")
                      : "Seleccionar fecha"}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  captionLayout="dropdown"
                  disabled={(date) =>
                    dateRange.from ? date < dateRange.from : false
                  }
                  onSelect={(date) => {
                    handleDateRangeChange({
                      ...dateRange,
                      to: date,
                    });
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Botón limpiar */}
          {(dateRange.from || dateRange.to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilter}
              className="text-cyan-600 hover:text-cyan-700"
            >
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Historial */}
      {consultas.length === 0 ? (
        <Card className="border-dashed border-cyan-300 bg-cyan-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Plus className="h-12 w-12 text-cyan-400 mb-4" />
            <p className="text-lg font-semibold text-cyan-900 mb-2">
              Sin consultas registradas
            </p>
            <p className="text-sm text-cyan-700 mb-4">
              Comienza registrando la primera consulta del paciente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-h-132 overflow-y-auto pr-4 custom-scrollbar">
          {consultas.map((consulta) => (
        <Card
          key={consulta.idConsulta}
          className="border-cyan-200 hover:border-cyan-400 transition-colors flex-shrink-0"
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Encabezado: Fecha, Tipo de Consulta y Botón Editar */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Fecha
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatFechaAR(consulta.fechaHoraConsulta)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {consulta.tipoConsulta === "particular" || !consulta.obraSocial ? (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      Particular
                    </Badge>
                  ) : (
                    <Badge className="bg-cyan-100 text-cyan-700 text-xs">
                      {consulta.obraSocial.nombreObraSocial}
                    </Badge>
                  )}
                  <EditarConsultaModal
                    consulta={consulta}
                    idPaciente={idPaciente}
                    onConsultaUpdated={onConsultaUpdated}
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Motivo
                </p>
                <p className="text-sm text-foreground">
                  {consulta.motivoConsulta}
                </p>
              </div>

              {/* Diagnóstico */}
              {consulta.diagnosticoConsulta && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Diagnóstico
                  </p>
                  <p className="text-sm text-foreground line-clamp-2">
                    {consulta.diagnosticoConsulta}
                  </p>
                </div>
              )}

              {/* Tratamiento */}
              {consulta.tratamientoConsulta && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Tratamiento
                  </p>
                  <p className="text-sm text-foreground line-clamp-2">
                    {consulta.tratamientoConsulta}
                  </p>
                </div>
              )}

              {/* Detalles adicionales - Condicional según tipo */}
              {consulta.tipoConsulta === "particular" ? (
                // Para consultas particulares: mostrar monto
                consulta.montoConsulta && (
                  <div className="pt-2 border-t border-cyan-100">
                    <p className="text-xs font-medium text-muted-foreground">
                      Monto:
                    </p>
                    <p className="text-sm font-semibold text-cyan-700">
                      ${consulta.montoConsulta.toFixed(2)}
                    </p>
                  </div>
                )
              ) : (
                // Para consultas de obra social: mostrar nro de afiliado
                consulta.nroAfiliado && (
                  <div className="pt-2 border-t border-cyan-100">
                    <p className="text-xs font-medium text-muted-foreground">
                      Nro. Afiliado:
                    </p>
                    <p className="text-sm text-foreground">
                      {consulta.nroAfiliado}
                    </p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
          ))}

          {/* Observer para carga infinita */}
          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-4">
              {isLoadingMore && (
                <Loader2 className="h-6 w-6 text-cyan-600 animate-spin" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
