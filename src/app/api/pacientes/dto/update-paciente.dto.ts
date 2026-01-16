export type UpdatePacienteDto = {
  nombrePaciente?: string;
  apellidoPaciente?: string;
  dniPaciente?: string;
  telefonoPaciente?: string | null;
  domicilioPaciente?: string | null;
  estadoPaciente?: boolean;
};

export function validateUpdatePaciente(body: unknown): { ok: true; data: UpdatePacienteDto } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: "Body requerido" };
  
  const b = body as Record<string, unknown>;
  const data: UpdatePacienteDto = {};

  if (b.nombrePaciente !== undefined) data.nombrePaciente = String(b.nombrePaciente).trim();
  if (b.apellidoPaciente !== undefined) data.apellidoPaciente = String(b.apellidoPaciente).trim();
  if (b.dniPaciente !== undefined) data.dniPaciente = String(b.dniPaciente).trim();
  if (b.telefonoPaciente !== undefined) data.telefonoPaciente = b.telefonoPaciente == null ? null : String(b.telefonoPaciente).trim();
  if (b.domicilioPaciente !== undefined) data.domicilioPaciente = b.domicilioPaciente == null ? null : String(b.domicilioPaciente).trim();
  if (b.estadoPaciente !== undefined) data.estadoPaciente = Boolean(b.estadoPaciente);

  if (data.dniPaciente !== undefined && data.dniPaciente !== "" && !/^\d{7,9}$/.test(data.dniPaciente)) {
    return { ok: false, error: "dniPaciente inválido (7 a 9 dígitos)" };
  }

  return { ok: true, data };
}
