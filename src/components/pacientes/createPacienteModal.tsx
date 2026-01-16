"use client";

import { useState } from "react";
import CreatePacienteButton from "@/components/pacientes/createPacienteButton";
import CreatePacienteForm from "@/components/pacientes/createPacienteForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPaciente } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Props = {
  onCreated?: () => void;
};

export default function CreatePacienteModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [dniServerError, setDniServerError] = useState<string | null>(null);

  return (
    <>
      <CreatePacienteButton
        onClick={() => {
          setDniServerError(null);
          setOpen(true);
        }}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setDniServerError(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo paciente</DialogTitle>
          </DialogHeader>

          <CreatePacienteForm
            dniServerError={dniServerError}
            onClearDniServerError={() => setDniServerError(null)}
            onSubmitPaciente={async (data) => {
              try {
                setIsLoading(true);
                setDniServerError(null);

                await createPaciente({
                  nombrePaciente: data.nombrePaciente,
                  apellidoPaciente: data.apellidoPaciente,
                  dniPaciente: data.dniPaciente,
                  telefonoPaciente: data.telefonoPaciente || null,
                  domicilioPaciente: data.domicilioPaciente || null,
                  idObraSocial: data.idObraSocial ?? null,
                });

                onCreated?.();
                setOpen(false);
              } catch (e: unknown) {
                const error = e as { message?: string };
                const msg = error?.message ? String(error.message) : "Error al crear paciente";

                if (msg.toLowerCase().includes("dni")) {
                  setDniServerError(msg);

                  throw e;
                }

                setDniServerError("Error al crear paciente");

                throw e;
              } finally {
                setIsLoading(false);
              }
            }}
          />

          <DialogFooter className="flex gap-4 sm:gap-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              form="create-paciente-form"
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
    </>
  );
}
