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
  console.log('🌱 Seed completed: users created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })