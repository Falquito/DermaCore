import { redirect } from 'next/navigation'
import { getCurrentUser, userHasRole } from '@/lib/auth'
import GerenciaSidebar from '@/components/ui/gerencia-sidebar'
import GerenciaTopbar from '@/components/ui/gerencia-topbar'

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <GerenciaSidebar userRole={user.roles.includes('GERENTE') ? 'GERENTE' : user.roles[0]} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <GerenciaTopbar 
          userName={user.name}
          userEmail={user.email}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}