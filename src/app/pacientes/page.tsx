"use client";

import { useState } from "react";

import HeaderPacientes from "@/components/pacientes/headerPacientes";
import SearcherPacientes from "@/components/pacientes/searcherPacientes";
import ListaPacientes from "@/components/pacientes/listaPacientes";
import SkeletonListPacientes from "@/components/pacientes/skeletonListPacientes";
import EmptyStatePacientes from "@/components/pacientes/emptyStatePacientes";
import CreatePacienteModal from "@/components/pacientes/createPacienteModal";
import PacientesPagination from "@/components/pacientes/pacientesPagination";

import { usePacientesQuery } from "@/hooks/usePacienteQuery";


export default function PacientePage() {
  const [q, setQ] = useState("");

  const {
    pacientes,
    loading,
    error,
    refrescar,

    // ✅ paginación
    page,
    setPage,
    totalPages,
    total,
  } = usePacientesQuery(q, 12);

  const sinResultados = !loading && !error && pacientes.length === 0;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <HeaderPacientes />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearcherPacientes value={q} onChange={setQ} disabled={loading} />
        <CreatePacienteModal onCreated={refrescar} />
      </div>

      {loading ? (
        <SkeletonListPacientes count={12} />
      ) : error ? (
        <div className="rounded-lg border bg-background p-4 text-sm text-red-600">
          {error}
        </div>
      ) : sinResultados ? (
        <EmptyStatePacientes q={q} />
      ) : (
        <>
          <ListaPacientes
            pacientes={pacientes}
            onVerHistoria={(id) => console.log("Ver historia", id)}
            onChanged={refrescar}
          />

          {totalPages > 1 ? (
            <PacientesPagination
              page={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
              disabled={loading}
            />
          ) : null} 
        </>
      )}
    </div>
  );
}
