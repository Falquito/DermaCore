export type UpdatePacienteDto = {
  nombrePaciente?: string;
  apellidoPaciente?: string;
  dniPaciente?: string;
  telefonoPaciente?: string | null;
  domicilioPaciente?: string | null;
  estadoPaciente?: boolean;

  fechaNacimiento?: string | null;
};

function isValidYYYYMMDD(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(d.getTime());
}

export function validateUpdatePaciente(
  body: unknown
): { ok: true; data: UpdatePacienteDto } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body requerido" };

  const b = body as Record<string, unknown>;
  const data: UpdatePacienteDto = {};

  if (b.nombrePaciente !== undefined) data.nombrePaciente = String(b.nombrePaciente).trim();
  if (b.apellidoPaciente !== undefined) data.apellidoPaciente = String(b.apellidoPaciente).trim();
  if (b.dniPaciente !== undefined) data.dniPaciente = String(b.dniPaciente).trim();
  if (b.telefonoPaciente !== undefined)
    data.telefonoPaciente = b.telefonoPaciente == null ? null : String(b.telefonoPaciente).trim();
  if (b.domicilioPaciente !== undefined)
    data.domicilioPaciente = b.domicilioPaciente == null ? null : String(b.domicilioPaciente).trim();
  if (b.estadoPaciente !== undefined) data.estadoPaciente = Boolean(b.estadoPaciente);

  if (b.fechaNacimiento !== undefined) {
    const raw =
      b.fechaNacimiento == null ? null : String(b.fechaNacimiento).trim();
    data.fechaNacimiento = raw && raw.length > 0 ? raw : null;

    if (data.fechaNacimiento && !isValidYYYYMMDD(data.fechaNacimiento)) {
      return { ok: false, error: "fechaNacimiento inválida (formato YYYY-MM-DD)" };
    }
  }

  if (
    data.dniPaciente !== undefined &&
    data.dniPaciente !== "" &&
    !/^\d{7,9}$/.test(data.dniPaciente)
  ) {
    return { ok: false, error: "dniPaciente inválido (7 a 9 dígitos)" };
  }

  return { ok: true, data };
}
