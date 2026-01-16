export type CreatePacienteDto = {
  nombrePaciente: string;
  apellidoPaciente: string;
  dniPaciente: string;
  telefonoPaciente?: string | null;
  domicilioPaciente?: string | null;

  idObraSocial?: number | null;
};

export function validateCreatePaciente(
  body: any
): { ok: true; data: CreatePacienteDto } | { ok: false; error: string } {
  if (!body) return { ok: false, error: "Body requerido" };

  const nombrePaciente = String(body.nombrePaciente ?? "").trim();
  const apellidoPaciente = String(body.apellidoPaciente ?? "").trim();
  const dniPaciente = String(body.dniPaciente ?? "").trim();

  if (!nombrePaciente) return { ok: false, error: "nombrePaciente es requerido" };
  if (!apellidoPaciente) return { ok: false, error: "apellidoPaciente es requerido" };
  if (!dniPaciente) return { ok: false, error: "dniPaciente es requerido" };

  if (!/^\d{7,9}$/.test(dniPaciente))
    return { ok: false, error: "dniPaciente inválido (7 a 9 dígitos)" };

  const telefonoPaciente = body.telefonoPaciente == null ? null : String(body.telefonoPaciente).trim();
  const domicilioPaciente = body.domicilioPaciente == null ? null : String(body.domicilioPaciente).trim();

  const rawIdObra = body.idObraSocial;
  const idObraSocial =
    rawIdObra == null || rawIdObra === "" ? null : Number(rawIdObra);

  if (idObraSocial != null && (!Number.isFinite(idObraSocial) || idObraSocial <= 0)) {
    return { ok: false, error: "idObraSocial inválido" };
  }

  return {
    ok: true,
    data: {
      nombrePaciente,
      apellidoPaciente,
      dniPaciente,
      telefonoPaciente: telefonoPaciente || null,
      domicilioPaciente: domicilioPaciente || null,
      idObraSocial,
    },
  };
}
