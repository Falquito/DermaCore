"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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

export type CoseguroOption = {
  idCoseguro: number;
  nombreCoseguro: string;
};

type CoseguroComboBoxProps = {
  options: CoseguroOption[];
  value: CoseguroOption | null;
  onChange: (value: CoseguroOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function CoseguroComboBox({
  options,
  value,
  onChange,
  placeholder = "Selecciona el Coseguro",
  disabled = false,
}: CoseguroComboBoxProps) {
  const [open, setOpen] = React.useState(false);

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
            {value ? value.nombreCoseguro : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <div className="border-b p-2">
            <CommandInput placeholder="Buscar coseguro..." />
          </div>

          <CommandList>
            <CommandEmpty>No se encontraron coseguros.</CommandEmpty>

            <CommandGroup>
              {options.map((c) => (
                <CommandItem
                  key={c.idCoseguro}
                  value={c.nombreCoseguro}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.idCoseguro === c.idCoseguro
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {c.nombreCoseguro}
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
