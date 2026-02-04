export type CreatePacienteDto = {
  nombrePaciente: string;
  apellidoPaciente: string;
  dniPaciente: string;
  telefonoPaciente?: string | null;
  domicilioPaciente?: string | null;

  fechaNacimiento?: string | null;
};

function isValidYYYYMMDD(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(d.getTime());
}

export function validateCreatePaciente(
  body: unknown
): { ok: true; data: CreatePacienteDto } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body requerido" };
  }

  const b = body as Record<string, unknown>;

  const nombrePaciente = String(b.nombrePaciente ?? "").trim();
  const apellidoPaciente = String(b.apellidoPaciente ?? "").trim();
  const dniPaciente = String(b.dniPaciente ?? "").trim();

  if (!nombrePaciente) return { ok: false, error: "nombrePaciente es requerido" };
  if (!apellidoPaciente) return { ok: false, error: "apellidoPaciente es requerido" };
  if (!dniPaciente) return { ok: false, error: "dniPaciente es requerido" };

  if (!/^\d{7,9}$/.test(dniPaciente)) {
    return { ok: false, error: "dniPaciente inválido (7 a 9 dígitos)" };
  }

  const telefonoPaciente =
    b.telefonoPaciente == null ? null : String(b.telefonoPaciente).trim();
  const domicilioPaciente =
    b.domicilioPaciente == null ? null : String(b.domicilioPaciente).trim();

  const rawFechaNacimiento =
    b.fechaNacimiento == null ? null : String(b.fechaNacimiento).trim();

  const fechaNacimiento =
    rawFechaNacimiento && rawFechaNacimiento.length > 0 ? rawFechaNacimiento : null;

  if (fechaNacimiento && !isValidYYYYMMDD(fechaNacimiento)) {
    return { ok: false, error: "fechaNacimiento inválida (formato YYYY-MM-DD)" };
  }

  return {
    ok: true,
    data: {
      nombrePaciente,
      apellidoPaciente,
      dniPaciente,
      telefonoPaciente: telefonoPaciente || null,
      domicilioPaciente: domicilioPaciente || null,
      fechaNacimiento,
    },
  };
}
