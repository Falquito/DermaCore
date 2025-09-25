'use client'

import { usePathname } from 'next/navigation'
import { 
  Search, 
  Bell, 
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'

interface TopbarProps {
  userName: string | null
  userEmail: string
}

const pathTitles: Record<string, string> = {
  '/mesa-entrada': 'Pacientes',
  '/mesa-entrada/turnos': 'Turnos',
  '/mesa-entrada/pagos': 'Pagos', 
  '/mesa-entrada/reportes': 'Reportes',
  '/mesa-entrada/configuracion': 'Configuración',
}

export default function MesaEntradaTopbar({ userName, userEmail }: TopbarProps) {
  const pathname = usePathname()
  const currentTitle = pathTitles[pathname] || 'Mesa de Entrada'

  const handleLogout = () => {
    console.log('🔥 LOGOUT INICIADO')
    
    // Hacer petición de logout
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      console.log('📡 Respuesta logout:', response.status)
      if (response.ok) {
        console.log('✅ Logout exitoso - Redirigiendo...')
        // Redirigir a login
        window.location.href = '/login'
      } else {
        console.error('❌ Error logout:', response.status)
        alert('Error al cerrar sesión')
      }
    })
    .catch(error => {
      console.error('💥 Error de red:', error)
      alert('Error de conexión')
    })
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Mesa de Entrada</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{currentTitle}</span>
        </div>

        {/* Search and User Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-700 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              2
            </span>
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName || 'Mesa de Entrada'}
              </p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            
            <div className="relative group">
              <button className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
              </button>
              
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
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}