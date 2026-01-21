"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog" // Quitamos DialogTrigger porque ya no lo usaremos aquí
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputsCreateObraSocial } from "@/types/inputsCreateObraSocial"
import { Loader2, Building2 } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"
import NotifySuccessComponent from "./notifySuccess"
import { updateObraSocial } from "@/lib/utils"
import NotifyNotSuccessComponent from "./notifyNotSuccess"
import { useState } from "react"

// Nuevas props: open y onClose
interface UpdateModalProps {
  idObraSocial: number
  currentName: string
  onSuccess: () => void
  open: boolean            // <-- Nuevo
  onClose: () => void      // <-- Nuevo
}

export default function UpdateModalObraSocialComponent({
  idObraSocial, 
  currentName, 
  onSuccess,
  open,
  onClose
}: UpdateModalProps) {
  
  const [isLoading, setIsLoading] = useState(false)
  const [openNotifySuccess, setOpenNotify] = useState(false)
  const [openNotifyNotSuccess, setOpenNotifyNotSuccess] = useState(false)
  const [msgError, setMsgError] = useState("")

  

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InputsCreateObraSocial>({
    defaultValues: { name: currentName }
  })

  // Reseteamos el formulario cuando cambia la obra social seleccionada
  useEffect(() => {
    if (open) {
      reset({ name: currentName })
    }
  }, [open, currentName, reset])

  // Función para manejar el cierre del diálogo
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  const onSubmit: SubmitHandler<InputsCreateObraSocial> = async (data) => {
    try {
      setIsLoading(true)
      await updateObraSocial({ id: idObraSocial, nombreObraSocial: data.name }) 
      onSuccess()
      setOpenNotify(true)
      onClose() // Cerramos el modal
      setTimeout(() => setOpenNotify(false), 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setMsgError(message)
      setOpenNotifyNotSuccess(true)
      setTimeout(() => setOpenNotifyNotSuccess(false), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <NotifySuccessComponent 
         open={openNotifySuccess} 
         title="Actualización exitosa" 
         description="Los datos han sido modificados correctamente." 
      />
      <NotifyNotSuccessComponent 
         open={openNotifyNotSuccess}
         title="Error al actualizar"
         description={msgError}
      />

      {/* Controlamos el Dialog con las props open y onOpenChange */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] gap-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                    <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <DialogTitle className="text-xl">Editar Obra Social</DialogTitle>
                    <DialogDescription>
                        Modifica el nombre de la cobertura médica.
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium text-slate-700">
                    Nombre de la Obra Social
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: OSDE, Swiss Medical..."
                  disabled={isLoading} 
                  className={`col-span-3 bg-white ${errors.name ? "border-red-500" : "border-slate-200"}`}
                  {...register("name", { required: true, minLength: 2 })} 
                />
                {errors.name && (
                    <p className="text-red-500 text-xs mt-1">Campo obligatorio</p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-2 mt-4">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose} // Usamos onClose aquí
                    disabled={isLoading}
                >
                    Cancelar
                </Button>
                
                <Button 
                    type="submit" 
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
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}