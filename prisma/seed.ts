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

  // 2) Pacientes (30)
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

  const pacientes = [];
  for (let i = 0; i < 30; i++) {
    const [nombrePaciente, apellidoPaciente] = nombres[i];
    const dniPaciente = String(baseDni + i); // unique
    const telefonoPaciente = `351${pad(1000000 + i, 7)}`;
    const domicilioPaciente = `Calle ${i + 1} #${100 + i}`;

    const p = await prisma.paciente.create({
      data: {
        nombrePaciente,
        apellidoPaciente,
        dniPaciente,
        telefonoPaciente,
        domicilioPaciente,
        estadoPaciente: true,
      },
    });

    pacientes.push(p);
  }

  // 3) Consultas (15): 1 por paciente y 1 obra social
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

  const tiposConsulta = ["obra-social", "particular"];

  for (let i = 0; i < pacientes.length; i++) {
    const paciente = pacientes[i];
    const tipoConsulta = tiposConsulta[i % tiposConsulta.length];
    const obra = obrasSociales[i % obrasSociales.length];

    await prisma.consultas.create({
      data: {
        idPaciente: paciente.idPaciente,
        idObraSocial: tipoConsulta === "obra-social" ? obra.idObraSocial : null,

        motivoConsulta: motivos[i % motivos.length],
        diagnosticoConsulta: diagnosticos[i % diagnosticos.length],
        tratamientoConsulta: tratamientos[i % tratamientos.length],

        // Campos extra del schema actual
        nroAfiliado: tipoConsulta === "obra-social" ? `AF-${obra.idObraSocial}-${pad(paciente.idPaciente, 4)}` : null,
        tipoConsulta: tipoConsulta,
        montoConsulta: tipoConsulta === "particular" ? 5000 + i * 750 : null,
      },
    });
  }

  // Crear consultas adicionales para el paciente 14 - últimas 6 meses desde junio 2025
  const paciente14 = pacientes[13]; // Agustina Castro, índice 13

  const fechasAnteriores = [
    new Date("2025-06-15T10:30:00Z"), // 15 junio 2025 - última consulta
    new Date("2025-06-01T14:00:00Z"), // 1 junio 2025
    new Date("2025-05-20T09:15:00Z"), // 20 mayo 2025
    new Date("2025-05-05T16:45:00Z"), // 5 mayo 2025
    new Date("2025-04-25T11:20:00Z"), // 25 abril 2025
    new Date("2025-04-10T13:30:00Z"), // 10 abril 2025
    new Date("2025-03-30T10:00:00Z"), // 30 marzo 2025
    new Date("2025-03-15T15:10:00Z"), // 15 marzo 2025
  ];

  const motivosExtras = [
    "Control de presión arterial",
    "Revisión de laboratorio",
    "Dolor en la zona lumbar",
    "Consulta por alergia estacional",
    "Seguimiento de medicación",
    "Dolor de cabeza recurrente",
    "Chequeo preventivo",
    "Control de colesterol",
  ];

  const diagnosticosExtras = [
    "Hipertensión controlada",
    "Resultados normales",
    "Lumbalgia mecánica",
    "Alergia estacional confirmada",
    "Situación estable",
    "Cefalea tensional",
    "Sin hallazgos",
    "Dislipidemia leve",
  ];

  const tratamientosExtras = [
    "Continuar medicación",
    "Próximo control en 3 meses",
    "Ejercicios y reposo",
    "Antihistamínico según síntomas",
    "Monitoreo de presión",
    "Analgésico si es necesario",
    "Revisión anual",
    "Dieta balanceada y ejercicio",
  ];

  // Crear consultas adicionales para el paciente 14
  for (let i = 0; i < fechasAnteriores.length; i++) {
    const obra = obrasSociales[i % obrasSociales.length];
    const fecha = fechasAnteriores[i];
    const tipoConsulta = i % 2 === 0 ? "obra-social" : "particular";

    await prisma.consultas.create({
      data: {
        idPaciente: paciente14.idPaciente,
        idObraSocial: tipoConsulta === "obra-social" ? obra.idObraSocial : null,
        fechaHoraConsulta: fecha,

        motivoConsulta: motivosExtras[i],
        diagnosticoConsulta: diagnosticosExtras[i],
        tratamientoConsulta: tratamientosExtras[i],

        nroAfiliado: tipoConsulta === "obra-social" ? `AF-${obra.idObraSocial}-${pad(paciente14.idPaciente, 4)}` : null,
        tipoConsulta: tipoConsulta,
        montoConsulta: tipoConsulta === "particular" ? 6000 + i * 500 : null,
      },
    });
  }

  // Agregar 50 consultas para el paciente 30 (índice 29) - dentro de los últimos 6 meses
  const paciente30 = pacientes[29]; // Carlos Mendoza, índice 29

  // Generar 50 fechas dentro de los últimos 6 meses
  const hoy = new Date("2026-01-21");
  const hace6Meses = new Date(hoy);
  hace6Meses.setMonth(hace6Meses.getMonth() - 6);

  const fechas50Consultas: Date[] = [];
  for (let i = 0; i < 50; i++) {
    const fecha = new Date(hace6Meses);
    const diasTotales = Math.floor(
      (hoy.getTime() - hace6Meses.getTime()) / (1000 * 60 * 60 * 24)
    );
    const diasAvance = Math.floor((diasTotales * (i + 1)) / 50);
    fecha.setDate(fecha.getDate() + diasAvance);
    fecha.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
    fechas50Consultas.push(fecha);
  }

  const motivos50 = [
    "Control de presión arterial",
    "Revisión de laboratorio",
    "Dolor en la zona lumbar",
    "Consulta por alergia estacional",
    "Seguimiento de medicación",
    "Dolor de cabeza recurrente",
    "Chequeo preventivo",
    "Control de colesterol",
    "Dolor articular",
    "Consulta dermatológica",
    "Control de glucosa",
    "Revisión ocular",
    "Dolor muscular",
    "Consulta preventiva",
    "Seguimiento post-tratamiento",
    "Consulta por ansiedad",
    "Control de peso",
    "Revisión de medicamentos",
    "Consulta por insomnio",
    "Control cardiovascular",
    "Dolor abdominal",
    "Consulta digestiva",
    "Revisión dermatológica",
    "Control metabólico",
    "Consulta por fatiga",
    "Dolor cervical",
    "Revisión preventiva",
    "Seguimiento de terapia",
    "Consulta por mareos",
    "Control integral",
    "Dolor de espalda",
    "Consulta reumatológica",
    "Revisión endocrina",
    "Seguimiento post-operatorio",
    "Consulta psicológica",
    "Control nutricional",
    "Dolor articular persistente",
    "Revisión audiológica",
    "Consulta neurológica",
    "Control hormonal",
    "Dolor radicular",
    "Revisión oftalmológica",
    "Consulta alergológica",
    "Control respiratorio",
    "Dolor torácico",
    "Revisión gastroenterológica",
    "Seguimiento farmacológico",
    "Consulta oncológica",
    "Control metabólico integral",
    "Revisión neumológica",
  ];

  const diagnosticos50 = [
    "Hipertensión controlada",
    "Resultados normales",
    "Lumbalgia mecánica",
    "Alergia estacional confirmada",
    "Situación estable",
    "Cefalea tensional",
    "Sin hallazgos",
    "Dislipidemia leve",
    "Artralgia generalizada",
    "Dermatitis crónica",
    "Diabetes tipo 2 en control",
    "Miopía estable",
    "Mialgias difusas",
    "Estado preventivo",
    "Cicatrización adecuada",
    "Estrés y ansiedad",
    "Sobrepeso moderado",
    "Polimedicación en control",
    "Insomnio crónico",
    "Cardiopatía isquémica estable",
    "Gastritis crónica",
    "Síndrome del intestino irritable",
    "Eccema atópico",
    "Síndrome metabólico",
    "Astenia persistente",
    "Cervicalgia crónica",
    "Revisión preventiva sin hallazgos",
    "Depresión en tratamiento",
    "Mareos posicionales benignos",
    "Síndrome plurimetabólico",
    "Hernia discal lumbar",
    "Artritis reumatoide en control",
    "Hipotiroidismo compensado",
    "Cicatrización postquirúrgica normal",
    "Depresión leve",
    "Desnutrición leve",
    "Artrosis cervical",
    "Hipoacusia bilateral leve",
    "Migraña crónica",
    "Dismenorrea primaria",
    "Neuralgia cervical",
    "Presbicia y astigmatismo",
    "Rinitis alérgica",
    "Asma alérgica controlada",
    "Dolor precordial atípico",
    "Colitis crónica",
    "Neuropatía periférica leve",
    "Sin hallazgos oncológicos",
    "Síndrome X metabólico",
    "EPOC leve",
  ];

  const tratamientos50 = [
    "Continuar medicación",
    "Próximo control en 3 meses",
    "Ejercicios y reposo",
    "Antihistamínico según síntomas",
    "Monitoreo de presión",
    "Analgésico si es necesario",
    "Revisión anual",
    "Dieta balanceada y ejercicio",
    "Fisioterapia recomendada",
    "Protector solar y emolientes",
    "Insulina y dieta",
    "Gafas de corrección",
    "Masajes y relajación",
    "Mantener estilos de vida saludable",
    "Curas periódicas",
    "Psicoterapia",
    "Dieta hipocalórica",
    "Revisión farmacéutica",
    "Higiene del sueño",
    "Medicación cardiaca habitual",
    "IBP e IBP",
    "Dieta baja en FODMAP",
    "Cremas dermatológicas",
    "Cambios en estilo de vida",
    "Estimulantes y antidepresivos",
    "Collar cervical",
    "Continuar controles",
    "ISRS continuos",
    "Maniobra de Dix-Hallpike",
    "Medicación integral",
    "Descompresión y analgesia",
    "Metotrexato y NSAIDs",
    "Levotiroxina",
    "Apósitos especializados",
    "ISRS y psicoterapia",
    "Suplementación nutricional",
    "Infiltraciones de ácido hialurónico",
    "Audífonos recomendados",
    "Triptanos y profilaxis",
    "NSAIDs y reposo",
    "Pregabalina",
    "Gafas progresivas",
    "Descongestivos nasales",
    "Broncodilatadores",
    "Seguimiento ECG",
    "Mesalazina",
    "Gabapentina",
    "Seguimiento oncológico",
    "Estatinas y dieta",
    "Broncodilatadores de larga acción",
  ];

  // Crear 50 consultas para el paciente 30
  for (let i = 0; i < 50; i++) {
    const obra = obrasSociales[i % obrasSociales.length];
    const fecha = fechas50Consultas[i];
    const tipoConsulta = i % 2 === 0 ? "obra-social" : "particular";

    await prisma.consultas.create({
      data: {
        idPaciente: paciente30.idPaciente,
        idObraSocial: tipoConsulta === "obra-social" ? obra.idObraSocial : null,
        fechaHoraConsulta: fecha,

        motivoConsulta: motivos50[i],
        diagnosticoConsulta: diagnosticos50[i],
        tratamientoConsulta: tratamientos50[i],

        nroAfiliado: tipoConsulta === "obra-social" ? `AF-${obra.idObraSocial}-${pad(paciente30.idPaciente, 4)}` : null,
        tipoConsulta: tipoConsulta,
        montoConsulta: tipoConsulta === "particular" ? 5000 + (i % 10) * 1000 : null,
      },
    });
  }

  const countOS = await prisma.obraSocial.count();
  const countPac = await prisma.paciente.count();
  const countCons = await prisma.consultas.count();

  console.log("Seed OK ✅");
  console.log({
    obrasSociales: countOS,
    pacientes: countPac,
    consultas: countCons,
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
