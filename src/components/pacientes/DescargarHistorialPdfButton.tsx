"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download } from "lucide-react";

type Props = {
  idPaciente: number;
  nombrePaciente: string;
  apellidoPaciente: string;
};

export default function DescargarHistorialPdfButton({
  idPaciente,
  nombrePaciente,
  apellidoPaciente,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      a.download = `${apellidoPaciente} ${nombrePaciente} - Historia Clinica.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("No se pudo descargar el PDF del paciente");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="
          flex items-center gap-2
          border-cyan-300
          text-cyan-900
        "
      >
        <Download className="h-4 w-4" />
        {loading ? "Generando PDF..." : "Descargar Historia Clinica"}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generar Historia Clínica</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas generar y descargar la historia clínica de{" "}
              <span className="font-semibold text-foreground">
                {apellidoPaciente}, {nombrePaciente}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDownload}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? "Generando..." : "Generar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
