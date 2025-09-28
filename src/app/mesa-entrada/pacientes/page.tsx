import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MesaEntradaContent from '../MesaEntradaContent'

export default async function PacientesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roles.length === 0) redirect('/error')
  if (!user.roles.includes('MESA_ENTRADA')) redirect('/error')

  // Cargar pacientes
  const patients = await prisma.patient.findMany({
    include: {
      creator: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [
      { apellido: 'asc' },
      { nombre: 'asc' }
    ]
  })

  return (
    <MesaEntradaContent 
      initialPatients={patients}
    />
  )
}