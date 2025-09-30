import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import PacientesContent from './PacientesContent'

export default async function PacientesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.roles.includes('PROFESIONAL')) redirect('/error')

  return (
    <div className="p-6">
      <PacientesContent />
    </div>
  );
}
