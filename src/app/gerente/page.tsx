export default function GerentePage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">Inicio</h1>
          <p className="text-gray-600">Panel principal de control gerencial</p>
        </div>

        <div className="rounded-lg border bg-white p-6 sm:p-8">
          <div className="mb-4 text-5xl sm:text-6xl">🏠</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Próximamente</h2>
          <p className="mb-4 text-gray-600">El panel de inicio estará disponible pronto</p>
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
    </div>
  )
}
