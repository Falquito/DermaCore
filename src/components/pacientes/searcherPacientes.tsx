"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearcherPacientesProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function SearcherPacientes({
  value,
  onChange,
  placeholder = "Buscar por DNI...",
  disabled = false,
}: SearcherPacientesProps) {
  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9"
        />
      </div>
    </div>
  );
}
