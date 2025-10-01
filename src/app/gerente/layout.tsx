import { redirect } from 'next/navigation'
import { getCurrentUser, userHasRole } from '@/lib/auth'
import GerenciaLayoutShell from '@/components/ui/gerencia-layout-shell'

export default async function GerenteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roles.length === 0) {
    redirect('/error')
  }
  if (!userHasRole(user.roles, 'GERENTE')) redirect('/error')

  return (
    <GerenciaLayoutShell user={user}>
      {children}
    </GerenciaLayoutShell>
  )
}
