import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)
  const users: Array<{ email: string; name: string; role: Role; passwordHash: string }> = [
    { email: 'profesional@carelink.com', name: 'Dra. Ana', role: 'PROFESIONAL', passwordHash: password },
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