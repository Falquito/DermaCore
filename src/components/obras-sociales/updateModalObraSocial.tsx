"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputsCreateObraSocial } from "@/types/inputsCreateObraSocial"
import { Loader2, FilePenLine, Pencil } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"
import NotifySuccessComponent from "./notifySuccess"
import { updateObraSocial } from "@/lib/utils"

export default function UpdateModalObraSocialComponent({idObraSocial, onSuccess}:{onSuccess:()=>void, idObraSocial:number}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [openNotify, setOpenNotify] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InputsCreateObraSocial>()

  const onSubmit: SubmitHandler<InputsCreateObraSocial> = async (data) => {
    try {
      setIsLoading(true)
      await updateObraSocial({nombreObraSocial:data.name, id:idObraSocial}) 
      onSuccess()
      setOpenNotify(true)
      setOpen(false) 
      reset()
      setTimeout(() => setOpenNotify(false), 2000)
    } catch (error) {
      console.error(error)
      alert("Hubo un error al guardar.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <NotifySuccessComponent 
         open={openNotify} 
         title="Edición exitosa" 
         description="Los datos de la obra social han sido actualizados." 
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {/* Mantenemos el estilo de item de menú para que encaje en el Dropdown */}
          <div className="flex w-full cursor-pointer items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 rounded-sm">
            <Pencil className="mr-2 h-4 w-4 text-slate-500" /> 
            Editar datos
          </div>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[500px] gap-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                    <FilePenLine className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <DialogTitle className="text-xl">Editar Obra Social</DialogTitle>
                    <DialogDescription>
                        Modifica el nombre visible de la cobertura.
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>

          <form id="update-obra-form" onSubmit={handleSubmit(onSubmit)}>
             <div className="grid gap-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-sm font-medium text-slate-700">
                        Nombre de la Obra Social
                    </Label>
                    <Input
                        id="nombre"
                        placeholder="Ej: Nobis Medical"
                        disabled={isLoading} 
                        className={`
                            bg-white focus-visible:ring-2 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 transition-all
                            ${errors.name ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200"}
                        `}
                        {...register("name", { required: true, minLength: 2 })} 
                    />
                    {errors.name && (
                        <p className="text-red-500 text-xs font-medium mt-1">
                            El nombre es obligatorio
                        </p>
                    )}
                </div>
             </div>
          </form>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              Cancelar
            </Button>
            
            <Button 
              type="submit" 
              form="update-obra-form"
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}