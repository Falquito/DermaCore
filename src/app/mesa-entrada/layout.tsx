import { redirect } from 'next/navigation'
import { getCurrentUser, userHasRole } from '@/lib/auth'
import MesaEntradaLayoutShell from '@/components/ui/mesa-entrada-layout-shell'

export default async function MesaEntradaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roles.length === 0) {
    redirect('/error')
  }
  if (!userHasRole(user.roles, 'MESA_ENTRADA')) redirect('/error')

  return (
    <MesaEntradaLayoutShell user={user}>
      {children}
    </MesaEntradaLayoutShell>
  )
}
