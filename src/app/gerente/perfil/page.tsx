'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Shield, 
  Calendar, 
  Mail, 
  Phone, 
  Clock,
  Crown,
  Key,
  Building2,
  Users,
  Activity,
  Edit,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import ProfileForm, { ProfileFormData } from '@/components/ProfileForm'
import type { User, Especialidad } from '@prisma/client'

type UserWithEspecialidad = User & { especialidad?: Especialidad | null }

export default function GerentePerfilPage() {
  const [user, setUser] = useState<UserWithEspecialidad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setError('Error al cargar los datos del perfil')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión al servidor')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUserData()
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
            <CardContent className="px-4 pb-6 sm:px-6">
              <div className="relative -mt-16 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:space-x-5">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Error al cargar el perfil
              </h2>
              <p className="text-red-700 mb-4">
                {error || 'No se pudieron cargar los datos del usuario'}
              </p>
              <Button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-red-600 hover:bg-red-700"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Reintentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const fullName = [user.name, user.apellido].filter(Boolean).join(' ').trim()
  const displayName = fullName || 'Usuario sin nombre'
  const initials = (fullName || user.email || 'GU')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const formatDate = (value: Date | string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Sin registro'
    return parsed.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const quickStats = [
    {
      icon: Calendar,
      label: 'Miembro desde',
      value: formatDate(user.createdAt),
      accent: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
      icon: Clock,
      label: 'Última actualización',
      value: formatDate(user.updatedAt),
      accent: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    {
      icon: Shield,
      label: 'Rol principal',
      value: 'Gerente General',
      accent: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    {
      icon: Activity,
      label: 'Estado',
      value: 'Activo',
      accent: 'bg-green-50 text-green-700 border-green-100'
    }
  ]

  const contactItems = [
    {
      icon: Mail,
      label: 'Email corporativo',
      value: user.email,
      accent: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    {
      icon: Phone,
      label: 'Teléfono',
      value: user.telefono || 'No especificado',
      accent: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    }
  ]

  const adminHighlights = [
    {
      icon: Crown,
      title: 'Dirección Ejecutiva',
      description: 'Supervisa áreas críticas, reportes y cumplimiento de objetivos organizacionales.',
      bg: 'bg-amber-50 text-amber-800 border border-amber-100'
    },
    {
      icon: Key,
      title: 'Permisos extendidos',
      description: 'Acceso completo a configuraciones, seguridad y asignación de roles en Carelink.',
      bg: 'bg-indigo-50 text-indigo-800 border border-indigo-100'
    },
    {
      icon: Users,
      title: 'Gestión de equipos',
      description: 'Coordina mesas de entrada, profesionales y auditorías para garantizar un servicio integral.',
      bg: 'bg-emerald-50 text-emerald-800 border border-emerald-100'
    }
  ]

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="relative">
            <div className="h-40 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute right-4 top-4 flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="secondary"
                size="sm"
                disabled={refreshing}
                className="bg-white/90 text-gray-700 hover:bg-white"
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <CardContent className="px-6 pb-6">
            <div className="-mt-20 flex flex-col gap-6 md:flex-row md:items-end">
              <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-xl ring-4 ring-white md:mx-0">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-200 text-3xl font-semibold text-amber-700">
                  {initials}
                </div>
                <Badge className="absolute -bottom-2 -right-2 flex items-center gap-1 border-green-200 bg-green-500 px-2 py-1 text-xs font-semibold text-white shadow-md">
                  <Crown className="h-3 w-3" />
                  Elite
                </Badge>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                      {displayName}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600 md:justify-start">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        Administración General de Carelink
                      </span>
                      <span className="hidden text-gray-400 md:block">•</span>
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        Acceso total
                      </span>
                    </div>
                  </div>
                  <Badge className="mx-auto w-fit bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/40 md:mx-0">
                    Rol: Gerente General
                  </Badge>
                </div>

                <p className="text-sm text-gray-500 md:max-w-2xl">
                  Lidera la estrategia operativa de la clínica y asegura la experiencia integrada en cada área.
                  Mantiene la trazabilidad de datos, la supervisión de equipos y la toma de decisiones clave.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map(({ icon: Icon, label, value, accent }) => (
                <div
                  key={label}
                  className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${accent}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border border-gray-100 shadow-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Información Personal
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Mantén tus datos institucionales al día para que los equipos puedan contactarte rápidamente.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <ProfileForm user={user} onSave={handleSave} showSpecialty={false} />
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Rol estratégico
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Visión general de tu alcance dentro del ecosistema Carelink.
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {adminHighlights.map(({ icon: Icon, title, description, bg }) => (
                  <div key={title} className={`rounded-xl p-4 text-sm shadow-sm ${bg}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {title}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-600">
                      {description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-gray-100 shadow-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Contacto directo
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Datos disponibles para los diferentes equipos operativos.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactItems.map(({ icon: Icon, label, value, accent }) => (
                  <div
                    key={label}
                    className={`rounded-xl border p-3 text-sm shadow-sm ${accent}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/60">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {label}
                        </p>
                        <p className="truncate text-sm font-medium text-gray-900" title={value}>
                          {value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Historial en Carelink
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Resumen cronológico de tu actividad dentro de la plataforma.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg bg-purple-50 p-3 text-sm text-purple-800">
                  <Clock className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Miembro desde</p>
                    <p className="text-xs text-purple-700">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <RefreshCw className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">Perfil actualizado</p>
                    <p className="text-xs text-gray-600">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
