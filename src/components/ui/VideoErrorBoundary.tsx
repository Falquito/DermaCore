"use client"
import React from "react";

class VideoErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Si el error es el de "provider destroyed" o "AbortError", lo ignoramos visualmente
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Solo logueamos si NO es el error conocido de Vidstack para no ensuciar la consola
    if (!error.message?.includes("provider destroyed") && error.name !== "AbortError") {
      console.error("Error en reproductor:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Cuando falla al desmontar, mostramos un div vacío para que no rompa la UI
      return <div className="aspect-video bg-slate-900 rounded-xl" />;
    }
    return this.props.children;
  }
}

export default VideoErrorBoundary;