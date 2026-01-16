export type ObraSocialMini = {
  idObraSocial: number;
  nombreObraSocial: string;
  estadoObraSocial: boolean;
};

export type PacienteXObraMini = {
  obraSocial: ObraSocialMini;
};

export type Paciente = {
  idPaciente: number;
  nombrePaciente: string;
  apellidoPaciente: string;
  dniPaciente: string;
  telefonoPaciente: string | null;
  domicilioPaciente: string | null;
  fechaHoraPaciente: string;
  estadoPaciente: boolean;

  // Relación 
  pacienteXObra: PacienteXObraMini[];
};
