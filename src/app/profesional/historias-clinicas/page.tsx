import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import HistoriasClinicasContent from './HistoriasClinicasContent'

export default async function HistoriasClinicasPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.roles.includes('PROFESIONAL')) redirect('/error')

  return (
    <div className="p-6">
      <HistoriasClinicasContent />
    </div>
  );
}
