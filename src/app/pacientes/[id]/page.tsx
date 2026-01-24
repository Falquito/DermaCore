"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedPage } from "@/components/auth/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Phone, IdCard, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";
import { formatFechaAR } from "@/lib/utils";
import RegistrarConsultaForm from "@/components/consultas/registrarConsultaForm";
import HistorialConsultasLista from "@/components/consultas/historialConsultasLista";
import type { Consulta } from "@/types/consulta";

type Paciente = {
  idPaciente: number;
  nombrePaciente: string;
  apellidoPaciente: string;
  dniPaciente: string;
  telefonoPaciente: string | null;
  domicilioPaciente: string | null;
  fechaHoraPaciente: string;
  estadoPaciente: boolean;
};

type UltimaObraSocial = {
  ultimaObraSocial: {
    idObraSocial: number;
    nombreObraSocial: string;
  } | null;
  nroAfiliado: string | null;
  fechaConsulta?: string;
  mensaje?: string;
};

// Función para formatear teléfono
function formatPhoneNumber(phone: string | null): string {
  if (!phone) return "No registrado";
  // Remover espacios, guiones y caracteres especiales
  const cleaned = phone.replace(/\D/g, "");
  // Si tiene 10 dígitos, formatear como (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  // Si tiene 11 dígitos (con 0 o +54), formatear apropiadamente
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  // Retornar el número original si no coincide con los formatos esperados
  return phone;
}

function PacienteDetailContent() {
  const params = useParams();
  const id = params.id as string;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [ultimaObraSocial, setUltimaObraSocial] = useState<UltimaObraSocial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construir URL sin parámetros iniciales para que la API calcule el rango basado en la última consulta
        const consultasUrl = new URL(`/api/pacientes/${id}/consultas`, window.location.origin);

        const [pacienteRes, consultasRes, ultimaObraSocialRes] = await Promise.all([
          fetch(`/api/pacientes/${id}`),
          fetch(consultasUrl.toString()),
          fetch(`/api/pacientes/${id}/ultima-obra-social`),
        ]);

        if (!pacienteRes.ok) throw new Error("No se pudo cargar el paciente");
        if (!consultasRes.ok) throw new Error("No se pudo cargar las consultas");
        if (!ultimaObraSocialRes.ok) throw new Error("No se pudo cargar última obra social");

        const pacienteData = await pacienteRes.json();
        const consultasData = await consultasRes.json();
        const ultimaObraSocialData = await ultimaObraSocialRes.json();

        setPaciente(pacienteData);
        setConsultas(consultasData.consultas || []);
        setUltimaObraSocial(ultimaObraSocialData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleConsultaCreated = (nuevaConsulta: Consulta) => {
    setConsultas([nuevaConsulta, ...consultas]);
  };

  const handleConsultaUpdated = (consultaActualizada: Consulta) => {
    setConsultas(
      consultas.map((c) =>
        c.idConsulta === consultaActualizada.idConsulta ? consultaActualizada : c
      )
    );
  };

  const handleLoadMore = async (from?: Date, to?: Date) => {
    try {
      setError(null);

      // Construir URL con parámetros de fecha
      const url = new URL(`/api/pacientes/${id}/consultas`, window.location.origin);
      if (from) {
        url.searchParams.set("from", from.toISOString());
      }
      if (to) {
        url.searchParams.set("to", to.toISOString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("No se pudo cargar las consultas");

      const data = await response.json();
      setConsultas(data.consultas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar consultas");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-cyan-600 animate-spin" />
          <p className="text-muted-foreground">Cargando historia clínica...</p>
        </div>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
        <Link href="/pacientes">
          <Button variant="outline" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error al cargar
          </h3>
          <p className="text-red-600">{error || "Paciente no encontrado"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-6">
      {/* Header - Responsive */}
      <div className="bg-white rounded-lg p-4 shadow-sm border-cyan-200 border">
        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 ">
          <Link href="/pacientes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground text-center md:flex-1 md:text-center">
            Historia Clínica
          </h1>
          <div className="hidden md:block w-20" />
        </div>
      </div>

      {/* Datos del Paciente */}
      <Card className="border-cyan-200 from-cyan-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-cyan-900">Datos del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-lg font-semibold text-foreground">
                {paciente.nombrePaciente} {paciente.apellidoPaciente}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                DNI
              </p>
              <p className="text-lg font-semibold text-foreground">
                {paciente.dniPaciente}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </p>
              <p className="text-lg font-semibold text-foreground">
                {formatPhoneNumber(paciente.telefonoPaciente)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Domicilio
              </p>
              <p className="text-lg font-semibold text-foreground">
                {paciente.domicilioPaciente || "No registrado"}
              </p>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Estado
              </p>
              <Badge
                className={
                  paciente.estadoPaciente
                    ? "bg-cyan-100 text-cyan-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {paciente.estadoPaciente ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Registrado
              </p>
              <p className="text-sm text-foreground">
                {formatFechaAR(paciente.fechaHoraPaciente)}
              </p>
            </div>
          </div>

          {/* Última Obra Social Utilizada */}
          <div className="md:col-span-2 pt-4 border-t border-cyan-200">
            <h4 className="text-sm font-semibold text-cyan-900 mb-4">
              Última Obra Social Utilizada
            </h4>
            {ultimaObraSocial?.ultimaObraSocial ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Obra Social
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {ultimaObraSocial.ultimaObraSocial.nombreObraSocial}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Nro. de Afiliado
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {ultimaObraSocial.nroAfiliado || "No registrado"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No hay consultas con obra social registradas
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-cyan-200" />

      {/* Grid: Formulario + Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario de Nueva Consulta - En mobile aparece primero (order-first en lg), 2 columnas en lg */}
        <div className="lg:col-span-2 lg:order-2">
          <RegistrarConsultaForm
            idPaciente={paciente.idPaciente}
            onConsultaCreated={handleConsultaCreated}
            ultimaObraSocial={ultimaObraSocial}
          />
        </div>

        {/* Historial de Consultas - Ocupará 3 columnas en pantallas grandes */}
        <div className="lg:col-span-3 lg:order-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Historial de Consultas
            </h2>
            <p className="text-sm text-muted-foreground">
              Mostrando últimos 6 meses desde la última consulta
            </p>
          </div>
          <HistorialConsultasLista
            consultas={consultas}
            idPaciente={paciente.idPaciente}
            onLoadMore={handleLoadMore}
            onConsultaUpdated={handleConsultaUpdated}
          />
        </div>
      </div>
    </div>
  );
}

export default function HistoriaClinicaPage() {
  return (
    <ProtectedPage>
      <PacienteDetailContent />
    </ProtectedPage>
  );
}
