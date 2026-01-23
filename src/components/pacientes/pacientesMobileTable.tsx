"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PacienteConObras } from "@/types/pacienteConObras";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

import { MoreHorizontal, Pencil, CornerDownRight } from "lucide-react";

import EditPacienteModal from "@/components/pacientes/editPacienteModal";
import { setEstadoPaciente, formatFechaAR } from "@/lib/utils";

type Props = {
  pacientes: PacienteConObras[];
  onVerHistoria?: (idPaciente: number) => void;
  onChanged?: () => void;
  onEditSuccess?: () => void;
};

function Item({
  paciente,
  onVerHistoria: _onVerHistoria,
  onChanged,
  onEditSuccess,
}: {
  paciente: PacienteConObras;
  onVerHistoria?: (idPaciente: number) => void;
  onChanged?: () => void;
  onEditSuccess?: () => void;
}) {
  const router = useRouter();
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

  const ultimaConsulta = consultas?.[0] ?? null;

  const obraSocialActual = ultimaConsulta?.obraSocial?.nombreObraSocial ?? null;
  const nroAfiliadoActual = ultimaConsulta?.nroAfiliado ?? null;
  const ultimaConsultaIso = ultimaConsulta?.fechaHoraConsulta ?? null;

  const labelEstadoAction = estadoPaciente ? "Dar de baja" : "Dar de alta";
  const nextEstado = !estadoPaciente;

  return (
    <>
      <div className="px-4 py-3">
        {/* Header fila */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">
              {nombrePaciente} {apellidoPaciente}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              DNI: {dniPaciente}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
          </div>
        </div>

        {/* Detalles (modo lista) */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground/70">Tel: </span>
            {telefonoPaciente ?? "Sin teléfono"}
          </div>

          <div className="text-muted-foreground truncate">
            <span className="font-medium text-foreground/70">Dom: </span>
            {domicilioPaciente ?? "Sin domicilio"}
          </div>

          <div className="text-muted-foreground truncate">
            <span className="font-medium text-foreground/70">Obra: </span>
            {obraSocialActual ?? "Sin obra social"}
          </div>

          <div className="text-muted-foreground truncate">
            <span className="font-medium text-foreground/70">Afiliado: </span>
            {nroAfiliadoActual ?? "Sin número"}
          </div>

          <div className="col-span-2 text-muted-foreground">
            <span className="font-medium text-foreground/70">Última consulta: </span>
            {ultimaConsultaIso ? formatFechaAR(ultimaConsultaIso) : "—"}
          </div>
        </div>

        {/* CTA */}
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => router.push(`/pacientes/${idPaciente}`)}
        >
          Ver Historia Clínica
        </Button>
      </div>

      {/* Separador */}
      <div className="h-px bg-border" />

      {/* Modal editar */}
      <EditPacienteModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        paciente={paciente}
        onSaved={() => {
          onChanged?.();
          onEditSuccess?.();
        }}
      />

      {/* Confirm alta/baja */}
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

export default function PacientesMobileTable({
  pacientes,
  onVerHistoria,
  onChanged,
  onEditSuccess,
}: Props) {
  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="px-4 py-3 border-b">
        <div className="font-medium">Pacientes</div>
      </div>

      <div>
        {pacientes.map((p) => (
          <Item
            key={p.idPaciente}
            paciente={p}
            onVerHistoria={onVerHistoria}
            onChanged={onChanged}
            onEditSuccess={onEditSuccess}
          />
        ))}
      </div>
    </div>
  );
}
