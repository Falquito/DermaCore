"use client";

import { useEffect, useMemo, useState } from "react";
import type { PacienteConObras } from "@/types/pacienteConObras";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

type PacientesPagedResponse = {
  items: PacienteConObras[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function usePacientesQuery(q: string, pageSize: number = 12) {
  const [pacientes, setPacientes] = useState<PacienteConObras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ paginación
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const qDebounced = useDebouncedValue(q.trim(), 350);

  // ✅ cuando cambia la búsqueda, volvemos a la página 1
  useEffect(() => {
    setPage(1);
  }, [qDebounced]);

  const url = useMemo(() => {
    const params = new URLSearchParams();

    if (qDebounced) params.set("q", qDebounced);

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    return `/api/pacientes?${params.toString()}`;
  }, [qDebounced, page, pageSize]);

  const refrescar = async () => {
    setLoading(true);
    try {
      const res = await fetch(url);
      const data = (await res.json()) as PacientesPagedResponse & { error?: string };

      if ((data as any)?.error) throw new Error((data as any).error);

      // ✅ la API ahora devuelve { items, total, totalPages, ... }
      setPacientes(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setTotalPages(typeof data.totalPages === "number" ? data.totalPages : 1);
      setError(null);

      // ✅ si el usuario quedó en una página inexistente (por filtros), corregimos
      if (typeof data.totalPages === "number" && data.totalPages >= 1 && page > data.totalPages) {
        setPage(data.totalPages);
      }
    } catch {
      setError("Error al cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refrescar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return {
    pacientes,
    loading,
    error,
    refrescar,

    // ✅ paginación
    page,
    setPage,
    pageSize,
    total,
    totalPages,
  };
}
