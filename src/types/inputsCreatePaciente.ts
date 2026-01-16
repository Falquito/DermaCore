export type InputCreatePaciente = {
  nombrePaciente: string;
  apellidoPaciente: string;
  dniPaciente: string;
  telefonoPaciente?: string | null;
  domicilioPaciente?: string | null;
};