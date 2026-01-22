// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function pad(num: number, size: number) {
  return num.toString().padStart(size, "0");
}

async function main() {
  // Limpieza (orden importante por FKs)
  await prisma.consultas.deleteMany();
  await prisma.paciente.deleteMany();
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

  // 1) Obras Sociales (6)
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

  // 2) Pacientes (1000)
  const nombresBase: Array<[string, string]> = [
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
    ["Tomás", "Suárez"],
    ["Julieta", "Molina"],
    ["Ignacio", "Ramos"],
    ["Florencia", "Silva"],
    ["Gonzalo", "Navarro"],
    ["Catalina", "Ríos"],
    ["Federico", "Acosta"],
    ["Brenda", "Medina"],
    ["Ezequiel", "Ponce"],
    ["Milagros", "Cabrera"],
    ["Ramiro", "Paz"],
    ["Micaela", "Sosa"],
    ["Leandro", "Arias"],
    ["Carolina", "Peralta"],
    ["Alan", "Figueroa"],
  ];

  const totalPacientes = 1000;
  const baseDni = 35000000;

  const pacientesData = Array.from({ length: totalPacientes }).map((_, i) => {
    const [nombrePaciente, apellidoPaciente] =
      nombresBase[i % nombresBase.length];

    const dniPaciente = String(baseDni + i); // unique
    const telefonoPaciente = `351${pad(1000000 + i, 7)}`; // unique
    const domicilioPaciente = `Calle ${i + 1} #${100 + i}`;

    return {
      nombrePaciente,
      apellidoPaciente,
      dniPaciente,
      telefonoPaciente,
      domicilioPaciente,
      estadoPaciente: true,
    };
  });

  await prisma.paciente.createMany({
    data: pacientesData,
    skipDuplicates: true,
  });

  // Traemos IDs
  const pacientes = await prisma.paciente.findMany({
    orderBy: { idPaciente: "asc" },
  });

  // 3) Consultas: 100 por paciente
  const motivos = [
    "Control general",
    "Dolor de cabeza",
    "Dolor abdominal",
    "Chequeo anual",
    "Fiebre y malestar",
    "Dolor lumbar",
    "Consulta por alergia",
    "Gastritis",
    "Ansiedad / estrés",
    "Hipertensión",
    "Dolor de garganta",
    "Lesión deportiva",
    "Seguimiento de tratamiento",
    "Insomnio",
    "Revisión de estudios",
  ];

  const diagnosticos = [
    "Sin hallazgos relevantes",
    "Cefalea tensional",
    "Gastroenteritis leve",
    "Apto control",
    "Infección viral probable",
    "Lumbalgia mecánica",
    "Rinitis alérgica",
    "Dispepsia",
    "Estrés",
    "HTA en control",
    "Faringitis",
    "Esguince leve",
    "Evolución favorable",
    "Trastorno del sueño",
    "Se solicitan estudios",
  ];

  const tratamientos = [
    "Hidratación y descanso",
    "Analgésico si dolor",
    "Dieta liviana 48hs",
    "Hábitos saludables",
    "Antitérmico si fiebre",
    "Ejercicios y calor local",
    "Antihistamínico",
    "IBP por 14 días",
    "Técnicas de respiración",
    "Control y medicación habitual",
    "Gárgaras y antiinflamatorio",
    "Hielo, reposo y venda",
    "Continuar esquema",
    "Higiene del sueño",
    "Derivar según resultado",
  ];

  const tiposConsulta = ["Primera vez", "Control", "Urgencia", "Seguimiento"];

  const consultasPorPaciente = 100; // ✅ acá el cambio tranqui
  const BATCH_SIZE = 2000; // recomendado

  const now = Date.now();
  let buffer: any[] = [];
  let totalInsertadas = 0;

  console.log("⏳ Creando 100.000 consultas (en batches)...");

  for (let i = 0; i < pacientes.length; i++) {
    const paciente = pacientes[i];

    for (let j = 0; j < consultasPorPaciente; j++) {
      const obra = obrasSociales[(i + j) % obrasSociales.length];

      // Fecha: cada consulta 2 días hacia atrás (100 consultas = 200 días de historial)
      const fechaHoraConsulta = new Date(now - j * 2 * 24 * 60 * 60 * 1000);

      const idx = (i + j) % motivos.length;

      buffer.push({
        idPaciente: paciente.idPaciente,
        idObraSocial: obra.idObraSocial,
        fechaHoraConsulta,

        motivoConsulta: motivos[idx],
        diagnosticoConsulta: diagnosticos[idx],
        tratamientoConsulta: tratamientos[idx],

        nroAfiliado: `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}`,
        tipoConsulta: tiposConsulta[(i + j) % tiposConsulta.length],
        montoConsulta: 5000 + ((i + j) % 20) * 750,
      });

      if (buffer.length >= BATCH_SIZE) {
        await prisma.consultas.createMany({
          data: buffer,
          skipDuplicates: true,
        });
        totalInsertadas += buffer.length;
        buffer = [];

        if (totalInsertadas % 20000 === 0) {
          console.log(`… ${totalInsertadas.toLocaleString("es-AR")} insertadas`);
        }
      }
    }
  }

  // flush final
  if (buffer.length > 0) {
    await prisma.consultas.createMany({
      data: buffer,
      skipDuplicates: true,
    });
    totalInsertadas += buffer.length;
  }

  const countOS = await prisma.obraSocial.count();
  const countPac = await prisma.paciente.count();
  const countCons = await prisma.consultas.count();

  console.log("Seed OK ✅");
  console.log({
    obrasSociales: countOS,
    pacientes: countPac,
    consultas: countCons,
    consultasInsertadas: totalInsertadas,
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
