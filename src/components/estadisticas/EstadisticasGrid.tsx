"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useEstadisticasHome } from "@/hooks/useEstadisticasHome";

import ConsultasMesCard from "@/components/estadisticas/ConsultasMesCard";
import VariacionConsultasCard from "@/components/estadisticas/VariacionConsultasCard";
import PacientesNuevos30DiasCard from "@/components/estadisticas/PacientesNuevos30DiasCard";
import PacientesActivosInactivosCard from "./pacientesActivosInactivosCard";

export default function EstadisticasGrid() {
  const { data, isLoading, error, refetch } = useEstadisticasHome();

  return (
    <section className="space-y-6">

      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-xl font-semibold tracking-tight">Estadísticas</h2>
          <p className="text-sm text-muted-foreground">
            Resumen general del sistema en base a los últimos datos.
          </p>
        </div>

        <Button variant="outline" onClick={refetch} disabled={isLoading}>
          Actualizar
        </Button>
      </div>

      {error && !isLoading ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">
              No se pudieron cargar las estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={refetch}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PacientesActivosInactivosCard
          isLoading={isLoading}
          activos={data?.pacientes.activos ?? 0}
          inactivos={data?.pacientes.inactivos ?? 0}
        />

        <ConsultasMesCard
          isLoading={isLoading}
          totalUltimos30d={data?.consultas.totalUltimos30d ?? 0}
          promedioDiario30d={data?.consultas.promedioDiario30d ?? 0}
          maxDiario30d={data?.consultas.maxDiario30d ?? 0}
          tendencia7dPct={data?.consultas.tendencia7dPct ?? null}
          serieUltimos30Dias={data?.series.consultasUltimos30Dias ?? []}
        />

        <VariacionConsultasCard
          isLoading={isLoading}
          mesActual={data?.consultas.mesActual ?? 0}
          mesAnterior={data?.consultas.mesAnterior ?? 0}
          variacionPct={data?.consultas.variacionPct ?? null}
        />

        <PacientesNuevos30DiasCard
          isLoading={isLoading}
          totalNuevos30d={data?.resumen.pacientesNuevos30d ?? 0}
          serieNuevos30d={data?.series.pacientesNuevosUltimos30Dias ?? []}
        />
      </div>
    </section>
  );
}
