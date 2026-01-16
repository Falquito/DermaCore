"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type SkeletonListPacientesProps = {
  count?: number;
};

export default function SkeletonListPacientes({ count = 6 }: SkeletonListPacientesProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-xl border-muted/60">
          <CardContent className="p-6">
            {/* Header: nombre + badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Info rows */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>

              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-36" />
              </div>

              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>

            <Separator className="my-5" />

            {/* Última consulta */}
            <Skeleton className="h-3 w-40" />

            {/* Button */}
            <Skeleton className="mt-3 h-10 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
