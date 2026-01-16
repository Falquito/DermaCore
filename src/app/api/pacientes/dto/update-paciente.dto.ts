export type UpdatePacienteDto = {
  nombrePaciente?: string;
  apellidoPaciente?: string;
  dniPaciente?: string;
  telefonoPaciente?: string | null;
  domicilioPaciente?: string | null;
  estadoPaciente?: boolean;
};

export function validateUpdatePaciente(body: any): { ok: true; data: UpdatePacienteDto } | { ok: false; error: string } {
  if (!body) return { ok: false, error: "Body requerido" };

  const data: UpdatePacienteDto = {};

  if (body.nombrePaciente !== undefined) data.nombrePaciente = String(body.nombrePaciente).trim();
  if (body.apellidoPaciente !== undefined) data.apellidoPaciente = String(body.apellidoPaciente).trim();
  if (body.dniPaciente !== undefined) data.dniPaciente = String(body.dniPaciente).trim();
  if (body.telefonoPaciente !== undefined) data.telefonoPaciente = body.telefonoPaciente == null ? null : String(body.telefonoPaciente).trim();
  if (body.domicilioPaciente !== undefined) data.domicilioPaciente = body.domicilioPaciente == null ? null : String(body.domicilioPaciente).trim();
  if (body.estadoPaciente !== undefined) data.estadoPaciente = Boolean(body.estadoPaciente);

  if (data.dniPaciente !== undefined && data.dniPaciente !== "" && !/^\d{7,9}$/.test(data.dniPaciente)) {
    return { ok: false, error: "dniPaciente inválido (7 a 9 dígitos)" };
  }

  return { ok: true, data };
}
