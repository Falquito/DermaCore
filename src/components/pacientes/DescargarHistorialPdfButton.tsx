"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Props = {
  idPaciente: number;
};

export default function DescargarHistorialPdfButton({ idPaciente }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/pacientes/${idPaciente}/reporte/pdf`
      );

      if (!res.ok) {
        throw new Error("Error al generar el PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `paciente-${idPaciente}-historial.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("No se pudo descargar el PDF del paciente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {loading ? "Generando PDF..." : "Descargar historial"}
    </Button>
  );
}
