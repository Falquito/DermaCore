import type { Paciente } from "@/types/paciente";

export type PacienteConObras = Paciente & {
  consultas: Array<{
    fechaHoraConsulta: string;
    nroAfiliado?: string | null;
    obraSocial: {
      idObraSocial: number;
      nombreObraSocial: string;
      estadoObraSocial: boolean;
    } | null;
  }>;
};
