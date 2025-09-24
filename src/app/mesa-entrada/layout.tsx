import { redirect } from 'next/navigation'
import { getCurrentUser, roleToPath } from '@/lib/auth'
import MesaEntradaSidebar from '@/components/ui/mesa-entrada-sidebar'
import MesaEntradaTopbar from '@/components/ui/mesa-entrada-topbar'

export default async function MesaEntradaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'MESA_ENTRADA') redirect(roleToPath(user.role))

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <MesaEntradaSidebar userRole={user.role} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <MesaEntradaTopbar 
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