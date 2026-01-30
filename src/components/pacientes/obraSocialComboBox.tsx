"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export type ObraSocialOption = {
  idObraSocial: number;
  nombreObraSocial: string;
  admiteCoseguro?: boolean;
  estadoObraSocial?: boolean;
};

type ObraSocialComboBoxProps = {
  options: ObraSocialOption[];
  value: ObraSocialOption | null;
  onChange: (value: ObraSocialOption | null) => void;
  onCreateNew?: (newObra: ObraSocialOption) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function ObraSocialComboBox({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Selecciona la Obra Social",
  disabled = false,
}: ObraSocialComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newObraName, setNewObraName] = React.useState("");
  const [loadingCreate, setLoadingCreate] = React.useState(false);
  const [errorCreate, setErrorCreate] = React.useState<string | null>(null);

  const handleCreateNewObra = async () => {
    if (!newObraName.trim()) {
      setErrorCreate("El nombre de la obra social es requerido");
      return;
    }

    try {
      setLoadingCreate(true);
      setErrorCreate(null);

      const response = await fetch("/api/obras-sociales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreObraSocial: newObraName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error || "Error al crear la obra social"
        );
      }

      const newObra = await response.json();
      
      // Callback si se proporcionó
      onCreateNew?.(newObra);
      
      // Limpiar y cerrar
      setNewObraName("");
      setShowCreateDialog(false);
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setErrorCreate(message);
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between border-cyan-200 hover:border-cyan-400"
        >
          <span className="truncate">
            {value ? value.nombreObraSocial : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          {/* Header: buscador + botón crear */}
          <div className="flex items-center gap-2 border-b p-2">
            <div className="flex-1">
              <CommandInput placeholder="Buscar obra social..." />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={loadingCreate}
              onClick={() => {
                setShowCreateDialog(true);
              }}
              title="Crear nueva obra social"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <CommandList>
            <CommandEmpty>No se encontraron obras sociales.</CommandEmpty>

            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.idObraSocial}
                  value={o.nombreObraSocial}
                  onSelect={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.idObraSocial === o.idObraSocial
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {o.nombreObraSocial}
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Limpiar selección */}
            {value ? (
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>

      {/* Dialog para crear nueva obra social */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-cyan-900">
              Crear Nueva Obra Social
            </DialogTitle>
            <DialogDescription>
              Ingresa el nombre de la nueva obra social
            </DialogDescription>
          </DialogHeader>

          {errorCreate && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorCreate}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="obraName" className="text-cyan-900">
                Nombre de la Obra Social *
              </Label>
              <Input
                id="obraName"
                placeholder="Ej: OSDE, MEDICUS, GALENO"
                value={newObraName}
                onChange={(e) => {
                  setNewObraName(e.target.value);
                  setErrorCreate(null);
                }}
                disabled={loadingCreate}
                className="border-cyan-200 focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewObraName("");
                  setErrorCreate(null);
                }}
                disabled={loadingCreate}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNewObra}
                disabled={loadingCreate}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {loadingCreate && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}
