export default function ReportesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Reportes y Estadísticas</h1>
        <p className="text-gray-600">Analiza el rendimiento y estadísticas de la clínica</p>
      </div>

      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Próximamente</h2>
        <p className="text-gray-600 mb-4">Los reportes estarán disponibles pronto</p>
        <div className="text-sm text-gray-500">
          <p>Funcionalidades planificadas:</p>
          <ul className="mt-2 space-y-1">
            <li>• Estadísticas de pacientes</li>
            <li>• Reportes financieros</li>
            <li>• Análisis de turnos</li>
            <li>• Dashboard ejecutivo</li>
            <li>• Exportación de datos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}