import { 
  MoreHorizontal, 
  Building2, 
  Trash2,
  RefreshCcw,
  SearchX
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ObraSocial } from '@/types/obraSocial' 
import UpdateModalObraSocialComponent from './updateModalObraSocial'
import { useState } from 'react'
import { deleteObraSocial, formatFechaArgentina } from '@/lib/utils'
import NotifySuccessComponent from './notifySuccess'
import ConfirmModalChangeStateObraSocial from './confirmModalChangeStateObraSocial'

interface ListadoProps {
    obras: ObraSocial[]
    onRefresh: () => void
    isFiltered?: boolean
}

export default function ListadoObraSocial({ obras, onRefresh, isFiltered }: ListadoProps) {
  const [loadingDelete, setIsLoading] = useState(false)
  const [openNotify, setOpenNotify] = useState(false)
  const [itemToToggle, setItemToToggle] = useState<{id: number, isActive: boolean} | null>(null)

  const handleOpenConfirm = (id: number, isActive: boolean) => {
    setItemToToggle({ id, isActive })
  }

  const handleConfirmAction = async () => {
    if (!itemToToggle) return
    try {
      setIsLoading(true)
      await deleteObraSocial(itemToToggle.id)
      onRefresh() 
      setOpenNotify(true)
      setItemToToggle(null)
      setTimeout(() => setOpenNotify(false), 2000)
    } catch (error) {
      console.error(error)
      alert("Hubo un error al procesar la solicitud.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <ConfirmModalChangeStateObraSocial 
        open={!!itemToToggle} 
        onOpenChange={(isOpen) => !isOpen && setItemToToggle(null)}
        onConfirm={handleConfirmAction}
        loading={loadingDelete}
        isActive={itemToToggle?.isActive ?? false}
      />

      <NotifySuccessComponent 
        open={openNotify} 
        title="Estado actualizado" 
        description="La operación se realizó con éxito." 
      />

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-100">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="w-[400px] text-xs font-semibold uppercase tracking-wider text-slate-500 pl-6 h-12">Obra Social</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-12">Estado</TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-slate-500 h-12">Fecha y hora de creacion</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pr-6 h-12">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obras.length > 0 ? (
                  obras.map((obra) => (
                    <TableRow key={obra.idObraSocial} className="hover:bg-slate-50/60 transition-colors group border-slate-100">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`
                            h-10 w-10 rounded-lg flex items-center justify-center border shadow-sm transition-colors
                            ${obra.estadoObraSocial 
                                ? 'bg-white border-slate-200 text-cyan-600 group-hover:border-cyan-200 group-hover:bg-cyan-50' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'
                            }
                          `}>
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                              <span className={`block font-medium ${obra.estadoObraSocial ? 'text-slate-900' : 'text-slate-500 line-through decoration-slate-300'}`}>
                                  {obra.nombreObraSocial}
                              </span>
                              <span className="text-xs text-slate-400">ID: #{obra.idObraSocial}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`
                            px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${obra.estadoObraSocial
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                            }
                          `}
                        >
                           <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${obra.estadoObraSocial ? 'bg-cyan-500' : 'bg-slate-400'}`} />
                           {obra.estadoObraSocial ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-500 text-sm">
                         {String(obra.fechaHoraObraSocial).split("T")[0] + " " + String(obra.fechaHoraObraSocial).split("T")[1].split(".")[0]}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel className="text-xs text-slate-500 font-normal">Acciones</DropdownMenuLabel>
                            
                            <DropdownMenuItem asChild>
                                <div onClick={(e) => e.preventDefault()} className="cursor-pointer">
                                   <UpdateModalObraSocialComponent idObraSocial={obra.idObraSocial} onSuccess={onRefresh} />
                                </div>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              className={`cursor-pointer gap-2 ${obra.estadoObraSocial ? 'text-red-600 focus:text-red-700 focus:bg-red-50' : 'text-cyan-600 focus:text-cyan-700 focus:bg-cyan-50'}`}
                              onClick={() => handleOpenConfirm(obra.idObraSocial, obra.estadoObraSocial)}
                            >
                              {obra.estadoObraSocial ? <Trash2 className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
                              {obra.estadoObraSocial ? "Desactivar" : "Restaurar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-[300px] text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <SearchX className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-900">No se encontraron resultados</p>
                        <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
                          {isFiltered 
                            ? "Intenta ajustar los filtros de búsqueda o el estado." 
                            : "Aún no hay obras sociales registradas en el sistema."}
                        </p>
                        {isFiltered && (
                           <Button variant="link" className="text-cyan-600 mt-2" onClick={onRefresh}>
                             Refrescar lista
                           </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  )
}