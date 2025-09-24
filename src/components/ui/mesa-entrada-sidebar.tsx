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
  Stethoscope
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

export default function MesaEntradaSidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">CareLink</h2>
                <p className="text-xs text-gray-500">Mesa de Entrada</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>Rol: {userRole}</p>
          </div>
        </div>
      )}
    </aside>
  )
}