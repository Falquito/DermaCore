export default function ConfiguracionPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">Ajusta las preferencias del sistema</p>
      </div>

      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Próximamente</h2>
        <p className="text-gray-600 mb-4">Las opciones de configuración estarán disponibles pronto</p>
        <div className="text-sm text-gray-500">
          <p>Funcionalidades planificadas:</p>
          <ul className="mt-2 space-y-1">
            <li>• Configuración de obras sociales</li>
            <li>• Ajustes de usuario</li>
            <li>• Plantillas de documentos</li>
            <li>• Configuración de horarios</li>
            <li>• Respaldos automáticos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}