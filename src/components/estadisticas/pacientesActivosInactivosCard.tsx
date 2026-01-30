"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  isLoading?: boolean;
  activos?: number;
  inactivos?: number;
};

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export default function PacientesActivosInactivosCard({
  isLoading = false,
  activos = 0,
  inactivos = 0,
}: Props) {
  const total = activos + inactivos;

  const data = [
    { name: "Activos", value: activos },
    { name: "Inactivos", value: inactivos },
  ];

  const CYAN = "#0891b2";
  const CYAN_SOFT = "rgba(8,145,178,0.25)";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">
          Pacientes Activos / Inactivos
        </CardTitle>

        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
            Total: {total}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 items-center">
            <Skeleton className="h-40 w-full rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Donut */}
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={3}
                    stroke="none"
                  >
                    <Cell fill={CYAN} />
                    <Cell fill={CYAN_SOFT} />
                  </Pie>

                  <Tooltip
                    formatter={(value) => [`${value}`, "Cantidad"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${CYAN_SOFT}`,
                      background: "#ffffff",
                    }}
                    labelStyle={{
                      color: CYAN,
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Leyenda */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CYAN }}
                  />
                  Activos
                </span>
                <span className="font-medium">
                  {activos} ({pct(activos, total)}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CYAN_SOFT }}
                  />
                  Inactivos
                </span>
                <span className="font-medium">
                  {inactivos} ({pct(inactivos, total)}%)
                </span>
              </div>

              <div className="pt-2 text-xs text-muted-foreground">
                Distribución de pacientes según su estado.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
