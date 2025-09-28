import { redirect } from 'next/navigation'
import { getCurrentUser, userHasRole } from '@/lib/auth'
import ProfesionalSidebar from '@/components/ui/profesional-sidebar'
import ProfesionalTopbar from '@/components/ui/profesional-topbar'

export default async function ProfesionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.roles.length === 0) {
    redirect('/error')
  }
  if (!userHasRole(user.roles, 'PROFESIONAL')) redirect('/error')

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ProfesionalSidebar userRole={user.roles.includes('PROFESIONAL') ? 'PROFESIONAL' : user.roles[0]} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <ProfesionalTopbar 
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