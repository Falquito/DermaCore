export default function TurnosPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Gestión de Turnos</h1>
        <p className="text-gray-600">Administra la agenda y citas médicas</p>
      </div>

      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Próximamente</h2>
        <p className="text-gray-600 mb-4">La gestión de turnos estará disponible pronto</p>
        <div className="text-sm text-gray-500">
          <p>Funcionalidades planificadas:</p>
          <ul className="mt-2 space-y-1">
            <li>• Calendario de turnos</li>
            <li>• Asignación de profesionales</li>
            <li>• Recordatorios automáticos</li>
            <li>• Lista de espera</li>
          </ul>
        </div>
      </div>
    </div>
  )
}