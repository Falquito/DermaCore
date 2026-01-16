"use client";

import type { PacienteConObras } from "@/types/pacienteConObras";
import PacienteCard from "@/components/pacientes/pacienteCard";

type ListaPacientesProps = {
  pacientes: PacienteConObras[];
  getUltimaConsulta?: (p: PacienteConObras) => string | undefined;
  onVerHistoria?: (idPaciente: number) => void;
  onChanged?: () => void;
};

export default function ListaPacientes({
  pacientes,
  getUltimaConsulta,
  onVerHistoria,
  onChanged,
}: ListaPacientesProps) {
  if (!pacientes || pacientes.length === 0) {
    return (
      <div className="rounded-lg border bg-background p-8 text-center text-sm text-muted-foreground">
        No hay pacientes para mostrar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {pacientes.map((p) => (
        <PacienteCard
          key={p.idPaciente}
          paciente={p}
          ultimaConsulta={getUltimaConsulta?.(p)}
          onVerHistoria={onVerHistoria}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
