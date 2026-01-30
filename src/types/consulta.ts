export type Consulta = {
  idConsulta: number;
  motivoConsulta: string;
  diagnosticoConsulta: string | null;
  tratamientoConsulta: string | null;
  estudiosComplementarios: string | null;
  fechaHoraConsulta: string;
  nroAfiliado: string | null;
  tipoConsulta: string;
  tieneCoseguro: boolean | null;
  montoConsulta: number | null;
  idCoseguro: number | null;
  obraSocial: {
    idObraSocial: number;
    nombreObraSocial: string;
  } | null;
  coseguro: {
    idCoseguro: number;
    nombreCoseguro: string;
  } | null;
};
