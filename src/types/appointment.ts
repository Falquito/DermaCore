import { AppointmentStatus, TipoConsulta } from '@prisma/client'

// Tipo para los datos del formulario de turno
export interface AppointmentFormData {
  // Datos del paciente
  pacienteId?: string
  // Si se crea un paciente nuevo
  pacienteNuevo?: {
    nombre: string
    apellido: string
    dni: string
    fechaNacimiento: string
    genero: string
    telefono?: string
    celular?: string
    email?: string
  }
  
  // Datos del turno
  profesionalId: string
  fecha: Date
  hora: string
  duracion: number
  motivo?: string
  observaciones?: string
  
  // Datos de obra social
  tipoConsulta: TipoConsulta
  obraSocialId?: string
  numeroAfiliado?: string
  copago?: number
  autorizacion?: string
}

// Tipo para envío al servidor
export interface AppointmentSubmitData {
  pacienteId?: string
  pacienteNuevo?: {
    nombre: string
    apellido: string
    dni: string
    fechaNacimiento: string
    genero: string
    telefono?: string
    celular?: string
    email?: string
  }
  profesionalId: string
  fecha: string
  duracion: number
  motivo?: string
  observaciones?: string
  tipoConsulta: TipoConsulta
  obraSocialId?: string
  numeroAfiliado?: string
  copago?: number
  autorizacion?: string
}

// Tipo para disponibilidad de horarios
export interface HorarioDisponible {
  fecha: string
  hora: string
  disponible: boolean
  profesionalId: string
}

// Tipo para profesional con disponibilidad
export interface ProfesionalConDisponibilidad {
  id: string
  name: string
  email: string
  especialidad?: string
  horariosDisponibles: HorarioDisponible[]
}

// Tipo para la respuesta de búsqueda de pacientes
export interface PacienteBusqueda {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: Date
  telefono?: string
  celular?: string
  email?: string
}

// Tipo para turno completo con relaciones
export interface TurnoCompleto {
  id: string
  fecha: Date
  duracion: number
  motivo?: string
  observaciones?: string
  estado: AppointmentStatus
  tipoConsulta: TipoConsulta
  numeroAfiliado?: string
  copago?: number
  autorizacion?: string
  
  paciente: {
    id: string
    nombre: string
    apellido: string
    dni: string
  }
  
  profesional: {
    id: string
    name: string
  }
  
  obraSocial?: {
    id: string
    nombre: string
  }
  
  createdAt: Date
  updatedAt: Date
}