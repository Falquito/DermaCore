export default function PagosPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600">Administra facturación, pagos y obras sociales</p>
        </div>

        <div className="rounded-lg border bg-white p-6 sm:p-8">
          <div className="mb-4 text-5xl sm:text-6xl">💳</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Próximamente</h2>
          <p className="mb-4 text-gray-600">La gestión de pagos estará disponible pronto</p>
          <div className="text-sm text-gray-500">
            <p>Funcionalidades planificadas:</p>
            <ul className="mt-2 space-y-1">
              <li>• Facturación automática</li>
              <li>• Registro de pagos</li>
              <li>• Integración con obras sociales</li>
              <li>• Reportes financieros</li>
              <li>• Control de deudas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
