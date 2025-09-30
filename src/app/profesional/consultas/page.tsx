import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import ConsultasContent from './ConsultasContent'

export default async function ConsultasPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.roles.includes('PROFESIONAL')) redirect('/error')

  return (
    <div className="p-6">
      <ConsultasContent />
    </div>
  );
  );
}

