'use client'

import { usePathname } from 'next/navigation'
import { 
  Search, 
  Bell, 
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  userName: string | null
  userEmail: string
}

const pathTitles: Record<string, string> = {
  '/gerente': 'Inicio',
  '/gerente/usuarios': 'Usuarios',
  '/gerente/reportes': 'Reportes', 
  '/gerente/auditoria': 'Auditoría',
  '/gerente/organizacion': 'Organización',
  '/gerente/configuracion': 'Configuración',
}

export default function GerenciaTopbar({ userName, userEmail }: TopbarProps) {
  const pathname = usePathname()
  const currentTitle = pathTitles[pathname] || 'Gerencia'

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      console.log('Iniciando proceso de logout...')
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Respuesta del logout:', response.status)
      
      if (response.ok) {
        console.log('Logout exitoso, redirigiendo a login...')
        // Forzar redirección completa en lugar de usar router.push
        window.location.href = '/login'
      } else {
        console.error('Error al cerrar sesión:', response.status)
        alert('Error al cerrar sesión. Por favor, intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      alert('Error de conexión. Por favor, verifica tu conexión e intenta de nuevo.')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Gerencia</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{currentTitle}</span>
        </div>

        {/* Right section - Search, notifications, user */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm 
                focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                bg-gray-50 hover:bg-white transition-colors"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              2
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName || 'Administrador'}
              </p>
              <p className="text-xs text-gray-500">
                {userEmail}
              </p>
            </div>
            
            <div className="relative group">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
              </Button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Configuración</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}