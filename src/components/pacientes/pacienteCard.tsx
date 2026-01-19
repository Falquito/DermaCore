"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  MapPin,
  Phone,
  MoreHorizontal,
  Pencil,
  CornerDownRight,
  IdCard,
} from "lucide-react";

import type { PacienteConObras } from "@/types/pacienteConObras";
import { setEstadoPaciente, formatFechaAR } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import EditPacienteModal from "@/components/pacientes/editPacienteModal";

type PacienteCardProps = {
  paciente: PacienteConObras;
  onVerHistoria?: (idPaciente: number) => void;
  onChanged?: () => void;
  onEditSuccess?: () => void;
};

export default function PacienteCard({
  paciente,
  onVerHistoria,
  onChanged,
  onEditSuccess,
}: PacienteCardProps) {
  const {
    idPaciente,
    nombrePaciente,
    apellidoPaciente,
    dniPaciente,
    telefonoPaciente,
    domicilioPaciente,
    estadoPaciente,
    consultas,
  } = paciente;

  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirmEstado, setOpenConfirmEstado] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const ultimaConsulta = consultas?.[0];
  const obraSocialActual = ultimaConsulta?.obraSocial?.nombreObraSocial ?? null;
  const ultimaConsultaIso = ultimaConsulta?.fechaHoraConsulta ?? null;

  const nroAfiliado = (ultimaConsulta?.nroAfiliado ?? "")?.trim();
  const nroAfiliadoLabel = nroAfiliado ? nroAfiliado : "Sin número de afiliado";

  const labelEstadoAction = estadoPaciente ? "Dar de baja" : "Dar de alta";
  const nextEstado = !estadoPaciente;

  return (
    <>
      <Card className="rounded-xl border-muted/60">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {nombrePaciente} {apellidoPaciente}
              </h3>
              <p className="text-sm text-muted-foreground">DNI: {dniPaciente}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setOpenEdit(true)}>
                    <Pencil className="mr-2 h-4 w-4 text-black" />
                    <span>Editar</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setOpenConfirmEstado(true)}
                    className={estadoPaciente ? "text-red-600" : "text-cyan-700"}
                  >
                    <CornerDownRight
                      className={`mr-2 h-4 w-4 ${
                        estadoPaciente ? "text-red-600" : "text-cyan-700"
                      }`}
                    />
                    <span>{labelEstadoAction}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge
                variant={estadoPaciente ? "default" : "secondary"}
                className={
                  estadoPaciente
                    ? "bg-cyan-100 text-cyan-400"
                    : "bg-red-100 text-red-400"
                }
              >
                {estadoPaciente ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">

            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              {obraSocialActual ? (
                <Badge variant="secondary" className="font-medium">
                  {obraSocialActual}
                </Badge>
              ) : (
                <span className="text-muted-foreground">Sin obra social</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <IdCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{nroAfiliadoLabel}</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {telefonoPaciente ?? "Sin teléfono"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {domicilioPaciente ?? "Sin domicilio"}
              </span>
            </div>
          </div>

          <Separator className="my-5" />

          <p className="text-xs text-muted-foreground">
            Última consulta:{" "}
            {ultimaConsultaIso ? formatFechaAR(ultimaConsultaIso) : "—"}
          </p>

          <Button
            className="mt-3 w-full rounded-lg bg-cyan-400 hover:bg-cyan-500"
            onClick={() => onVerHistoria?.(idPaciente)}
          >
            Ver Historia Clínica
          </Button>
        </CardContent>
      </Card>

      <EditPacienteModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        paciente={paciente}
        onSaved={() => {
          onChanged?.();
          onEditSuccess?.();
        }}
      />

      <AlertDialog open={openConfirmEstado} onOpenChange={setOpenConfirmEstado}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labelEstadoAction}</AlertDialogTitle>
            <AlertDialogDescription>
              {estadoPaciente
                ? "El paciente quedará inactivo."
                : "El paciente volverá a quedar activo."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex gap-4 sm:gap-6">
            <AlertDialogCancel disabled={isToggling}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              disabled={isToggling}
              onClick={async () => {
                try {
                  setIsToggling(true);
                  await setEstadoPaciente(idPaciente, nextEstado);
                  onChanged?.();
                } finally {
                  setIsToggling(false);
                }
              }}
              className={
                estadoPaciente
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-cyan-600 hover:bg-cyan-700"
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
