'use client'

import { usePathname } from 'next/navigation'
import { 
  Bell, 
  ChevronRight,
  LogOut,
  User,
  Calendar,
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  userName: string | null
  userEmail: string
  onMenuToggle?: () => void
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
  '/profesional/configuracion': 'Configuración',
  '/profesional/perfil': 'Mi Perfil'
}

export default function ProfesionalTopbar({ userName, userEmail, onMenuToggle }: TopbarProps) {
  const pathname = usePathname()
  const currentTitle = pathTitles[pathname] || 'CareLink'

  const handlePerfilClick = () => {
    window.location.href = '/profesional/perfil'
  }



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
    <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left section - Breadcrumb y título */}
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
            <span>Profesional</span>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-gray-900 font-medium">{currentTitle}</span>
          </div>
        </div>

        {/* Right section - Search, notifications, user */}
        <div className="flex items-center gap-2 sm:gap-3">


          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName || 'Dr. Profesional'}
              </p>
              <p className="text-xs text-gray-500">
                {userEmail}
              </p>
            </div>
            
            <div className="relative group">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
              </Button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button 
                  onClick={handlePerfilClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
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
