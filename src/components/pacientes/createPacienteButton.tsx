"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type CreatePacienteButtonProps = {
  onClick?: () => void;
};

export default function CreatePacienteButton({
  onClick,
}: CreatePacienteButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all hover:shadow-md"
    >
      <Plus className="h-4 w-4" />
      Nuevo paciente
    </Button>
  );
}
