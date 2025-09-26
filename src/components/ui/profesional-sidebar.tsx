'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Calendar, 
  Users, 
  FileText, 
  Activity, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  UserCheck,
  Pill,
  ClipboardList,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProfesionalSidebarProps {
  userRole: string
}

const menuItems = [
  {
    title: 'Inicio',
    icon: Home,
    href: '/profesional',
    description: 'Página principal'
  },
  {
    title: 'Agenda',
    icon: Calendar,
    href: '/profesional/agenda',
    description: 'Gestionar agenda y turnos'
  },
  {
    title: 'Pacientes',
    icon: Users,
    href: '/profesional/pacientes',
    description: 'Historial de pacientes'
  },
  {
    title: 'Consultas',
    icon: UserCheck,
    href: '/profesional/consultas',
    description: 'Consultas del día'
  },
  {
    title: 'Historias Clínicas',
    icon: FileText,
    href: '/profesional/historias-clinicas',
    description: 'Historiales médicos'
  },
  {
    title: 'Prescripciones',
    icon: Pill,
    href: '/profesional/prescripciones',
    description: 'Recetas médicas'
  },
  {
    title: 'Estudios',
    icon: Activity,
    href: '/profesional/estudios',
    description: 'Órdenes de estudios'
  },
  {
    title: 'Reportes',
    icon: ClipboardList,
    href: '/profesional/reportes',
    description: 'Reportes médicos'
  },
  {
    title: 'Configuración',
    icon: Settings,
    href: '/profesional/configuracion',
    description: 'Configuración personal'
  }
]

export default function ProfesionalSidebar({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userRole
}: ProfesionalSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className={`
      bg-white border-r border-gray-200 
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-64'}
      flex flex-col min-h-screen
    `}>
      {/* Header */}
      <div className="p-2 border-b border-gray-200">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Image
                  src="/logo.png"
                  alt="CareLink Logo"
                  width={64}
                  height={64}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">CareLink</h2>
                <p className="text-xs text-emerald-600 font-medium">Profesional</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="p-1 hover:bg-gray-100 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="bg-emerald-100 p-1 rounded-lg">
                <Image
                  src="/logo.png"
                  alt="CareLink Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapse}
                className="p-1 hover:bg-gray-100 w-8 h-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 text-left
                  ${isActive
                    ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.title : ''}
              >
                <Icon className={`
                  ${isActive ? 'text-emerald-600' : 'text-gray-500'}
                  ${isCollapsed ? 'h-5 w-5' : 'h-5 w-5'}
                  flex-shrink-0
                `} />
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="bg-emerald-100 p-2 rounded-full">
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Dr. Profesional
              </p>
              <p className="text-xs text-gray-500">
                Médico General
              </p>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            Conectado
          </div>
        )}
      </div>
    </div>
  )
}