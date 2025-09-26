export default function GerentePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Inicio</h1>
        <p className="text-gray-600">Panel principal de control gerencial</p>
      </div>

      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Próximamente</h2>
        <p className="text-gray-600 mb-4">El panel de inicio estará disponible pronto</p>
        <div className="text-sm text-gray-500">
          <p>Funcionalidades planificadas:</p>
          <ul className="mt-2 space-y-1">
            <li>• Dashboard ejecutivo con KPIs</li>
            <li>• Resumen de actividades diarias</li>
            <li>• Métricas principales</li>
            <li>• Notificaciones importantes</li>
            <li>• Accesos rápidos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
