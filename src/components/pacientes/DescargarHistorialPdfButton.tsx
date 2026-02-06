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
  tieneConsultas?: boolean;
};

export default function DescargarHistorialPdfButton({
  idPaciente,
  nombrePaciente,
  apellidoPaciente,
  tieneConsultas = true,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      const message = error instanceof Error ? error.message : "No se pudo descargar el PDF del paciente";
      setErrorMessage(message);
      setErrorDialog(true);
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
        disabled={loading || !tieneConsultas}
        className="
          flex items-center gap-2
          border-cyan-300
          text-cyan-900
        "
        title={!tieneConsultas ? "El paciente no tiene consultas registradas" : ""}
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

      <AlertDialog open={errorDialog} onOpenChange={setErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Error al descargar
            </AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogAction
              onClick={() => setErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              Aceptar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
