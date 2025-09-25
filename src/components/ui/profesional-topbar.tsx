'use client'

import { usePathname } from 'next/navigation'
import { 
  Search, 
  Bell, 
  ChevronRight,
  LogOut,
  User,
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  userName: string | null
  userEmail: string
}

const pathTitles: Record<string, string> = {
  '/profesional': 'Dashboard',
  '/profesional/agenda': 'Agenda',
  '/profesional/pacientes': 'Pacientes',
  '/profesional/consultas': 'Consultas del Día',
  '/profesional/historias-clinicas': 'Historias Clínicas',
  '/profesional/prescripciones': 'Prescripciones',
  '/profesional/estudios': 'Estudios Médicos',
  '/profesional/reportes': 'Reportes',
  '/profesional/configuracion': 'Configuración'
}

export default function ProfesionalTopbar({ userName, userEmail }: TopbarProps) {
  const pathname = usePathname()
  const currentTitle = pathTitles[pathname] || 'CareLink'
  
  // Obtener fecha y hora actual
  const now = new Date()
  const currentDate = now.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const currentTime = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      window.location.href = '/login'
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section - Breadcrumb y título */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-500">
            <span>Profesional</span>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">{currentTitle}</span>
          </div>
        </div>

        {/* Center section - Fecha y hora */}
        <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span className="capitalize">{currentDate}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Right section - Search, notifications, user */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pacientes..."
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm 
                focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                bg-gray-50 hover:bg-white transition-colors"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName || 'Dr. Profesional'}
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
                  <Calendar className="h-4 w-4" />
                  <span>Mi Agenda</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
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