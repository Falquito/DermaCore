import { Users } from "lucide-react"

export default function HeaderPacientes() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        
        <div className="flex items-center gap-2">
            <div className="p-3 bg-cyan-50 rounded-lg group-hover:bg-cyan-100 transition-colors">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Pacientes
            </h1>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
            Listado de pacientes cargados en el sistema.
        </p>

      </div>
    </div>
  )
}