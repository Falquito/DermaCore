"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Serie = { date: string; count: number | string };

type Props = {
  isLoading?: boolean;

  totalUltimos30d?: number;
  promedioDiario30d?: number;
  maxDiario30d?: number;
  tendencia7dPct?: number | null;

  serieUltimos30Dias?: Serie[];
};

const MONTHS_ES = [
  "ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"
];

function formatDateShort(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS_ES[d.getMonth()] ?? "??";
  return `${day}-${mon}`;
}

function pctLabel(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${v > 0 ? "+" : ""}${v}%`;
}

export default function ConsultasMesCard({
  isLoading = false,
  totalUltimos30d = 0,
  promedioDiario30d = 0,
  maxDiario30d = 0,
  tendencia7dPct = null,
  serieUltimos30Dias = [],
}: Props) {
  const data = (serieUltimos30Dias ?? []).map((p) => ({
    date: p.date,
    count: Number(p.count),
  }));

  const CYAN = "#0891b2";
  const CYAN_SOFT = "rgba(8,145,178,0.18)";

  const isUp = tendencia7dPct !== null && tendencia7dPct > 5;
  const isDown = tendencia7dPct !== null && tendencia7dPct < -5;
  const isFlat = tendencia7dPct === null || (!isUp && !isDown);

  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const badgeClasses = isUp
    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    : isDown
    ? "bg-rose-100 text-rose-700 hover:bg-rose-100"
    : "bg-slate-100 text-slate-700 hover:bg-slate-100";

  const badgeTitle =
    "Comparación del promedio diario de consultas de la semana actual con la semana anterior";

  const trendLabel =
    tendencia7dPct === null
      ? "Tendencia (se necesitan más datos)"
      : isUp
      ? `Tendencia al alza (${pctLabel(tendencia7dPct)})`
      : isDown
      ? `Tendencia a la baja (${pctLabel(tendencia7dPct)})`
      : `Tendencia estable (${pctLabel(tendencia7dPct)})`;

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Consultas Realizadas (Últimos 30 días)
          </CardTitle>

          {isLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <Badge className={badgeClasses} title={badgeTitle}>
              <span className="mr-1 font-medium">Semana actual</span>
              <TrendIcon className="mr-1 h-4 w-4" />
              {pctLabel(tendencia7dPct)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <div className="text-3xl font-semibold tracking-tight leading-none">
                {totalUltimos30d}
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                Total últimos 30 días · Promedio:{" "}
                <span className="font-medium">{promedioDiario30d}</span>/día · Máx día:{" "}
                <span className="font-medium">{maxDiario30d}</span>
              </div>
            </div>

            <div className="h-32 rounded-md border bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 10, right: 12, bottom: 14, left: 12 }}
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

                  <YAxis hide domain={[0, (m: number) => Math.max(3, m + 1)]} />

                  <Tooltip
                    cursor={{ stroke: CYAN_SOFT }}
                    formatter={(value) => [`${value}`, "Cantidad"]}
                    labelFormatter={(label) => formatDateShort(String(label))}
                    contentStyle={{
                      borderRadius: 10,
                      border: `1px solid ${CYAN_SOFT}`,
                      background: "#ffffff",
                    }}
                    labelStyle={{ color: CYAN, fontWeight: 600 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CYAN}
                    strokeWidth={3}
                    dot={false}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    isAnimationActive={false}
                    activeDot={{
                      r: 4,
                      fill: CYAN,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <TrendIcon className="h-4 w-4" style={{ color: CYAN }} />
              <span>{trendLabel}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
