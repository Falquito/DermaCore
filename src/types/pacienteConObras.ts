import type { Paciente } from "@/types/paciente";

export type PacienteConObras = Paciente & {
  pacienteXObra: Array<{
    obraSocial: {
      idObraSocial: number;
      nombreObraSocial: string;
      estadoObraSocial: boolean;
    };
  }>;
};
