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
      className="flex items-center gap-2 bg-cyan-300 text-cyan-800 hover:bg-cyan-500"
    >
      <Plus className="h-4 w-4" />
      Nuevo paciente
    </Button>
  );
}
