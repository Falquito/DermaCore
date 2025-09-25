'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  User,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  userRole: string
}

const sidebarItems = [
  { 
    id: 'pacientes', 
    name: 'Pacientes', 
    icon: Users, 
    href: '/mesa-entrada',
    description: 'Gestión de pacientes' 
  },
  { 
    id: 'turnos', 
    name: 'Turnos', 
    icon: Calendar, 
    href: '/mesa-entrada/turnos',
    description: 'Agenda y citas' 
  },
  { 
    id: 'pagos', 
    name: 'Pagos', 
    icon: CreditCard, 
    href: '/mesa-entrada/pagos',
    description: 'Facturación y pagos' 
  },
  { 
    id: 'reportes', 
    name: 'Reportes', 
    icon: BarChart3, 
    href: '/mesa-entrada/reportes',
    description: 'Estadísticas y reportes' 
  },
  { 
    id: 'configuracion', 
    name: 'Configuración', 
    icon: Settings, 
    href: '/mesa-entrada/configuracion',
    description: 'Configuración del sistema' 
  },
]

export default function MesaEntradaSidebar({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userRole 
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex flex-col min-h-screen transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">CareLink</h2>
                <p className="text-xs text-emerald-600 font-medium">Mesa de Entrada</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="bg-emerald-100 p-2 rounded-lg mx-auto">
              <Stethoscope className="h-6 w-6 text-emerald-600" />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 text-left
                  ${isActive
                    ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.name : ''}
              >
                <Icon className={`
                  ${isActive ? 'text-emerald-600' : 'text-gray-500'}
                  ${collapsed ? 'h-5 w-5' : 'h-5 w-5'}
                  flex-shrink-0
                `} />
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.description}
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="bg-emerald-100 p-2 rounded-full">
            <User className="h-4 w-4 text-emerald-600" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Recepcionista
              </p>
              <p className="text-xs text-gray-500">
                Mesa de Entrada
              </p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            Conectado
          </div>
        )}
      </div>
    </aside>
  )
}