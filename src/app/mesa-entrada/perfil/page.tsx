'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Mail, 
  Phone, 
  Clock,
  UserCheck,
  Settings,
  Headphones,
  Users
} from 'lucide-react'
import ProfileForm, { ProfileFormData } from '@/components/ProfileForm'
import type { User, Especialidad } from '@prisma/client'

type UserWithEspecialidad = User & { especialidad?: Especialidad | null }

export default function MesaEntradaPerfilPage() {
  const [user, setUser] = useState<UserWithEspecialidad | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        console.error('Error fetching user data')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: ProfileFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: unknown) {
      console.error('Error saving profile:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Error al cargar los datos del usuario</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header del perfil */}
        <div className="relative">
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <CardContent className="px-4 pb-6 sm:px-6">
              <div className="relative -mt-16 flex items-end space-x-5">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-white p-2 shadow-lg ring-4 ring-white">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                      <Headphones className="h-10 w-10 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {user.name} {user.apellido}
                      </h1>
                      <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <UserCheck className="h-4 w-4" />
                        Recepcionista
                      </p>
                    </div>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      Mesa de Entrada
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          {/* Sección 1: Información Personal (Editable) */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Settings className="h-5 w-5 text-gray-600" />
              Información Personal
            </h2>
            <ProfileForm 
              user={user} 
              onSave={handleSave}
              showSpecialty={false}
            />
          </div>

          {/* Sección 2: Información Operativa */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  Información Operativa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex items-start gap-3 py-2">
                    <UserCheck className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-sm text-gray-500">Rol</p>
                      <p className="text-base font-medium text-gray-900">
                        Mesa de Entrada
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <Headphones className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-sm text-gray-500">Área de trabajo</p>
                      <p className="text-base font-medium text-gray-900">
                        Atención al Paciente
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección 3: Información de Contacto */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-green-600" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex items-start gap-3 py-2">
                    <Mail className="mt-0.5 h-5 w-5 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-sm text-gray-500">Correo electrónico</p>
                      <p className="break-all text-base font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <Phone className="mt-0.5 h-5 w-5 text-green-600" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-sm text-gray-500">Teléfono</p>
                      <p className="text-base font-medium text-gray-900">
                        {user.telefono || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección 4: Información de Cuenta */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Información de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex items-start gap-3 py-2">
                    <Clock className="mt-0.5 h-5 w-5 text-purple-600" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-sm text-gray-500">Miembro desde</p>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <Calendar className="mt-0.5 h-5 w-5 text-purple-600" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-sm text-gray-500">Última actualización</p>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(user.updatedAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
