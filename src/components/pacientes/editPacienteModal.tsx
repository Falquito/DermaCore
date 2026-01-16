"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import type { PacienteConObras } from "@/types/pacienteConObras";
import { updatePaciente } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type InputsEditPaciente = {
  nombrePaciente: string;
  apellidoPaciente: string;
  telefonoPaciente?: string;
  domicilioPaciente?: string;
  dniPaciente: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: PacienteConObras;
  onSaved?: () => void;
};

export default function EditPacienteModal({ open, onOpenChange, paciente, onSaved }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [dniServerError, setDniServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InputsEditPaciente>({
    defaultValues: {
      nombrePaciente: "",
      apellidoPaciente: "",
      telefonoPaciente: "",
      domicilioPaciente: "",
      dniPaciente: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    setDniServerError(null);
    reset({
      nombrePaciente: paciente.nombrePaciente ?? "",
      apellidoPaciente: paciente.apellidoPaciente ?? "",
      telefonoPaciente: paciente.telefonoPaciente ?? "",
      domicilioPaciente: paciente.domicilioPaciente ?? "",
      dniPaciente: paciente.dniPaciente ?? "",
    });
  }, [open, paciente, reset]);

  const onSubmit: SubmitHandler<InputsEditPaciente> = async (data) => {
    try {
      setIsLoading(true);
      setDniServerError(null);

      await updatePaciente({
        id: paciente.idPaciente,
        nombrePaciente: data.nombrePaciente,
        apellidoPaciente: data.apellidoPaciente,
        dniPaciente: data.dniPaciente,
        telefonoPaciente: data.telefonoPaciente || null,
        domicilioPaciente: data.domicilioPaciente || null,
      });

      onSaved?.();
      onOpenChange(false);
    } catch (e: unknown) {
      const error = e as { message?: string };
      const msg = error?.message ? String(error.message) : "Error al actualizar paciente";
      if (msg.toLowerCase().includes("dni")) {
        setDniServerError(msg);
        return;
      }
      setDniServerError("Error al actualizar paciente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar paciente</DialogTitle>
        </DialogHeader>

        <form id="edit-paciente-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            placeholder="Nombre"
            className={errors.nombrePaciente ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-cyan-500"}
            {...register("nombrePaciente", { required: true })}
          />
          {errors.nombrePaciente && <p className="text-sm text-red-500">El nombre es obligatorio</p>}

          <Input
            placeholder="Apellido"
            className={errors.apellidoPaciente ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-cyan-500"}
            {...register("apellidoPaciente", { required: true })}
          />
          {errors.apellidoPaciente && <p className="text-sm text-red-500">El apellido es obligatorio</p>}

          <Input
            placeholder="Teléfono"
            className="focus-visible:ring-cyan-500"
            {...register("telefonoPaciente")}
          />

          <Input
            placeholder="Domicilio"
            className="focus-visible:ring-cyan-500"
            {...register("domicilioPaciente")}
          />

          <div className="space-y-2">
            <Input
              placeholder="DNI"
              inputMode="numeric"
              className={
                errors.dniPaciente || dniServerError
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "focus-visible:ring-cyan-500"
              }
              {...register("dniPaciente", {
                required: true,
                pattern: /^\d{7,9}$/,
                onChange: () => setDniServerError(null),
              })}
            />
            {errors.dniPaciente && <p className="text-sm text-red-500">DNI inválido (7 a 9 dígitos)</p>}
            {!errors.dniPaciente && dniServerError && <p className="text-sm text-red-500">{dniServerError}</p>}
          </div>
        </form>

        <DialogFooter className="flex gap-4 sm:gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="edit-paciente-form"
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[110px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
