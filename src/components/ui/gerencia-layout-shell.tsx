'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

import GerenciaSidebar from '@/components/ui/gerencia-sidebar'
import GerenciaTopbar from '@/components/ui/gerencia-topbar'
import type { UserWithRoles } from '@/lib/auth'

interface GerenciaLayoutShellProps {
  user: UserWithRoles
  children: React.ReactNode
}

export default function GerenciaLayoutShell({ user, children }: GerenciaLayoutShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!isMobileSidebarOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isMobileSidebarOpen])

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [pathname])

  const closeSidebar = () => setIsMobileSidebarOpen(false)
  const userRole = user.roles.includes('GERENTE') ? 'GERENTE' : user.roles[0]

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      {/* Sidebar escritorio */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <GerenciaSidebar userRole={userRole} />
      </div>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <GerenciaTopbar
          userName={user.name}
          userEmail={user.email}
          onMenuToggle={() => setIsMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>

      {/* Sidebar móvil */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ease-in-out lg:hidden ${
          isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isMobileSidebarOpen}
        onClick={closeSidebar}
      >
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[80%] overflow-y-auto bg-white shadow-lg transition-transform duration-200 ease-in-out ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Menú gerencia</p>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <GerenciaSidebar
            userRole={userRole}
            className="w-full"
            onNavigate={closeSidebar}
          />
        </div>
      </div>
    </div>
  )
}
