'use client'

import { usePathname } from 'next/navigation'
import { 
  Bell, 
  ChevronRight,
  LogOut,
  User,
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  userName: string | null
  userEmail: string
  onMenuToggle?: () => void
}

const pathTitles: Record<string, string> = {
  '/mesa-entrada': 'Dashboard',
  '/mesa-entrada/pacientes': 'Pacientes',
  '/mesa-entrada/turnos': 'Turnos',
  '/mesa-entrada/pagos': 'Pagos', 
  '/mesa-entrada/reportes': 'Reportes',
  '/mesa-entrada/configuracion': 'Configuración',
  '/mesa-entrada/perfil': 'Mi Perfil',
}

export default function MesaEntradaTopbar({ userName, userEmail, onMenuToggle }: TopbarProps) {
  const pathname = usePathname()
  const currentTitle = pathTitles[pathname] || 'Mesa de Entrada'

  const handlePerfilClick = () => {
    window.location.href = '/mesa-entrada/perfil'
  }



  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        window.location.href = '/login'
      } else {
        console.error('Error logout:', response.status)
        alert('Error al cerrar sesión')
      }
    } catch (error) {
      console.error('Error de red al cerrar sesión:', error)
      alert('Error de conexión')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumbs */}
        <div className="flex flex-1 items-center gap-3 text-sm text-gray-500 sm:flex-none">
          {onMenuToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center">
            <span>Mesa de Entrada</span>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-gray-900 font-medium">{currentTitle}</span>
          </div>
        </div>

        {/* Search and User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">


          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-gray-600 hover:text-gray-700">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
              2
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName || 'Mesa de Entrada'}
              </p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            
            <div className="group relative">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
              </Button>
              
              {/* Dropdown menu */}
              <div className="invisible absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <button 
                  onClick={handlePerfilClick}
                  className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </button>
                <button className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50">
                  <Bell className="h-4 w-4" />
                  <span>Configuración</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <Button 
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
