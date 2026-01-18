"use client";

import { useState } from "react";

import HeaderPacientes from "@/components/pacientes/headerPacientes";
import SearcherPacientes from "@/components/pacientes/searcherPacientes";
import ListaPacientes from "@/components/pacientes/listaPacientes";
import SkeletonListPacientes from "@/components/pacientes/skeletonListPacientes";
import EmptyStatePacientes from "@/components/pacientes/emptyStatePacientes";
import CreatePacienteModal from "@/components/pacientes/createPacienteModal";
import PacientesPagination from "@/components/pacientes/pacientesPagination";
import NotifySuccessPaciente from "@/components/pacientes/notifySuccessPaciente";

import FiltroEstadoPacientes, { EstadoPacienteFilter } from "@/components/pacientes/filtroEstadoPacientes";

import { usePacientesQuery } from "@/hooks/usePacienteQuery";

type SuccessToast = {
  open: boolean;
  title: string;
  description: string;
};

export default function PacientePage() {
  const [q, setQ] = useState("");

  // ✅ default Activos
  const [estado, setEstado] = useState<EstadoPacienteFilter>("true");

  const [successToast, setSuccessToast] = useState<SuccessToast>({
    open: false,
    title: "",
    description: "",
  });

  const showSuccess = (title: string, description: string) => {
    setSuccessToast({ open: true, title, description });
    setTimeout(() => {
      setSuccessToast((prev) => ({ ...prev, open: false }));
    }, 2000);
  };

  const {
    pacientes,
    loading,
    error,
    refrescar,

    page,
    setPage,
    totalPages,
    total,
  } = usePacientesQuery(q, 12, estado);

  const sinResultados = !loading && !error && pacientes.length === 0;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <NotifySuccessPaciente
        open={successToast.open}
        title={successToast.title}
        description={successToast.description}
      />

      <HeaderPacientes />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <SearcherPacientes value={q} onChange={setQ} disabled={loading} />
          
          <div className="w-full sm:w-[320px]">
            <FiltroEstadoPacientes
              value={estado}
              onChange={setEstado}
              disabled={loading}
            />
          </div>
        </div>

        <CreatePacienteModal
          onCreated={refrescar}
          onSuccess={() => showSuccess("Éxito", "El paciente fue creado correctamente.")}
        />
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
            onEditSuccess={() =>
              showSuccess("Éxito", "El paciente fue actualizado correctamente.")
            }
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
