"use client";

import { useEffect, useState } from "react";

function toPreview(text: string, max = 120) {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "Sin observaciones.";
  return t.length > max ? t.slice(0, max) + "…" : t;
}

export default function ObservacionPreviewInline({
  appointmentId,
  active,
  renderLabel = true, // 👈 NUEVO
}: {
  appointmentId: string;
  active: boolean;
  renderLabel?: boolean;
}) {
  const [preview, setPreview] = useState<string>("");

  async function fetchPreview() {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/observaciones`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPreview(toPreview(data?.text ?? ""));
      } else if (res.status === 404) {
        setPreview("Sin observaciones.");
      } else {
        setPreview("Sin observaciones.");
      }
    } catch {
      setPreview("Sin observaciones.");
    }
  }

  useEffect(() => {
    if (!active || !appointmentId) return;
    fetchPreview();
  }, [appointmentId, active]);

  // refrescar cuando el editor guarda
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id === appointmentId) fetchPreview();
    };
    window.addEventListener("obs:saved", handler as EventListener);
    return () => window.removeEventListener("obs:saved", handler as EventListener);
  }, [appointmentId]);

  if (!active) return null;

  if (renderLabel) {
    return (
      <div className="mt-2 text-sm text-gray-700">
        <span className="font-medium">Observación: </span>
        <span className="line-clamp-3">{preview}</span>
      </div>
    );
  }
  // 👇 solo el texto, sin etiqueta
  return <div className="text-sm text-gray-700">{preview}</div>;
}
