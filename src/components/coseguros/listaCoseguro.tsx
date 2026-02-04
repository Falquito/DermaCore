import { useState } from "react"
import { MoreHorizontal, SearchX, Pencil, ShieldPlus, Trash2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { Coseguro } from "@/types/coseguro"
import NotifySuccessComponent from "@/components/obras-sociales/notifySuccess"
import ConfirmModalChangeStateCoseguro from "./confirmModalChangeStateCoseguro"
import UpdateModalCoseguroComponent from "./updateModalCoseguro"
import CosegurosMobileList from "./cosegurosMobileList"
import { deleteCoseguro } from "@/lib/utils"

interface ListadoProps {
  coseguros: Coseguro[]
  onRefresh: () => void
  isFiltered?: boolean
}

export default function ListadoCoseguro({ coseguros, onRefresh, isFiltered }: ListadoProps) {
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [openNotify, setOpenNotify] = useState(false)

  const [itemToToggle, setItemToToggle] = useState<{ id: number; isActive: boolean } | null>(null)
  const [coseguroToEdit, setCoseguroToEdit] = useState<Coseguro | null>(null)

  const handleOpenConfirm = (id: number, isActive: boolean) => {
    setItemToToggle({ id, isActive })
  }

  const handleConfirmAction = async () => {
    if (!itemToToggle) return
    try {
      setLoadingToggle(true)
      await deleteCoseguro(itemToToggle.id)
      onRefresh()
      setOpenNotify(true)
      setItemToToggle(null)
      setTimeout(() => setOpenNotify(false), 2000)
    } finally {
      setLoadingToggle(false)
    }
  }

  const isEmpty = coseguros.length === 0

  return (
    <>
      <ConfirmModalChangeStateCoseguro
        open={!!itemToToggle}
        onOpenChange={(isOpen) => !isOpen && setItemToToggle(null)}
        onConfirm={handleConfirmAction}
        loading={loadingToggle}
        isActive={itemToToggle?.isActive ?? false}
      />

      <NotifySuccessComponent
        open={openNotify}
        title="Operación simulada"
        description="Acción ejecutada (solo frontend)."
      />

      {coseguroToEdit && (
        <UpdateModalCoseguroComponent
          idCoseguro={coseguroToEdit.idCoseguro}
          open={!!coseguroToEdit}
          onClose={() => setCoseguroToEdit(null)}
          currentName={coseguroToEdit.nombreCoseguro}
          onSuccess={onRefresh}
        />
      )}

      {isEmpty ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex items-center justify-center">
            <div className="flex flex-col items-center justify-center text-slate-500 text-center">
              <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <SearchX className="h-6 w-6 text-slate-400" />
              </div>
              <p className="font-medium text-slate-900">No se encontraron resultados</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
                {isFiltered
                  ? "Intenta ajustar los filtros de búsqueda o el estado."
                  : "Aún no hay coseguros registrados en el sistema."}
              </p>
              {isFiltered && (
                <Button variant="link" className="text-cyan-600 mt-2" onClick={onRefresh}>
                  Refrescar lista
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>

          <CosegurosMobileList
            coseguros={coseguros}
            onEdit={(c) => setCoseguroToEdit(c)}
            onToggle={(id, isActive) => handleOpenConfirm(id, isActive)}
          />

          <div className="hidden md:block">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>

                  <TableHeader className="border-b border-slate-100 bg-white">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-6 py-3 h-auto align-middle">
                        Coseguro
                      </TableHead>

                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 py-3 h-auto align-middle">
                        Estado
                      </TableHead>

                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pr-6 py-3 h-auto align-middle">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {coseguros.map((c) => (
                      <TableRow
                        key={c.idCoseguro}
                        className="hover:bg-slate-50/60 transition-colors group border-slate-100"
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`
                                h-10 w-10 rounded-lg flex items-center justify-center border shadow-sm transition-colors
                                ${
                                  c.estadoCoseguro
                                    ? "bg-white border-slate-200 text-cyan-600 group-hover:border-cyan-200 group-hover:bg-cyan-50"
                                    : "bg-slate-50 border-slate-100 text-slate-400 grayscale"
                                }
                              `}
                            >
                              <ShieldPlus className="h-5 w-5" />
                            </div>

                            <div>
                              <p
                  className={`font-medium  ${
                    c.estadoCoseguro ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"
                  }`}
                >
                  {c.nombreCoseguro}
                </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`
                              px-2.5 py-0.5 rounded-full text-xs font-medium border
                              ${
                                c.estadoCoseguro
                                  ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                  : "bg-red-100 text-red-500 border-red-200"
                              }
                            `}
                          >
                            <div
                              className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                c.estadoCoseguro ? "bg-cyan-500" : "bg-red-400"
                              }`}
                            />
                            {c.estadoCoseguro ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"
                              >
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                                Acciones
                              </DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() => setCoseguroToEdit(c)}
                                className="cursor-pointer"
                              >
                                <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                                Editar datos
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleOpenConfirm(c.idCoseguro, c.estadoCoseguro)}
                                  className="cursor-pointer text-slate-600 focus:text-slate-900"
                                >
                                  {c.estadoCoseguro ? (
                                    <Trash2 className="mr-2 h-4 w-4 text-red-400" />
                                  ) : (
                                    <RefreshCw className="mr-2 h-4 w-4 text-cyan-600" />
                                  )}
                                  {c.estadoCoseguro ? "Desactivar" : "Restaurar"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
 