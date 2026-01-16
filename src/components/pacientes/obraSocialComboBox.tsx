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

export type ObraSocialOption = {
  id: number;
  nombre: string;
};

type ObraSocialComboBoxProps = {
  options: ObraSocialOption[];
  value: ObraSocialOption | null;
  onChange: (value: ObraSocialOption | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function ObraSocialComboBox({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Selecciona el Tipo de Cobertura",
  disabled = false,
}: ObraSocialComboBoxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full max-w-xs justify-between"
        >
          <span className="truncate">{value ? value.nombre : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          {/* Header: buscador + botón + */}
          <div className="flex items-center gap-2 border-b p-2">
            <div className="flex-1">
              <CommandInput placeholder="Buscar cobertura..." />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={!onCreateNew}
              onClick={() => {
                setOpen(false);
                onCreateNew?.();
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
                  key={o.id}
                  value={o.nombre}
                  onSelect={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === o.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {o.nombre}
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
    </Popover>
  );
}
