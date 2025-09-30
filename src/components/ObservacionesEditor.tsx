"use client";

import { useEffect, useState } from "react";

type Props = { appointmentId: string; className?: string };

export default function ObservacionesEditor({ appointmentId, className }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);    // solo para errores de GUARDAR
  const [loading, setLoading] = useState(true);

  // carga inicial (si 404 => simplemente texto vacío, sin cartel rojo)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/observaciones`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancel) {
            setText(data?.text ?? "");
            setSavedAt(data?.updatedAt ? new Date(data.updatedAt) : null);
            setDirty(false);
          }
        } else if (res.status === 404) {
          if (!cancel) {
            setText("");
            setSavedAt(null);
            setDirty(false);
          }
        } else {
          // otros errores -> no bloquear: deja el textarea vacío
          if (!cancel) {
            setText("");
            setSavedAt(null);
            setDirty(false);
          }
        }
      } catch {
        // red offline u otra falla: no muestres cartel, deja editar
        if (!cancel) {
          setText("");
          setSavedAt(null);
          setDirty(false);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [appointmentId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/observaciones`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Turno no encontrado");
        throw new Error("No se pudo guardar");
      }
      const data = await res.json();
      setSavedAt(data?.updatedAt ? new Date(data.updatedAt) : new Date());
      setDirty(false);

      // Notificar a la agenda (si está abierta) para refrescar el preview
      window.dispatchEvent(new CustomEvent("obs:saved", { detail: { id: appointmentId } }));
    } catch (e: any) {
      setError(e?.message || "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Observaciones de la consulta
      </label>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setDirty(true); }}
        onBlur={() => { if (dirty && !saving) handleSave(); }}   // autosave opcional al salir
        placeholder="Ingrese aquí las observaciones de la consulta..."
        disabled={loading}
        className="w-full min-h-[180px] resize-y rounded-xl border border-gray-300 p-3 text-sm
                   placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {savedAt && (
          <span className="text-xs text-gray-500">
            Último guardado: {savedAt.toLocaleString()}
          </span>
        )}

        {/* Solo mostramos error cuando falla GUARDAR */}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
