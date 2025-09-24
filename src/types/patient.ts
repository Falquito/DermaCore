// Tipos para los datos del formulario de paciente
export interface PatientFormData {
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: Date | undefined
  genero: string
  telefono: string
  celular: string
  email: string
  direccion: string
  ciudad: string
  provincia: string
  codigoPostal: string
  contactoEmergenciaNombre: string
  contactoEmergenciaTelefono: string
  contactoEmergenciaRelacion: string
}

// Tipo para envío al servidor (fechaNacimiento como string)
export interface PatientSubmitData {
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string | undefined
  genero: string
  telefono: string
  celular: string
  email: string
  direccion: string
  ciudad: string
  provincia: string
  codigoPostal: string
  contactoEmergenciaNombre: string
  contactoEmergenciaTelefono: string
  contactoEmergenciaRelacion: string
}

// Tipo para la respuesta de la API
export interface ApiResponse<T = unknown> {
  success?: boolean
  error?: string
  message?: string
  data?: T
}