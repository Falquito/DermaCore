import { useState, useEffect } from "react";
import type { Paciente } from "@/types/paciente";
import { fetchPacientesApi } from "@/lib/utils";

export function usePacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = async () => {
    setLoading(true);
    try {
      const data = await fetchPacientesApi();
      setPacientes(data);
      setError(null);
    } catch (_error) {
      setError("Error al cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refrescar();
  }, []);

  return { pacientes, loading, error, refrescar };
}
