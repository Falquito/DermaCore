import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "prisma", "migration-data");

function readJson<T>(file: string): T[] {
  const filePath = path.join(DATA_DIR, file);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T[];
}

function normStr(v: unknown) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function normDni(v: unknown) {
  // saca espacios y puntos típicos del DNI en papel
  return normStr(v).replaceAll(".", "").replaceAll(" ", "");
}

function toDateOrNull(v: unknown): Date | null {
  const s = normStr(v);
  if (!s) return null;

  // Soporta "YYYY-MM-DD" o ISO "YYYY-MM-DDTHH:mm:ss.sssZ"
  // Si viene "YYYY-MM-DD", JS lo interpreta como UTC o local según entorno,
  // pero para fechaNacimiento normalmente no importa la hora.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function main() {
  console.log("▶ Import JSON - inicio");

  const pacientes = readJson<any>("pacientes.json");
  const obras = readJson<any>("obras_sociales.json");
  const coseguros = readJson<any>("coseguros.json");
  const consultas = readJson<any>("consultas.json");

  // 1) Pacientes (upsert por DNI)
  console.log(`▶ Pacientes: ${pacientes.length}`);
  for (const p of pacientes) {
    const dni = normDni(p.dniPaciente);
    if (!dni) continue;

    await prisma.paciente.upsert({
      where: { dniPaciente: dni },
      update: {
        nombrePaciente: normStr(p.nombrePaciente),
        apellidoPaciente: normStr(p.apellidoPaciente),
        telefonoPaciente: p.telefonoPaciente ?? null,
        domicilioPaciente: p.domicilioPaciente ?? null,
        fechaNacimiento: toDateOrNull(p.fechaNacimiento),
        estadoPaciente: p.estadoPaciente ?? true,
      },
      create: {
        dniPaciente: dni,
        nombrePaciente: normStr(p.nombrePaciente),
        apellidoPaciente: normStr(p.apellidoPaciente),
        telefonoPaciente: p.telefonoPaciente ?? null,
        domicilioPaciente: p.domicilioPaciente ?? null,
        fechaNacimiento: toDateOrNull(p.fechaNacimiento),
        estadoPaciente: p.estadoPaciente ?? true,
      },
    });
  }

  // 2) Obras sociales (upsert por nombre)
  console.log(`▶ Obras sociales: ${obras.length}`);
  for (const o of obras) {
    const nombre = normStr(o.nombreObraSocial);
    if (!nombre) continue;

    await prisma.obraSocial.upsert({
      where: { nombreObraSocial: nombre },
      update: {
        estadoObraSocial: o.estadoObraSocial ?? true,
        admiteCoseguro: o.admiteCoseguro ?? false,
      },
      create: {
        nombreObraSocial: nombre,
        estadoObraSocial: o.estadoObraSocial ?? true,
        admiteCoseguro: o.admiteCoseguro ?? false,
      },
    });
  }

  // 3) Coseguros (upsert por nombre)
  console.log(`▶ Coseguros: ${coseguros.length}`);
  for (const c of coseguros) {
    const nombre = normStr(c.nombreCoseguro);
    if (!nombre) continue;

    await prisma.coseguro.upsert({
      where: { nombreCoseguro: nombre },
      update: {
        estadoCoseguro: c.estadoCoseguro ?? true,
      },
      create: {
        nombreCoseguro: nombre,
        estadoCoseguro: c.estadoCoseguro ?? true,
      },
    });
  }

  // Maps para resolver FK
  const pacientesDb = await prisma.paciente.findMany({
    select: { idPaciente: true, dniPaciente: true },
  });
  const obrasDb = await prisma.obraSocial.findMany({
    select: { idObraSocial: true, nombreObraSocial: true },
  });
  const cosegurosDb = await prisma.coseguro.findMany({
    select: { idCoseguro: true, nombreCoseguro: true },
  });

  const pacienteByDni = new Map(pacientesDb.map((x) => [x.dniPaciente, x.idPaciente]));
  const obraByNombre = new Map(obrasDb.map((x) => [x.nombreObraSocial, x.idObraSocial]));
  const coseguroByNombre = new Map(cosegurosDb.map((x) => [x.nombreCoseguro, x.idCoseguro]));

  // 4) Consultas
  console.log(`▶ Consultas: ${consultas.length}`);
  const BATCH = 200;

  for (let i = 0; i < consultas.length; i += BATCH) {
    const batch = consultas.slice(i, i + BATCH);

    await prisma.$transaction(
      batch.map((c) => {
        const dni = normDni(c.dniPaciente);
        const idPaciente = pacienteByDni.get(dni);
        if (!idPaciente) {
          throw new Error(`Consulta con dniPaciente inexistente: ${dni}`);
        }

        const obraNombre = c.nombreObraSocial ? normStr(c.nombreObraSocial) : "";
        const idObraSocial = obraNombre ? obraByNombre.get(obraNombre) : undefined;

        const coseguroNombre = c.nombreCoseguro ? normStr(c.nombreCoseguro) : "";
        const idCoseguro = coseguroNombre ? coseguroByNombre.get(coseguroNombre) : undefined;

        const fechaHoraConsulta = c.fechaHoraConsulta ? new Date(String(c.fechaHoraConsulta)) : undefined;

        return prisma.consultas.create({
          data: {
            idPaciente,
            idObraSocial: idObraSocial ?? null,
            idCoseguro: idCoseguro ?? null,

            motivoConsulta: normStr(c.motivoConsulta),
            diagnosticoConsulta: c.diagnosticoConsulta ?? null,
            tratamientoConsulta: c.tratamientoConsulta ?? null,
            estudiosComplementarios: c.estudiosComplementarios ?? null,

            nroAfiliado: c.nroAfiliado ?? null,
            tipoConsulta: normStr(c.tipoConsulta) || "PARTICULAR",
            tieneCoseguro: c.tieneCoseguro ?? null,
            montoConsulta: c.montoConsulta ?? null,

            ...(fechaHoraConsulta && !Number.isNaN(fechaHoraConsulta.getTime())
              ? { fechaHoraConsulta }
              : {}),
          },
        });
      })
    );

    console.log(`  - Consultas: ${Math.min(i + BATCH, consultas.length)}/${consultas.length}`);
  }

  console.log("✅ Import finalizado OK");
}

main()
  .catch((e) => {
    console.error("❌ Error importando:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
