"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Serie = { date: string; count: number | string };

type Props = {
  isLoading?: boolean;
  totalNuevos30d?: number;
  serieNuevos30d?: Serie[];
};

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatDateShort(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS_ES[d.getMonth()] ?? "??";
  return `${day}-${mon}`;
}

export default function PacientesNuevos30DiasCard({
  isLoading = false,
  totalNuevos30d = 0,
  serieNuevos30d = [],
}: Props) {
  const data = (serieNuevos30d ?? []).map((d) => ({
    date: d.date,
    count: Number(d.count),
  }));

  const hasData = data.length > 0;

  const CYAN = "#0891b2";
  const CYAN_SOFT = "rgba(8,145,178,0.18)";

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-0">
        <CardTitle className="text-xl">
          Pacientes Nuevos (últimos 30 días)
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <div className="text-3xl font-semibold leading-none">
                {totalNuevos30d}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Altas registradas en los últimos 30 días.
              </div>
            </div>

            <div className="h-44 rounded-md border bg-white">
              {!hasData ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Sin datos para mostrar
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 10, right: 12, bottom: 14, left: 12 }}
                    barCategoryGap={2}
                  >
                    <CartesianGrid vertical={false} stroke={CYAN_SOFT} />

                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateShort}
                      tick={{ fontSize: 11, fill: CYAN }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={14}
                      dy={6}  
                    />

                    <YAxis
                      hide
                      domain={[
                        0,
                        (max: number) =>
                          Math.max(3, Number.isFinite(max) ? max + 1 : 3),
                      ]}
                    />

                    <Tooltip
                      cursor={{ fill: CYAN_SOFT }}
                      formatter={(value) => [`${value}`, "Cantidad"]}
                      labelFormatter={(label) => formatDateShort(label)}
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${CYAN_SOFT}`,
                        background: "#ffffff",
                      }}
                      labelStyle={{ color: CYAN, fontWeight: 600 }}
                    />

                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      fill={CYAN}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-1 text-xs text-muted-foreground">
              Distribución diaria (los días sin altas aparecen como 0).
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
