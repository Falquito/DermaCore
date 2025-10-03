import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import HistoriasClinicasContent from './HistoriasClinicasContent'

export default async function HistoriasClinicasPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.roles.includes('PROFESIONAL')) redirect('/error')

  return (
    <main className="w-full px-6 py-6 lg:px-10">
      <HistoriasClinicasContent />
    </main>
  )
}
