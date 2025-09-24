'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { PatientFormData } from '@/types/patient'

interface FormularioAltaPacienteProps {
  onSubmit: (data: PatientFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function FormularioAltaPaciente({ onSubmit, onCancel, isLoading: externalLoading }: FormularioAltaPacienteProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading || internalLoading
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: undefined as Date | undefined,
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

  const formatDNI = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 8)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.slice(0, 15)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, fechaNacimiento: date }))
    if (errors.fechaNacimiento) {
      setErrors(prev => ({ ...prev, fechaNacimiento: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setInternalLoading(true)
    setErrors({})

    // Validaciones del lado cliente
    const newErrors: Record<string, string> = {}
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio'
    if (!formData.dni.trim()) newErrors.dni = 'El DNI es obligatorio'
    else if (!validateDNI(formData.dni)) newErrors.dni = 'El DNI debe tener entre 7 y 8 dígitos'
    if (!formData.fechaNacimiento) newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    if (!formData.genero) newErrors.genero = 'El género es obligatorio'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setInternalLoading(false)
      return
    }

    try {
      // Asegurar que fechaNacimiento no sea undefined
      if (!formData.fechaNacimiento) {
        setErrors({ fechaNacimiento: 'La fecha de nacimiento es obligatoria' })
        setInternalLoading(false)
        return
      }

      await onSubmit({
        ...formData,
        fechaNacimiento: formData.fechaNacimiento
      })
    } catch (error) {
      console.error('Error al crear paciente:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Error al crear el paciente. Intente nuevamente.' })
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">Alta de Paciente</DialogTitle>
        </DialogHeader>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Personales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={errors.nombre ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <Label htmlFor="apellido">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => handleInputChange('apellido', e.target.value)}
                  className={errors.apellido ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
              </div>

              <div>
                <Label htmlFor="dni">
                  DNI <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dni"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={(e) => handleInputChange('dni', formatDNI(e.target.value))}
                  className={errors.dni ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni}</p>}
              </div>

              <div>
                <Label htmlFor="fechaNacimiento">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={formData.fechaNacimiento}
                  onDateChange={handleDateChange}
                  placeholder="Seleccionar fecha de nacimiento"
                  disabled={isLoading}
                  className={errors.fechaNacimiento ? 'border-red-500' : ''}
                />
                {errors.fechaNacimiento && <p className="text-red-500 text-xs mt-1">{errors.fechaNacimiento}</p>}
              </div>

              <div>
                <Label htmlFor="genero">
                  Género <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.genero} onValueChange={(value) => handleInputChange('genero', value)}>
                  <SelectTrigger className={errors.genero ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.genero && <p className="text-red-500 text-xs mt-1">{errors.genero}</p>}
              </div>
            </div>
          </div>

          {/* Datos de Contacto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Datos de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono Fijo</Label>
                <Input
                  id="telefono"
                  placeholder="011-4567-8901"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', formatPhone(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  placeholder="11-1234-5678"
                  value={formData.celular}
                  onChange={(e) => handleInputChange('celular', formatPhone(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="paciente@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Av. Corrientes 1234"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  placeholder="CABA"
                  value={formData.ciudad}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  placeholder="Buenos Aires"
                  value={formData.provincia}
                  onChange={(e) => handleInputChange('provincia', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  placeholder="1414"
                  value={formData.codigoPostal}
                  onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contactoEmergenciaNombre">Nombre y Apellido</Label>
                <Input
                  id="contactoEmergenciaNombre"
                  placeholder="Juan Pérez"
                  value={formData.contactoEmergenciaNombre}
                  onChange={(e) => handleInputChange('contactoEmergenciaNombre', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="contactoEmergenciaTelefono">Teléfono</Label>
                <Input
                  id="contactoEmergenciaTelefono"
                  placeholder="11-1234-5678"
                  value={formData.contactoEmergenciaTelefono}
                  onChange={(e) => handleInputChange('contactoEmergenciaTelefono', formatPhone(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="contactoEmergenciaRelacion">Relación</Label>
                <Input
                  id="contactoEmergenciaRelacion"
                  placeholder="Hermano"
                  value={formData.contactoEmergenciaRelacion}
                  onChange={(e) => handleInputChange('contactoEmergenciaRelacion', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Paciente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}