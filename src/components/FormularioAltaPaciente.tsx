'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { PatientFormData, PatientSubmitData } from '@/types/patient'
import { User, Phone, MapPin, AlertCircle } from 'lucide-react'

interface FormularioAltaPacienteProps {
  onSubmit: (data: PatientSubmitData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function FormularioAltaPaciente({ onSubmit, onCancel, isLoading: externalLoading }: FormularioAltaPacienteProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading || internalLoading
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<PatientFormData>({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: undefined,
    genero: '',
    telefono: '',
    celular: '',
    email: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    contactoEmergenciaRelacion: '',
  })

  const validateDNI = (dni: string) => {
    const dniNumber = dni.replace(/\D/g, '')
    return dniNumber.length >= 7 && dniNumber.length <= 8
  }

  const validateEmail = (email: string) => {
    if (!email.trim()) return true // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateAge = (fechaNacimiento: Date | undefined) => {
    if (!fechaNacimiento) return false
    const today = new Date()
    const age = today.getFullYear() - fechaNacimiento.getFullYear()
    const monthDiff = today.getMonth() - fechaNacimiento.getMonth()
    const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < fechaNacimiento.getDate()) ? age - 1 : age
    return finalAge >= 0 && finalAge <= 150
  }

  const validateName = (name: string) => {
    return name.trim().length >= 2
  }

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validaciones requeridas
    if (!validateName(formData.nombre)) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    }
    if (!validateName(formData.apellido)) {
      newErrors.apellido = 'El apellido debe tener al menos 2 caracteres'
    }
    if (!validateDNI(formData.dni)) {
      newErrors.dni = 'El DNI debe tener entre 7 y 8 dígitos'
    }
    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida'
    } else if (!validateAge(formData.fechaNacimiento)) {
      newErrors.fechaNacimiento = 'La edad debe estar entre 0 y 150 años'
    }
    if (!formData.genero) {
      newErrors.genero = 'El género es requerido'
    }

    // Validaciones opcionales pero con formato
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'El formato del email no es válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setInternalLoading(true)
    try {
      // Preparar los datos para envío, convirtiendo la fecha a ISO string
      const dataToSubmit: PatientSubmitData = {
        ...formData,
        fechaNacimiento: formData.fechaNacimiento?.toISOString() || undefined
      }
      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-[98vw] w-[98vw] lg:max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-gray-800">Alta de Paciente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 pt-0">
          <div className="space-y-8">
            
            {/* Datos Personales */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-100/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-400 rounded-full">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-600">Datos Personales</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-emerald-600 font-medium">Nombre *</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Ingrese el nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className="border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-emerald-50/30 hover:border-emerald-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                  {errors.nombre && (
                    <p className="text-red-500 text-sm">{errors.nombre}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido" className="text-emerald-600 font-medium">Apellido *</Label>
                  <Input
                    id="apellido"
                    type="text"
                    placeholder="Ingrese el apellido"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange('apellido', e.target.value)}
                    className="border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-emerald-50/30 hover:border-emerald-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                  {errors.apellido && (
                    <p className="text-red-500 text-sm">{errors.apellido}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-emerald-600 font-medium">DNI *</Label>
                  <Input
                    id="dni"
                    type="text"
                    placeholder="12345678"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className="border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-emerald-50/30 hover:border-emerald-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                  {errors.dni && (
                    <p className="text-red-500 text-sm">{errors.dni}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento" className="text-emerald-600 font-medium">Fecha de Nacimiento *</Label>
                  <DatePicker
                    date={formData.fechaNacimiento}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, fechaNacimiento: date }))}
                    placeholder="Seleccionar fecha de nacimiento"
                    disabled={isLoading}
                    className="border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-emerald-50/30 hover:border-emerald-300 transition-all duration-200 shadow-sm"
                  />
                  {errors.fechaNacimiento && (
                    <p className="text-red-500 text-sm">{errors.fechaNacimiento}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genero" className="text-emerald-600 font-medium">Género *</Label>
                  <Select
                    value={formData.genero}
                    onValueChange={(value) => handleInputChange('genero', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="border-2 border-emerald-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-emerald-50/30 hover:border-emerald-300 transition-all duration-200 shadow-sm" id="genero">
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.genero && (
                    <p className="text-red-500 text-sm">{errors.genero}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Datos de Contacto */}
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-100/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-400 rounded-full">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-blue-600">Datos de Contacto</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-blue-600 font-medium">Teléfono Fijo</Label>
                  <Input
                    id="telefono"
                    type="text"
                    placeholder="011-4567-890"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className="border-2 border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-blue-50/30 hover:border-blue-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celular" className="text-blue-600 font-medium">Celular</Label>
                  <Input
                    id="celular"
                    type="text"
                    placeholder="11-1234-5678"
                    value={formData.celular}
                    onChange={(e) => handleInputChange('celular', e.target.value)}
                    className="border-2 border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-blue-50/30 hover:border-blue-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-600 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="paciente@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="border-2 border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-blue-50/30 hover:border-blue-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-400 rounded-full">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-purple-600">Dirección</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                  <Label htmlFor="direccion" className="text-purple-600 font-medium">Dirección</Label>
                  <Input
                    id="direccion"
                    placeholder="Av. Corrientes 1234"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    className="border-2 border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-purple-50/30 hover:border-purple-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad" className="text-purple-600 font-medium">Ciudad</Label>
                  <Input
                    id="ciudad"
                    placeholder="CABA"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    className="border-2 border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-purple-50/30 hover:border-purple-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provincia" className="text-purple-600 font-medium">Provincia</Label>
                  <Input
                    id="provincia"
                    placeholder="Buenos Aires"
                    value={formData.provincia}
                    onChange={(e) => handleInputChange('provincia', e.target.value)}
                    className="border-2 border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-purple-50/30 hover:border-purple-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigoPostal" className="text-purple-600 font-medium">Código Postal</Label>
                  <Input
                    id="codigoPostal"
                    placeholder="1414"
                    value={formData.codigoPostal}
                    onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                    className="border-2 border-purple-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-purple-50/30 hover:border-purple-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-100/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-400 rounded-full">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-orange-600">Contacto de Emergencia</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactoEmergenciaNombre" className="text-orange-600 font-medium">Nombre y Apellido</Label>
                  <Input
                    id="contactoEmergenciaNombre"
                    placeholder="Juan Pérez"
                    value={formData.contactoEmergenciaNombre}
                    onChange={(e) => handleInputChange('contactoEmergenciaNombre', e.target.value)}
                    className="border-2 border-orange-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:bg-orange-50/30 hover:border-orange-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactoEmergenciaTelefono" className="text-orange-600 font-medium">Teléfono</Label>
                  <Input
                    id="contactoEmergenciaTelefono"
                    placeholder="11-1234-5678"
                    value={formData.contactoEmergenciaTelefono}
                    onChange={(e) => handleInputChange('contactoEmergenciaTelefono', e.target.value)}
                    className="border-2 border-orange-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:bg-orange-50/30 hover:border-orange-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactoEmergenciaRelacion" className="text-orange-600 font-medium">Relación</Label>
                  <Input
                    id="contactoEmergenciaRelacion"
                    placeholder="Hermano"
                    value={formData.contactoEmergenciaRelacion}
                    onChange={(e) => handleInputChange('contactoEmergenciaRelacion', e.target.value)}
                    className="border-2 border-orange-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:bg-orange-50/30 hover:border-orange-300 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                'Crear Paciente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
