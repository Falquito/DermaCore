import type { PacienteConObras } from "@/types/pacienteConObras";
import type { CreatePacienteDto } from "@/app/api/pacientes/dto/create-paciente.dto";
import type { UpdatePacienteDto } from "@/app/api/pacientes/dto/update-paciente.dto";

import { CreateObraSocialDto } from "@/app/api/obras-sociales/dto/create-obra-social.dto";
import { UpdateObraSocialDto } from "@/app/api/obras-sociales/dto/update-obra-social.dto";
import { ObraSocial } from "@/types/obraSocial";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Coseguro } from "@/types/coseguro";
import { CreateCoseguroDto } from "@/app/api/coseguro/dto/create-coseguro.dto";
import { UpdateCoseguroDto } from "@/app/api/coseguro/dto/update-coseguro.dto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//Coseguros

export async function fetchCoseguros(): Promise<Coseguro[]> {
  const request = await fetch("/api/coseguro");
  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function createCoseguro(createCoseguroDto: CreateCoseguroDto) {
  const { nombreCoseguro } = createCoseguroDto;
  const request = await fetch("api/coseguro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nombreCoseguro }),
  });

  const response = await request.json();

  if (response.error) throw new Error(response.error);
  return response;
}
export async function updateCoseguro(updateCoseguroDto: UpdateCoseguroDto) {
  const { nombreCoseguro, id } = updateCoseguroDto;
  const request = await fetch(`api/coseguro/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nombreCoseguro }),
  });

  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function deleteCoseguro(id: number) {
  const request = await fetch(`api/coseguro/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await request.json();
  console.log(response);
  if (response.error) throw new Error(response.error);
  return response;
}
// Obras Sociales

export async function fetchObrasApi(): Promise<ObraSocial[]> {
  const request = await fetch("/api/obras-sociales");
  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function createObraSocial(
  createObraSocialDto: CreateObraSocialDto,
) {
  const { nombreObraSocial, admiteCoseguro } = createObraSocialDto;
  const request = await fetch("api/obras-sociales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombreObraSocial,
      admiteCoseguro,
    }),
  });

  const response = await request.json();

  if (response.error) throw new Error(response.error);
  return response;
}

export async function updateObraSocial(updateObraSocial: UpdateObraSocialDto) {
  const { nombreObraSocial, id, admiteCoseguro } = updateObraSocial;
  const request = await fetch(`api/obras-sociales/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombreObraSocial,
      admiteCoseguro,
    }),
  });

  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function deleteObraSocial(id: number) {
  const request = await fetch(`api/obras-sociales/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const response = await request.json();
  console.log(response);
  if (response.error) throw new Error(response.error);
  return response;
}

export function formatFechaArgentina(
  fechaInput: string | Date | null | undefined,
): string {
  if (!fechaInput) return "-";

  let fecha: Date;

  if (typeof fechaInput === "string") {
    if (fechaInput.includes(" ") && !fechaInput.includes("T")) {
      fecha = new Date(fechaInput.replace(" ", "T") + "Z");
    } else {
      fecha = new Date(fechaInput);
    }
  } else {
    fecha = fechaInput;
  }

  if (isNaN(fecha.getTime())) {
    return "Fecha inválida";
  }

  try {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(fecha);
  } catch {
    return "Error fecha";
  }
}

// Pacientes

export async function fetchPacientesApi(): Promise<PacienteConObras[]> {
  const request = await fetch("/api/pacientes");
  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function createPaciente(createPacienteDto: CreatePacienteDto) {
  const request = await fetch("api/pacientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPacienteDto),
  });

  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function updatePaciente(
  updatePacienteDto: UpdatePacienteDto & { id: number },
) {
  const { id, ...payload } = updatePacienteDto;
  const request = await fetch(`api/pacientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function deletePaciente(id: number) {
  const request = await fetch(`api/pacientes/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export async function setEstadoPaciente(
  id: number,
  estadoPaciente: boolean,
): Promise<PacienteConObras> {
  const request = await fetch(`api/pacientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estadoPaciente }),
  });

  const response = await request.json();
  if (response.error) throw new Error(response.error);
  return response;
}

export function formatFechaHoraAR(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatFechaAR(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatFechaNacimientoAR(
  isoOrNull: string | null | undefined,
): string {
  if (!isoOrNull) return "—";
  const d = new Date(isoOrNull);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
