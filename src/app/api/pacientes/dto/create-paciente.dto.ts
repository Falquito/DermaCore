export type CreatePacienteDto = {
  nombrePaciente: string;
  apellidoPaciente: string;
  dniPaciente: string;
  telefonoPaciente?: string | null;
  domicilioPaciente?: string | null;

  idObraSocial?: number | null;
};

export function validateCreatePaciente(
  body: unknown
): { ok: true; data: CreatePacienteDto } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: "Body requerido" };
  
  const b = body as Record<string, unknown>;

  const nombrePaciente = String(b.nombrePaciente ?? "").trim();
  const apellidoPaciente = String(b.apellidoPaciente ?? "").trim();
  const dniPaciente = String(b.dniPaciente ?? "").trim();

  if (!nombrePaciente) return { ok: false, error: "nombrePaciente es requerido" };
  if (!apellidoPaciente) return { ok: false, error: "apellidoPaciente es requerido" };
  if (!dniPaciente) return { ok: false, error: "dniPaciente es requerido" };

  if (!/^\d{7,9}$/.test(dniPaciente))
    return { ok: false, error: "dniPaciente inválido (7 a 9 dígitos)" };

  const telefonoPaciente = b.telefonoPaciente == null ? null : String(b.telefonoPaciente).trim();
  const domicilioPaciente = b.domicilioPaciente == null ? null : String(b.domicilioPaciente).trim();

  const rawIdObra = b.idObraSocial;
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
