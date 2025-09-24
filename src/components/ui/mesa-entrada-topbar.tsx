'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Search, 
  Bell, 
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const router = useRouter()
  const currentTitle = pathTitles[pathname] || 'Mesa de Entrada'

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
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

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar..."
              className="pl-10 w-64"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>

            {/* Logout Button */}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}