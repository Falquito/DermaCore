"use client";

type EmptyStatePacientesProps = {
  q?: string;
};

export default function EmptyStatePacientes({ q = "" }: EmptyStatePacientesProps) {
  const query = q.trim();

  const title = query
    ? `No se encontraron pacientes para “${query}”.`
    : "Todavía no hay pacientes cargados.";

  const subtitle = query
    ? "Probá buscando por nombre, apellido o DNI."
    : "Cuando cargues pacientes, van a aparecer acá.";

  return (
    <div className="rounded-lg border bg-background p-10 text-center">
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
