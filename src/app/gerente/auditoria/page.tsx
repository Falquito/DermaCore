export default function AuditoriaPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Auditoría del Sistema</h1>
        <p className="text-gray-600">Registro de actividades y seguimiento del sistema</p>
      </div>

      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Próximamente</h2>
        <p className="text-gray-600 mb-4">El módulo de auditoría estará disponible pronto</p>
        <div className="text-sm text-gray-500">
          <p>Funcionalidades planificadas:</p>
          <ul className="mt-2 space-y-1">
            <li>• Registro de accesos</li>
            <li>• Historial de cambios</li>
            <li>• Monitoreo de usuarios</li>
            <li>• Reportes de seguridad</li>
            <li>• Alertas automáticas</li>
          </ul>
        </div>
      </div>
    </div>
  )
}