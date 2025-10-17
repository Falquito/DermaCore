'use client'

import { Fragment, useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { 
  Users, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Plus, 
  Filter, 
  Loader2,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TooltipItem } from 'chart.js'

/* ========= Tipos ========= */
interface EdadDistribucionData {
  rango: string
  total: number
  minEdad: number
  maxEdad: number
}

interface FrecuenciaVisitasData {
  rango: string
  total: number
  minVisitas: number
  maxVisitas: number
}

interface GeneroEdadData {
  genero: 'M' | 'F' | 'Otro'
  rango: string
  total: number
}

interface GeografiaData {
  ciudad: string
  total: number
}

interface PacienteData {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: Date
  genero: 'M' | 'F' | 'Otro'
  ciudad?: string
  totalVisitas: number
}

interface MisPacientesTabProps {
  professionalId: string
  dateFrom: string
  dateTo: string
}

const generateColors = (count: number, baseHue = 160): string[] => {
  const colors = []
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360 / count)) % 360
    const saturation = 70 + (i % 3) * 10
    const lightness = 50 + (i % 2) * 10
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
  }
  return colors
}

// Componente para rangos etarios editables
const RangeEditor = ({ 
  ranges, 
  onRangesChange, 
  onClose, 
  title = "Editar Rangos"
}: {
  ranges: Array<{ min: number; max: number }>
  onRangesChange: (ranges: Array<{ min: number; max: number }>) => void
  onClose: () => void
  title?: string
}) => {
  const [localRanges, setLocalRanges] = useState(ranges)

  const updateRange = (index: number, field: 'min' | 'max', value: number) => {
    const newRanges = [...localRanges]
    newRanges[index][field] = value
    setLocalRanges(newRanges)
  }

  const addRange = () => {
    const lastMax = localRanges.length > 0 ? Math.max(...localRanges.map(r => r.max)) : 0
    setLocalRanges([...localRanges, { min: lastMax + 1, max: lastMax + 10 }])
  }

  const removeRange = (index: number) => {
    if (localRanges.length > 1) {
      setLocalRanges(localRanges.filter((_, i) => i !== index))
    }
  }

  const handleSave = () => {
    onRangesChange(localRanges.sort((a, b) => a.min - b.min))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {localRanges.map((range, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="number"
                value={range.min}
                onChange={(e) => updateRange(index, 'min', parseInt(e.target.value) || 0)}
                className="w-20"
                min="0"
              />
              <span>-</span>
              <Input
                type="number"
                value={range.max}
                onChange={(e) => updateRange(index, 'max', parseInt(e.target.value) || 0)}
                className="w-20"
                min="0"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeRange(index)}
                disabled={localRanges.length <= 1}
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={addRange} className="flex-1">
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MisPacientesTab({ professionalId, dateFrom, dateTo }: MisPacientesTabProps) {
  // Estados para datos
  const [loading, setLoading] = useState(true)
  const [pacientes, setPacientes] = useState<PacienteData[]>([])
  
  // Estados para configuración de rangos
  const [edadRanges, setEdadRanges] = useState([
    { min: 0, max: 18 },
    { min: 19, max: 30 },
    { min: 31, max: 50 },
    { min: 51, max: 70 },
    { min: 71, max: 100 }
  ])
  
  const [visitasRanges, setVisitasRanges] = useState([
    { min: 1, max: 2 },
    { min: 3, max: 5 },
    { min: 6, max: 10 },
    { min: 11, max: 100 }
  ])

  // Estados para filtros
  const [generoFilter, setGeneroFilter] = useState<string>('todos')
  const [maxCiudades, setMaxCiudades] = useState(10)
  
  // Estados para editores
  const [showEdadEditor, setShowEdadEditor] = useState(false)
  const [showVisitasEditor, setShowVisitasEditor] = useState(false)

  // Función para calcular edad
  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Cargar datos de pacientes
  useEffect(() => {
    const fetchPacientes = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/professional/patients/stats?professionalId=${professionalId}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
        if (response.ok) {
          const data = await response.json()
          console.log('📊 MisPacientesTab - Datos recibidos:', {
            dateFrom,
            dateTo,
            totalPacientes: data.pacientes?.length || 0,
            pacientes: data.pacientes
          })
          setPacientes(data.pacientes || [])
        }
      } catch (error) {
        console.error('Error fetching patient stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (professionalId && dateFrom && dateTo) {
      fetchPacientes()
    }
  }, [professionalId, dateFrom, dateTo])

  // Procesamiento de datos para distribución etaria
  const edadDistribucionData: EdadDistribucionData[] = edadRanges.map(range => {
    const count = pacientes.filter(p => {
      const edad = calculateAge(new Date(p.fechaNacimiento))
      return edad >= range.min && edad <= range.max
    }).length
    
    return {
      rango: `${range.min}-${range.max}`,
      total: count,
      minEdad: range.min,
      maxEdad: range.max
    }
  })

  // Debug log
  console.log('📊 MisPacientesTab - Distribución por edad calculada:', {
    dateFrom,
    dateTo,
    totalPacientes: pacientes.length,
    edadDistribucionData
  })

  // Procesamiento de datos para frecuencia de visitas
  const frecuenciaVisitasData: FrecuenciaVisitasData[] = visitasRanges.map(range => {
    const count = pacientes.filter(p => 
      p.totalVisitas >= range.min && p.totalVisitas <= range.max
    ).length
    
    return {
      rango: `${range.min}-${range.max}`,
      total: count,
      minVisitas: range.min,
      maxVisitas: range.max
    }
  })

  // Procesamiento de datos para distribución por género y edad
  const generoEdadData: GeneroEdadData[] = []
  const generos: Array<'M' | 'F' | 'Otro'> = ['M', 'F', 'Otro']
  
  generos.forEach(genero => {
    const pacientesFiltrados = pacientes.filter(p => 
      generoFilter === 'todos' || p.genero === generoFilter
    )
    
    edadRanges.forEach(range => {
      const count = pacientesFiltrados.filter(p => {
        const edad = calculateAge(new Date(p.fechaNacimiento))
        return p.genero === genero && edad >= range.min && edad <= range.max
      }).length
      
      if (count > 0) {
        generoEdadData.push({
          genero,
          rango: `${range.min}-${range.max}`,
          total: count
        })
      }
    })
  })

  // Procesamiento de datos para distribución geográfica
  const geografiaData: GeografiaData[] = pacientes
    .filter(p => p.ciudad)
    .reduce((acc, p) => {
      const ciudad = p.ciudad!
      const existing = acc.find(item => item.ciudad === ciudad)
      if (existing) {
        existing.total++
      } else {
        acc.push({ ciudad, total: 1 })
      }
      return acc
    }, [] as GeografiaData[])
    .sort((a, b) => b.total - a.total)
    .slice(0, maxCiudades)

  // Configuración de gráficos
  const edadChartData = {
    labels: edadDistribucionData.map(d => d.rango),
    datasets: [{
      label: 'Pacientes',
      data: edadDistribucionData.map(d => d.total),
      backgroundColor: generateColors(edadDistribucionData.length, 160),
      borderWidth: 0,
      borderRadius: 8,
    }]
  }

  const visitasChartData = {
    labels: frecuenciaVisitasData.map(d => `${d.rango} visitas`),
    datasets: [{
      label: 'Pacientes',
      data: frecuenciaVisitasData.map(d => d.total),
      backgroundColor: generateColors(frecuenciaVisitasData.length, 200),
      borderWidth: 0,
      borderRadius: 8,
    }]
  }

  const generoChartData = {
    labels: [...new Set(generoEdadData.map(d => d.rango))],
    datasets: generos.map((genero, index) => ({
      label: genero === 'M' ? 'Masculino' : genero === 'F' ? 'Femenino' : 'Otro',
      data: [...new Set(generoEdadData.map(d => d.rango))].map(rango => {
        const item = generoEdadData.find(d => d.genero === genero && d.rango === rango)
        return item ? item.total : 0
      }),
      backgroundColor: generateColors(3, 240)[index],
      borderWidth: 0,
      borderRadius: 4,
    }))
  }

  const geografiaChartData = {
    labels: geografiaData.map(d => d.ciudad),
    datasets: [{
      label: 'Pacientes por ciudad',
      data: geografiaData.map(d => d.total),
      backgroundColor: generateColors(geografiaData.length, 280),
      borderWidth: 0,
      borderRadius: 8,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { 
          usePointStyle: true, 
          pointStyle: 'circle',
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            return `${ctx.dataset.label}: ${ctx.raw} pacientes`
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 1 }
      }
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white/70 backdrop-blur-sm p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-gray-600">Cargando indicadores de pacientes...</span>
        </div>
      </div>
    )
  }

  return (
    <Fragment>
      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pacientes</p>
              <p className="text-xl font-semibold text-gray-900">{pacientes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Promedio Visitas</p>
              <p className="text-xl font-semibold text-gray-900">
                {pacientes.length > 0 ? (pacientes.reduce((acc, p) => acc + p.totalVisitas, 0) / pacientes.length).toFixed(1) : '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Edad Promedio</p>
              <p className="text-xl font-semibold text-gray-900">
                {pacientes.length > 0 ? Math.round(pacientes.reduce((acc, p) => acc + calculateAge(new Date(p.fechaNacimiento)), 0) / pacientes.length) : '0'} años
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ciudades</p>
              <p className="text-xl font-semibold text-gray-900">{geografiaData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 1. Distribución de Edades */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Distribución por Edad</h2>
              <p className="text-sm text-gray-500">Análisis de rangos etarios de pacientes</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEdadEditor(true)}>
              <Settings className="h-4 w-4 mr-1" /> Editar rangos
            </Button>
          </div>
          
          {edadDistribucionData.some(d => d.total > 0) ? (
            <div className="h-80">
              <Bar 
                key={`edad-chart-${dateFrom}-${dateTo}-${edadDistribucionData.map(d => d.total).join('-')}`}
                data={edadChartData} 
                options={chartOptions} 
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              No hay datos para mostrar
            </div>
          )}
        </div>

        {/* 2. Frecuencia de Visitas */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Frecuencia de Visitas</h2>
              <p className="text-sm text-gray-500">Pacientes por número de consultas</p>
            </div>
            <div className="flex gap-2">
              <Select value={generoFilter} onValueChange={setGeneroFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setShowVisitasEditor(true)}>
                <Settings className="h-4 w-4 mr-1" /> Editar
              </Button>
            </div>
          </div>
          
          {frecuenciaVisitasData.some(d => d.total > 0) ? (
            <div className="h-80">
              <Bar 
                key={`visitas-chart-${dateFrom}-${dateTo}-${frecuenciaVisitasData.map(d => d.total).join('-')}`}
                data={visitasChartData} 
                options={chartOptions} 
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              No hay datos para mostrar
            </div>
          )}
        </div>
      </div>

      {/* Gráficos secundarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Distribución por Género y Edad */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Distribución Género y Edad</h2>
              <p className="text-sm text-gray-500">Composición demográfica</p>
            </div>
            <Select value={generoFilter} onValueChange={setGeneroFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {generoEdadData.length > 0 ? (
            <div className="h-80">
              <Bar 
                key={`genero-chart-${dateFrom}-${dateTo}-${generoEdadData.map(d => d.total).join('-')}`}
                data={generoChartData} 
                options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {...chartOptions.plugins.legend, position: 'bottom' as const}}}} 
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              No hay datos para mostrar
            </div>
          )}
        </div>

        {/* 4. Distribución Geográfica */}
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Distribución Geográfica</h2>
              <p className="text-sm text-gray-500">Pacientes por ciudad</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Input
                type="number"
                value={maxCiudades}
                onChange={(e) => setMaxCiudades(parseInt(e.target.value) || 10)}
                className="w-20"
                min="1"
                max="50"
              />
              <span className="text-sm text-gray-500">ciudades</span>
            </div>
          </div>
          
          {geografiaData.length > 0 ? (
            <div className="h-80">
              <Bar 
                key={`geografia-chart-${dateFrom}-${dateTo}-${geografiaData.map(d => d.total).join('-')}`}
                data={geografiaChartData} 
                options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {display: false}}}} 
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              No hay datos geográficos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Editores de rangos */}
      {showEdadEditor && (
        <RangeEditor
          title="Editar Rangos de Edad"
          ranges={edadRanges}
          onRangesChange={setEdadRanges}
          onClose={() => setShowEdadEditor(false)}
        />
      )}

      {showVisitasEditor && (
        <RangeEditor
          title="Editar Rangos de Visitas"
          ranges={visitasRanges}
          onRangesChange={setVisitasRanges}
          onClose={() => setShowVisitasEditor(false)}
        />
      )}
    </Fragment>
  )
}
