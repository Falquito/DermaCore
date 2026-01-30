"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Props = {
  isLoading?: boolean;
  mesActual?: number;
  mesAnterior?: number;
  variacionPct?: number | null;
};

function pctLabel(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v}%`;
}

function cambioLabel(delta: number) {
  if (delta > 0) return `Aumentó en ${delta} consultas`;
  if (delta < 0) return `Bajó en ${Math.abs(delta)} consultas`;
  return "Sin cambios";
}

export default function VariacionConsultasCard({
  isLoading = false,
  mesActual = 0,
  mesAnterior = 0,
  variacionPct = null,
}: Props) {
  const CYAN = "#0891b2";
  const CYAN_SOFT = "rgba(8,145,178,0.22)";

  const deltaAbs = mesActual - mesAnterior;

  const chartData = [
    { name: "Anterior", value: mesAnterior, fill: CYAN_SOFT },
    { name: "Actual", value: mesActual, fill: CYAN },
  ];

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Comparación de Consultas (Mes)</CardTitle>

        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
            <span className="mr-1 font-medium">Mes</span>
            {pctLabel(variacionPct)}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-1 flex flex-col gap-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : (
          <>
            <div>
              <div className="text-lg font-semibold leading-none">
                {cambioLabel(deltaAbs)}
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                Actual: <span className="font-medium">{mesActual}</span> · Anterior:{" "}
                <span className="font-medium">{mesAnterior}</span>
                {variacionPct === null ? " · sin base de comparación" : ""}
              </div>
            </div>

            <div className="flex-1 min-h-[11rem] rounded-md border bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 20, bottom: 0, left: 20 }}
                  barCategoryGap={32}
                >
                  <CartesianGrid vertical={false} stroke={CYAN_SOFT} />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 13, fill: CYAN }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={0}
                    height={20}
                  />

                  <YAxis
                    hide
                    domain={[
                      0,
                      (max: number) =>
                        Math.max(3, Number.isFinite(max) ? max + 2 : 3),
                    ]}
                  />

                  <Tooltip
                    cursor={{ fill: "rgba(8,145,178,0.12)" }}
                    formatter={(value) => [`${value}`, "Cantidad"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${CYAN_SOFT}`,
                      background: "#ffffff",
                    }}
                    labelStyle={{ color: CYAN, fontWeight: 600 }}
                  />

                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={72} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-1 text-xs text-muted-foreground">
              Comparación mensual entre el total del mes actual y el mes anterior.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
