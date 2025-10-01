export default function ConfiguracionPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Administra la configuración avanzada de la plataforma</p>
        </div>

        <div className="rounded-lg border bg-white p-6 sm:p-8">
          <div className="mb-4 text-5xl sm:text-6xl">⚙️</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Próximamente</h2>
          <p className="mb-4 text-gray-600">La configuración del sistema estará disponible pronto</p>
          <div className="text-sm text-gray-500">
            <p>Funcionalidades planificadas:</p>
            <ul className="mt-2 space-y-1">
              <li>• Configuración general</li>
              <li>• Parámetros del sistema</li>
              <li>• Configuración de roles</li>
              <li>• Políticas de seguridad</li>
              <li>• Integración con APIs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
