import { PrismaClient, Role, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)
  const users: Array<{ email: string; name: string; role: Role; passwordHash: string }> = [
    { email: 'profesional@carelink.com', name: 'Dra. Ana', role: 'PROFESIONAL', passwordHash: password },
    { email: 'profesional2@carelink.com', name: 'Dr. Luis', role: 'PROFESIONAL', passwordHash: password },
    { email: 'mesa@carelink.com', name: 'Mesa Entrada', role: 'MESA_ENTRADA', passwordHash: password },
    { email: 'gerente@carelink.com', name: 'Gerente', role: 'GERENTE', passwordHash: password },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: u.passwordHash, role: u.role, name: u.name },
      create: { email: u.email, name: u.name, role: u.role, passwordHash: u.passwordHash },
    })
  }

  // Get professionals
  const prof1 = await prisma.user.findUnique({ where: { email: 'profesional@carelink.com' } })
  const prof2 = await prisma.user.findUnique({ where: { email: 'profesional2@carelink.com' } })
  const mesa = await prisma.user.findUnique({ where: { email: 'mesa@carelink.com' } })

  // Add two patients
  const patient1 = await prisma.patient.upsert({
    where: { dni: '12345678' },
    update: { nombre: 'Juan', apellido: 'Pérez', fechaNacimiento: new Date('1990-01-01'), genero: 'M', createdBy: mesa?.id ?? '' },
    create: {
      nombre: 'Juan', apellido: 'Pérez', dni: '12345678', fechaNacimiento: new Date('1990-01-01'), genero: 'M', createdBy: mesa?.id ?? ''
    }
  })
  const patient2 = await prisma.patient.upsert({
    where: { dni: '87654321' },
    update: { nombre: 'Maria', apellido: 'Gómez', fechaNacimiento: new Date('1985-05-15'), genero: 'F', createdBy: mesa?.id ?? '' },
    create: {
      nombre: 'Maria', apellido: 'Gómez', dni: '87654321', fechaNacimiento: new Date('1985-05-15'), genero: 'F', createdBy: mesa?.id ?? ''
    }
  })

  // Add appointments for both professionals
  const now = new Date()
  function addMinutes(date: Date, min: number) {
    return new Date(date.getTime() + min * 60000)
  }
  await prisma.appointment.createMany({
    data: [
      // Dra. Ana - 10 turnos en el mismo día
      ...Array.from({ length: 10 }).map((_, i) => ({
        fecha: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8 + i, 0, 0),
        duracion: 30,
        motivo: `Turno ${i + 1}`,
        observaciones: `Observación ${i + 1}`,
        estado: [
          AppointmentStatus.PROGRAMADO,
          AppointmentStatus.CONFIRMADO,
          AppointmentStatus.EN_SALA_DE_ESPERA,
          AppointmentStatus.COMPLETADO,
          AppointmentStatus.CANCELADO,
          AppointmentStatus.NO_ASISTIO,
          AppointmentStatus.PROGRAMADO,
          AppointmentStatus.CONFIRMADO,
          AppointmentStatus.COMPLETADO,
          AppointmentStatus.CANCELADO,
        ][i],
        pacienteId: i % 2 === 0 ? patient1.id : patient2.id,
        profesionalId: prof1?.id ?? '',
        createdBy: mesa?.id ?? ''
      })),
      // Dr. Luis (mantener los ejemplos previos)
      {
        fecha: addMinutes(now, 120),
        duracion: 30,
        motivo: 'Dolor de cabeza',
        observaciones: 'Posible migraña',
        estado: AppointmentStatus.EN_SALA_DE_ESPERA,
        pacienteId: patient1.id,
        profesionalId: prof2?.id ?? '',
        createdBy: mesa?.id ?? ''
      },
      {
        fecha: addMinutes(now, 240),
        duracion: 60,
        motivo: 'Chequeo anual',
        observaciones: 'Todo en orden',
        estado: AppointmentStatus.COMPLETADO,
        pacienteId: patient2.id,
        profesionalId: prof2?.id ?? '',
        createdBy: mesa?.id ?? ''
      },
      {
        fecha: addMinutes(now, 300),
        duracion: 30,
        motivo: 'Consulta cancelada',
        observaciones: 'Paciente avisó',
        estado: AppointmentStatus.CANCELADO,
        pacienteId: patient1.id,
        profesionalId: prof2?.id ?? '',
        createdBy: mesa?.id ?? ''
      },
      {
        fecha: addMinutes(now, 360),
        duracion: 30,
        motivo: 'No asistió',
        observaciones: 'Paciente no vino',
        estado: AppointmentStatus.NO_ASISTIO,
        pacienteId: patient2.id,
        profesionalId: prof2?.id ?? '',
        createdBy: mesa?.id ?? ''
      },
    ]
  })


  // Crear obras sociales argentinas más comunes
  const obrasSociales = [
    { nombre: 'OSDE', codigo: 'OSDE' },
    { nombre: 'Swiss Medical', codigo: 'SWISS' },
    { nombre: 'Galeno', codigo: 'GALENO' },
    { nombre: 'IOMA', codigo: 'IOMA' },
    { nombre: 'PAMI', codigo: 'PAMI' },
    { nombre: 'UOM', codigo: 'UOM' },
    { nombre: 'OSECAC', codigo: 'OSECAC' },
    { nombre: 'DOSAC', codigo: 'DOSAC' },
    { nombre: 'MEDICUS', codigo: 'MEDICUS' },
    { nombre: 'IPS', codigo: 'IPS' },
    { nombre: 'OSMATA', codigo: 'OSMATA' },
    { nombre: 'OSPRERA', codigo: 'OSPRERA' },
    { nombre: 'OSPLAD', codigo: 'OSPLAD' },
    { nombre: 'OSTUFF', codigo: 'OSTUFF' },
    { nombre: 'OSUTHGRA', codigo: 'OSUTHGRA' },
    { nombre: 'Particular', codigo: 'PARTICULAR' }
  ]

  for (const obra of obrasSociales) {
    await prisma.obraSocial.upsert({
      where: { codigo: obra.codigo },
      update: {},
      create: obra
    })
  }

  console.log('🌱 Seed completed: users and obras sociales created')

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })