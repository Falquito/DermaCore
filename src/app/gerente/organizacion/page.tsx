export default function OrganizacionPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Organización de la Clínica</h1>
        <p className="text-gray-600">Gestiona la estructura organizacional y configuración general</p>
      </div>

      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-6xl mb-4">🏢</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Próximamente</h2>
        <p className="text-gray-600 mb-4">La configuración organizacional estará disponible pronto</p>
        <div className="text-sm text-gray-500">
          <p>Funcionalidades planificadas:</p>
          <ul className="mt-2 space-y-1">
            <li>• Datos de la clínica</li>
            <li>• Estructura organizacional</li>
            <li>• Sucursales y sedes</li>
            <li>• Horarios de atención</li>
            <li>• Políticas institucionales</li>
          </ul>
        </div>
      </div>
    </div>
  )
}