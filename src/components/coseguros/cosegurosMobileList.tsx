import type { Coseguro } from "@/types/coseguro"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, ShieldPlus } from "lucide-react"

export default function CosegurosMobileList({
  coseguros,
  onEdit,
  onToggle,
}: {
  coseguros: Coseguro[]
  onEdit: (c: Coseguro) => void
  onToggle: (id: number, isActive: boolean) => void
}) {
  return (
    <div className="space-y-3 md:hidden">
      {coseguros.map((c) => (
        <Card key={c.idCoseguro} className="border-slate-200 shadow-sm p-4 ">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`
                  h-10 w-10 rounded-lg flex items-center justify-center border shadow-sm
                  ${c.estadoCoseguro ? "bg-white border-slate-200 text-cyan-600" : "bg-slate-50 border-slate-100 text-slate-400 grayscale"}
                `}
              >
                <ShieldPlus className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p
                  className={`font-medium  ${
                    c.estadoCoseguro ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"
                  }`}
                >
                  {c.nombreCoseguro}
                </p>

                <Badge
                  variant="outline"
                  className={`
                    mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center
                    ${c.estadoCoseguro ? "bg-cyan-50 text-cyan-700 border-cyan-200" : "bg-slate-100 text-slate-500 border-slate-200"}
                  `}
                >
                  <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${c.estadoCoseguro ? "bg-cyan-500" : "bg-slate-400"}`} />
                  {c.estadoCoseguro ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-slate-500 font-normal">Acciones</DropdownMenuLabel>

                <DropdownMenuItem onClick={() => onEdit(c)} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                  Editar
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onToggle(c.idCoseguro, c.estadoCoseguro)}
                  className="cursor-pointer"
                >
                  {c.estadoCoseguro ? "Desactivar" : "Restaurar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  )
}
