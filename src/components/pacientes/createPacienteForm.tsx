"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FieldGroup, FieldSet } from "@/components/ui/field";

type InputsCreatePaciente = {
  nombrePaciente: string;
  apellidoPaciente: string;
  telefonoPaciente?: string;
  domicilioPaciente?: string;
  dniPaciente: string;

  fechaNacimiento?: string;
};

type CreatePacienteFormProps = {
  onSubmitPaciente?: (
    data: InputsCreatePaciente & { idObraSocial?: number | null }
  ) => Promise<void> | void;
  dniServerError?: string | null;
  onClearDniServerError?: () => void;
};

export default function CreatePacienteForm({
  onSubmitPaciente,
  dniServerError,
  onClearDniServerError,
}: CreatePacienteFormProps) {
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
      fechaNacimiento: "",
    },
  });

  const onSubmit: SubmitHandler<InputsCreatePaciente> = async (data) => {
    try {
      await onSubmitPaciente?.({
        ...data,
      });

      reset();
    } catch {
      // El error se maneja desde el padre
    }
  };

  return (
    <form
      id="create-paciente-form"
      onSubmit={handleSubmit(onSubmit)}
      className="mt-4 mb-6"
    >
      <FieldSet>
        <FieldGroup>
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Input
                id="nombrePaciente"
                placeholder="Nombre"
                className={
                  errors.nombrePaciente
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "focus-visible:ring-cyan-500"
                }
                {...register("nombrePaciente", { required: true })}
              />
              {errors.nombrePaciente && (
                <p className="text-sm text-red-500">El nombre es obligatorio</p>
              )}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Input
                id="apellidoPaciente"
                placeholder="Apellido"
                className={
                  errors.apellidoPaciente
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "focus-visible:ring-cyan-500"
                }
                {...register("apellidoPaciente", { required: true })}
              />
              {errors.apellidoPaciente && (
                <p className="text-sm text-red-500">El apellido es obligatorio</p>
              )}
            </div>

            {/* Fecha nacimiento */}
            <div className="space-y-2">
              <Input
                id="fechaNacimiento"
                type="date"
                className="focus-visible:ring-cyan-500"
                {...register("fechaNacimiento")}
              />
              <p className="text-xs text-muted-foreground">
                Fecha de nacimiento (opcional)
              </p>
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

              {errors.dniPaciente && (
                <p className="text-sm text-red-500">
                  DNI inválido (7 a 9 dígitos)
                </p>
              )}

              {!errors.dniPaciente && dniServerError && (
                <p className="text-sm text-red-500">{dniServerError}</p>
              )}
            </div>
          </div>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
