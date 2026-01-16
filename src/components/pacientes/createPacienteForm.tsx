"use client";

import { useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

import { Input } from "@/components/ui/input";
import ObraSocialComboBox, { ObraSocialOption } from "@/components/pacientes/obraSocialComboBox";

import { useObraSocial } from "@/hooks/useObras";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import CreateModalObraSocialComponent from "./newObraSocialPacient";

type InputsCreatePaciente = {
  nombrePaciente: string;
  apellidoPaciente: string;
  telefonoPaciente?: string;
  domicilioPaciente?: string;
  dniPaciente: string;
};

type CreatePacienteFormProps = {
  onSubmitPaciente?: (data: InputsCreatePaciente & { idObraSocial?: number | null }) => Promise<void> | void;
  dniServerError?: string | null;
  onClearDniServerError?: () => void;
};

export default function CreatePacienteForm({
  onSubmitPaciente,
  dniServerError,
  onClearDniServerError,
}: CreatePacienteFormProps) {
  const { obras, loading, error, refrescar } = useObraSocial();

  const obraOptions: ObraSocialOption[] = useMemo(
    () =>
      obras.map((o) => ({
        id: o.idObraSocial,
        nombre: o.nombreObraSocial,
      })),
    [obras]
  );

  const [lastCreatedObraName, setLastCreatedObraName] = useState<string | null>(null);
  const [obraSelected, setObraSelected] = useState<ObraSocialOption | null>(null);
  const [openNuevaOS, setOpenNuevaOS] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InputsCreatePaciente>({
    defaultValues: {
      nombrePaciente: "",
      apellidoPaciente: "",
      telefonoPaciente: "",
      domicilioPaciente: "",
      dniPaciente: "",
    },
  });

  const onSubmit: SubmitHandler<InputsCreatePaciente> = async (data) => {
    try {
      await onSubmitPaciente?.({
        ...data,
        idObraSocial: obraSelected?.id ?? null,
      });

      reset();
      setObraSelected(null);
    } catch {
      // El error se maneja desde el padre anasheeee
    }
  };

  return (
    <>
      <form id="create-paciente-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FieldSet>
          <FieldGroup>
            {/* Nombre */}
            <div className="space-y-2">
              <Input
                id="nombrePaciente"
                placeholder="Nombre"
                className={
                  errors.nombrePaciente ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-cyan-500"
                }
                {...register("nombrePaciente", { required: true })}
              />
              {errors.nombrePaciente && <p className="text-sm text-red-500">El nombre es obligatorio</p>}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Input
                id="apellidoPaciente"
                placeholder="Apellido"
                className={
                  errors.apellidoPaciente ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-cyan-500"
                }
                {...register("apellidoPaciente", { required: true })}
              />
              {errors.apellidoPaciente && <p className="text-sm text-red-500">El apellido es obligatorio</p>}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Input
                id="telefonoPaciente"
                placeholder="Teléfono"
                className="focus-visible:ring-cyan-500"
                {...register("telefonoPaciente")}
              />
            </div>

            {/* Domicilio */}
            <div className="space-y-2">
              <Input
                id="domicilioPaciente"
                placeholder="Domicilio"
                className="focus-visible:ring-cyan-500"
                {...register("domicilioPaciente")}
              />
            </div>

            {/* DNI */}
            <div className="space-y-2">
              <Input
                id="dniPaciente"
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
                  onChange: () => onClearDniServerError?.(),
                })}
              />

              {errors.dniPaciente && <p className="text-sm text-red-500">DNI inválido (7 a 9 dígitos)</p>}

              {!errors.dniPaciente && dniServerError && (
                <p className="text-sm text-red-500">{dniServerError}</p>
              )}
            </div>

            {/* Obra social */}
            <div className="space-y-2">
              <ObraSocialComboBox
                options={obraOptions}
                value={obraSelected}
                onChange={setObraSelected}
                disabled={loading || !!error}
                onCreateNew={() => setOpenNuevaOS(true)}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </FieldGroup>
        </FieldSet>
      </form>

      {/* Modal para crear obra social */}
      <CreateModalObraSocialComponent
        open={openNuevaOS}
        onOpenChange={setOpenNuevaOS}
        hideTrigger
        onCreatedNombre={(nombre) => setLastCreatedObraName(nombre)}
        onSuccess={async () => {
          await refrescar();

          if (lastCreatedObraName) {
            const res = await fetch("/api/obras-sociales");
            const data = await res.json();

            if (!data?.error && Array.isArray(data)) {
              const match = data.find(
                (o: any) =>
                  String(o?.nombreObraSocial ?? "").toLowerCase() === lastCreatedObraName.toLowerCase()
              );

              if (match) {
                setObraSelected({
                  id: Number(match.idObraSocial),
                  nombre: String(match.nombreObraSocial),
                });
              }
            }

            setLastCreatedObraName(null);
          }
        }}
      />
    </>
  );
}
