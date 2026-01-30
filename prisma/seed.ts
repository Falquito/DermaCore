// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/* ---------------- Helpers ---------------- */
function pad(num: number, size: number) {
  return num.toString().padStart(size, "0");
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

// random estable (reproducible)
let SEED = 1234567;
function rand() {
  // LCG
  SEED = (SEED * 48271) % 0x7fffffff;
  return SEED / 0x7fffffff;
}
function randomInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]) {
  return arr[randomInt(0, arr.length - 1)];
}
function randomTimeWithinDay(day: Date) {
  const d = new Date(day);
  d.setHours(randomInt(8, 19), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

/* ---------------- Seed ---------------- */
async function main() {
  // Limpieza (orden importante por FKs)
  await prisma.consultas.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.coseguro.deleteMany();
  await prisma.obraSocial.deleteMany();
  await prisma.user.deleteMany();

  // 0) Usuario Admin
  const hashedPassword = await bcrypt.hash("Hola1234!", 12);
  await prisma.user.create({
    data: {
      name: "USUARIO",
      email: "admin@derm.local",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("✓ Usuario admin creado: admin@derm.local");

  // 1) Obras Sociales
  const obrasSocialesData = [
    { nombreObraSocial: "OSDE" },
    { nombreObraSocial: "Swiss Medical" },
    { nombreObraSocial: "Galeno" },
    { nombreObraSocial: "Sancor Salud" },
    { nombreObraSocial: "IOMA" },
    { nombreObraSocial: "PAMI" },
  ];

  await prisma.obraSocial.createMany({
    data: obrasSocialesData,
    skipDuplicates: true,
  });

  const obrasSociales = await prisma.obraSocial.findMany({
    orderBy: { idObraSocial: "asc" },
  });

  // 2) Coseguros
  const cosegurosData = [
    { nombreCoseguro: "Mapfre Seguros" },
    { nombreCoseguro: "Zurich Seguros" },
    { nombreCoseguro: "La Segunda Seguros" },
    { nombreCoseguro: "Seguros Monterrey New York Life" },
    { nombreCoseguro: "AXA Seguros" },
    { nombreCoseguro: "Bupa Salud" },
    { nombreCoseguro: "Consolidar Seguros" },
    { nombreCoseguro: "Galeno Seguros" },
  ];

  await prisma.coseguro.createMany({
    data: cosegurosData,
    skipDuplicates: true,
  });

  const coseguros = await prisma.coseguro.findMany({
    orderBy: { idCoseguro: "asc" },
  });

  // Fechas base (dinámicas)
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);

  const prevMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStart = startOfMonth(prevMonthRef);
  const prevNextMonthStart = startOfNextMonth(prevMonthRef);

  const last30Start = startOfDay(addDays(now, -29));

  // 3) Pacientes (30) con fechas distribuidas + algunos inactivos
  const nombres: Array<[string, string]> = [
    ["Juan", "Pérez"],
    ["María", "Gómez"],
    ["Lucas", "Fernández"],
    ["Sofía", "López"],
    ["Mateo", "Rodríguez"],
    ["Valentina", "Martínez"],
    ["Benjamín", "Sánchez"],
    ["Camila", "Romero"],
    ["Thiago", "Díaz"],
    ["Martina", "Álvarez"],
    ["Joaquín", "Torres"],
    ["Lucía", "Ruiz"],
    ["Franco", "Herrera"],
    ["Agustina", "Castro"],
    ["Nicolás", "Vega"],
    ["Alejandro", "Silva"],
    ["Guadalupe", "Núñez"],
    ["Cristóbal", "Rojas"],
    ["Florencia", "Medina"],
    ["Javier", "Flores"],
    ["Daniela", "Córdoba"],
    ["Ricardo", "Acuña"],
    ["Paloma", "Salazar"],
    ["Tomás", "Bravo"],
    ["Natalia", "Vargas"],
    ["Felipe", "Cortés"],
    ["Isabel", "Miranda"],
    ["Andrés", "Parra"],
    ["Romina", "Campos"],
    ["Carlos", "Mendoza"],
  ];

  const baseDni = 35000000;

  // Queremos que no “calcen” perfecto: variamos un poco
  const nuevos30d = randomInt(12, 18);
  const inactivosCount = randomInt(5, 9);

  const pacientes: any[] = [];
  for (let i = 0; i < 30; i++) {
    const [nombrePaciente, apellidoPaciente] = nombres[i];
    const dniPaciente = String(baseDni + i);
    const telefonoPaciente = `351${pad(1000000 + i, 7)}`;
    const domicilioPaciente = `Calle ${i + 1} #${100 + i}`;

    // Fecha creación
    let fechaHoraPaciente: Date;
    if (i < nuevos30d) {
      // dentro de últimos 30 días
      const day = addDays(last30Start, randomInt(0, 29));
      fechaHoraPaciente = randomTimeWithinDay(day);
    } else {
      // más viejo: entre 31 y 240 días atrás (más variación)
      const day = startOfDay(addDays(now, -randomInt(31, 240)));
      fechaHoraPaciente = randomTimeWithinDay(day);
    }

    // Estado: algunos inactivos (por ejemplo los últimos)
    const estadoPaciente = i < 30 - inactivosCount;

    const p = await prisma.paciente.create({
      data: {
        nombrePaciente,
        apellidoPaciente,
        dniPaciente,
        telefonoPaciente,
        domicilioPaciente,
        estadoPaciente,
        fechaHoraPaciente,
      },
    });

    pacientes.push(p);
  }

  // sesgo realista: activos consultan más
  function pickPacienteConSesgo() {
    const activos = pacientes.filter((p) => p.estadoPaciente);
    if (activos.length === 0) return pick(pacientes);
    // 75% elige activos, 25% cualquiera
    return rand() < 0.75 ? pick(activos) : pick(pacientes);
  }

  // 4) Consultas: bloques
  const motivos = [
    "Control general",
    "Dermatitis",
    "Acné",
    "Alergia cutánea",
    "Chequeo anual",
    "Lesión sospechosa",
    "Seguimiento de tratamiento",
    "Manchas en piel",
    "Picazón",
    "Caída de cabello",
  ];

  const diagnosticos = [
    "Sin hallazgos relevantes",
    "Dermatitis atópica",
    "Acné moderado",
    "Reacción alérgica",
    "Apto control",
    "Lesión benigna probable",
    "Evolución favorable",
    "Hiperpigmentación",
    "Dermatitis de contacto",
    "Efluvio telógeno",
  ];

  const tratamientos = [
    "Hidratación y cuidado",
    "Corticoide tópico",
    "Retinoide tópico",
    "Antihistamínico",
    "Hábitos saludables",
    "Biopsia si persiste",
    "Continuar esquema",
    "Protector solar diario",
    "Evitar irritantes",
    "Vitaminas y control",
  ];

  const tiposConsulta = ["obra-social", "particular"] as const;

  // 4.1) Serie últimos 30 días (semanas buenas/malas + finde más bajo)
  for (let d = 0; d < 30; d++) {
    const day = addDays(last30Start, d);
    const weekday = day.getDay(); // 0 dom - 6 sáb

    let n = 0;

    if (weekday === 0) n = randomInt(0, 1); // domingo
    else if (weekday === 6) n = randomInt(0, 2); // sábado
    else {
      const roll = rand();
      if (roll < 0.18) n = 0;
      else if (roll < 0.48) n = 1;
      else if (roll < 0.76) n = 2;
      else if (roll < 0.92) n = 3;
      else n = 4;
    }

    for (let k = 0; k < n; k++) {
      const paciente = pickPacienteConSesgo();
      const tipo = pick([...tiposConsulta]);
      const obra = pick(obrasSociales);
      const cos = pick(coseguros);

      await prisma.consultas.create({
        data: {
          idPaciente: paciente.idPaciente,
          idObraSocial: tipo === "obra-social" ? obra.idObraSocial : null,
          idCoseguro:
            tipo === "obra-social" && rand() < 0.3 ? cos.idCoseguro : null,

          motivoConsulta: pick(motivos),
          diagnosticoConsulta: pick(diagnosticos),
          tratamientoConsulta: pick(tratamientos),

          nroAfiliado:
            tipo === "obra-social"
              ? `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}`
              : null,

          tipoConsulta: tipo,
          montoConsulta:
            tipo === "particular" ? 6000 + randomInt(0, 10) * 400 : null,

          fechaHoraConsulta: randomTimeWithinDay(day),
        },
      });
    }
  }

  // 4.2) Asegurar KPI mes actual (más alto, y NO “igual” a lo de últimos 30)
  const targetMesActual = randomInt(42, 68);

  const actualesYaCreadas = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: monthStart, lt: nextMonthStart } },
  });

  const faltanMesActual = Math.max(0, targetMesActual - actualesYaCreadas);

  for (let i = 0; i < faltanMesActual; i++) {
    const paciente = pickPacienteConSesgo();
    const tipo = pick([...tiposConsulta]);
    const obra = pick(obrasSociales);
    const cos = pick(coseguros);

    // fecha aleatoria dentro del mes actual (hasta hoy)
    const maxDayOffset = Math.max(
      0,
      Math.floor(
        (startOfDay(now).getTime() - monthStart.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const day = addDays(monthStart, randomInt(0, maxDayOffset));

    // para que no se “parezca” a la serie: metemos más controles en días hábiles
    const isWeekend = [0, 6].includes(day.getDay());
    if (isWeekend && rand() < 0.6) continue; // salteamos muchos findes

    await prisma.consultas.create({
      data: {
        idPaciente: paciente.idPaciente,
        idObraSocial: tipo === "obra-social" ? obra.idObraSocial : null,
        idCoseguro:
          tipo === "obra-social" && rand() < 0.22 ? cos.idCoseguro : null,

        motivoConsulta: pick(motivos),
        diagnosticoConsulta: pick(diagnosticos),
        tratamientoConsulta: pick(tratamientos),

        nroAfiliado:
          tipo === "obra-social"
            ? `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}`
            : null,

        tipoConsulta: tipo,
        montoConsulta:
          tipo === "particular" ? 6500 + randomInt(0, 12) * 350 : null,

        fechaHoraConsulta: randomTimeWithinDay(startOfDay(day)),
      },
    });
  }

  // 4.3) Mes anterior: más bajo para delta claro (y distinto)
  const targetMesAnterior = randomInt(14, 26);

  const anterioresYaCreadas = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: prevMonthStart, lt: prevNextMonthStart } },
  });

  const faltanMesAnterior = Math.max(0, targetMesAnterior - anterioresYaCreadas);

  for (let i = 0; i < faltanMesAnterior; i++) {
    const paciente = rand() < 0.55 ? pick(pacientes) : pickPacienteConSesgo(); // mezcla para no “clonar”
    const tipo = pick([...tiposConsulta]);
    const obra = pick(obrasSociales);
    const cos = pick(coseguros);

    // fecha aleatoria dentro del mes anterior
    const daysPrevMonth = Math.floor(
      (prevNextMonthStart.getTime() - prevMonthStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const day = addDays(prevMonthStart, randomInt(0, Math.max(0, daysPrevMonth - 1)));

    await prisma.consultas.create({
      data: {
        idPaciente: paciente.idPaciente,
        idObraSocial: tipo === "obra-social" ? obra.idObraSocial : null,
        idCoseguro:
          tipo === "obra-social" && rand() < 0.18 ? cos.idCoseguro : null,

        motivoConsulta: pick(motivos),
        diagnosticoConsulta: pick(diagnosticos),
        tratamientoConsulta: pick(tratamientos),

        nroAfiliado:
          tipo === "obra-social"
            ? `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}`
            : null,

        tipoConsulta: tipo,
        montoConsulta:
          tipo === "particular" ? 5800 + randomInt(0, 10) * 300 : null,

        fechaHoraConsulta: randomTimeWithinDay(startOfDay(day)),
      },
    });
  }

  // Resumen
  const countOS = await prisma.obraSocial.count();
  const countCos = await prisma.coseguro.count();
  const countPac = await prisma.paciente.count();
  const countCons = await prisma.consultas.count();

  const activos = await prisma.paciente.count({ where: { estadoPaciente: true } });
  const inactivos = await prisma.paciente.count({ where: { estadoPaciente: false } });

  const mesActual = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: monthStart, lt: nextMonthStart } },
  });
  const mesAnterior = await prisma.consultas.count({
    where: { fechaHoraConsulta: { gte: prevMonthStart, lt: prevNextMonthStart } },
  });

  const nuevos30 = await prisma.paciente.count({
    where: { fechaHoraPaciente: { gte: last30Start, lt: addDays(startOfDay(now), 1) } },
  });

  console.log("Seed OK ✅");
  console.log({
    obrasSociales: countOS,
    coseguros: countCos,
    pacientes: countPac,
    pacientesActivos: activos,
    pacientesInactivos: inactivos,
    consultas: countCons,
    consultasMesActual: mesActual,
    consultasMesAnterior: mesAnterior,
    pacientesNuevos30Dias: nuevos30,
  });
}

main()
  .catch((e) => {
    console.error("Seed error ❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
