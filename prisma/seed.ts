import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)
  const users: Array<{ email: string; name: string; role: Role; passwordHash: string }> = [
    { email: 'profesional@carelink.com', name: 'Dra. Ana', role: 'PROFESIONAL', passwordHash: password },
    { email: 'mesa@carelink.com',        name: 'Mesa Entrada', role: 'MESA_ENTRADA', passwordHash: password },
    { email: 'gerente@carelink.com',     name: 'Gerente', role: 'GERENTE', passwordHash: password },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: u.passwordHash, role: u.role, name: u.name },
      create: { email: u.email, name: u.name, role: u.role, passwordHash: u.passwordHash },
    })
  }

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

  // ====== PACIENTE + TURNOS ======
  const profesional = await prisma.user.findUnique({ where: { email: 'profesional@carelink.com' } })
  const mesa        = await prisma.user.findUnique({ where: { email: 'mesa@carelink.com' } })
  if (!profesional || !mesa) throw new Error('Faltan usuarios profesional o mesa')

  // Patient según tu schema: dni, fechaNacimiento, genero y createdBy
  const patient = await prisma.patient.upsert({
    where: { dni: '12345678' }, // dni es unique en tu ruta
    update: {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
    },
    create: {
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      fechaNacimiento: new Date('1990-01-15'),
      genero: 'Masculino',
      email: 'juan@example.com',
      createdBy: mesa.id, // 👈 obligatorio según tu API
    },
  })

  const now = new Date()
  const today9  = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
  const today10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)
  const tomorrow930 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 30, 0)

  const appts = [
    { fecha: today9,      duracion: 30, motivo: 'Consulta inicial' },
    { fecha: today10,     duracion: 60, motivo: 'Controles' },
    { fecha: tomorrow930, duracion: 30, motivo: 'Seguimiento' },
  ]

  for (const a of appts) {
    await prisma.appointment.create({
      data: {
        fecha: a.fecha,
        duracion: a.duracion,
        motivo: a.motivo,
        observaciones: null,
        estado: 'PROGRAMADO',     // tu enum en DB
        pacienteId:  patient.id,  // 👈 relación OK
        profesionalId: profesional.id, // 👈 relación OK
        createdBy:    mesa.id,    // 👈 relación OK
      },
    })
  }

  console.log('🌱 Seed completo: pacientes y turnos de prueba creados')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
