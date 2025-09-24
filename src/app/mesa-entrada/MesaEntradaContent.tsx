'use client'

import { useState } from 'react'
import { Patient } from '@prisma/client'
import FormularioAltaPaciente from '@/components/FormularioAltaPaciente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PatientSubmitData } from '@/types/patient'

interface PatientWithCreator extends Patient {
  creator: {
    name: string | null
    email: string
  }
}

interface MesaEntradaContentProps {
  initialPatients: PatientWithCreator[]
}

export default function MesaEntradaContent({ 
  initialPatients 
}: MesaEntradaContentProps) {
  const [showFormulario, setShowFormulario] = useState(false)
  const [patients, setPatients] = useState(initialPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreatePatient = async (patientData: PatientSubmitData) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el paciente')
      }
      
      if (result.success) {
        // Agregar el nuevo paciente a la lista
        setPatients(prev => [result.patient, ...prev])
        setShowFormulario(false)
        
        // Mostrar mensaje de éxito
        alert(result.message)
      }
    } catch (error) {
      console.error('Error:', error)
      throw error // Re-throw para que FormularioAltaPaciente maneje el error
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    return (
      patient.nombre.toLowerCase().includes(term) ||
      patient.apellido.toLowerCase().includes(term) ||
      patient.dni.includes(term) ||
      patient.email?.toLowerCase().includes(term)
    )
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Gestión de Pacientes</h1>
        <p className="text-gray-600">Administra el registro y la información de los pacientes</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar paciente por nombre, apellido, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setShowFormulario(true)}
            disabled={isLoading}
            className="ml-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              '+ Nuevo Paciente'
            )}
          </Button>
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No se encontraron pacientes que coincidan con la búsqueda' : 'No hay pacientes registrados'}
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {patient.apellido}, {patient.nombre}
                        </h3>
                        <span className="text-sm text-gray-500">DNI: {patient.dni}</span>
                        <span className="text-sm text-gray-500">
                          Nacimiento: {formatDate(patient.fechaNacimiento)}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        {patient.telefono && (
                          <span>📞 {patient.telefono}</span>
                        )}
                        {patient.celular && (
                          <span>📱 {patient.celular}</span>
                        )}
                        {patient.email && (
                          <span>✉️ {patient.email}</span>
                        )}
                      </div>
                      
                      {(patient.direccion || patient.ciudad) && (
                        <div className="mt-1 text-sm text-gray-500">
                          📍 {patient.direccion && `${patient.direccion}, `}
                          {patient.ciudad && `${patient.ciudad}`}
                          {patient.provincia && `, ${patient.provincia}`}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-sm text-gray-400">
                      <div>Registrado: {formatDate(patient.createdAt)}</div>
                      <div>Por: {patient.creator.name || patient.creator.email}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total de pacientes: <span className="font-medium">{patients.length}</span>
              {searchTerm && ` | Mostrando: ${filteredPatients.length}`}
            </p>
          </div>
        </div>
      </div>

      {/* Modal del formulario */}
      {showFormulario && (
        <FormularioAltaPaciente
          onSubmit={handleCreatePatient}
          onCancel={() => setShowFormulario(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
