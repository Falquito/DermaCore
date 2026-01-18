"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type EstadoPacienteFilter = "true" | "false" | "all";

type Props = {
  value: EstadoPacienteFilter;
  onChange: (v: EstadoPacienteFilter) => void;
  disabled?: boolean;
};

export default function FiltroEstadoPacientes({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as EstadoPacienteFilter)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="true" disabled={disabled}>
          Activos
        </TabsTrigger>
        <TabsTrigger value="false" disabled={disabled}>
          Inactivos
        </TabsTrigger>
        <TabsTrigger value="all" disabled={disabled}>
          Todos
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
