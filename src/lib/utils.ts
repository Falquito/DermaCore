import type { PacienteConObras } from "@/types/pacienteConObras";
import type { CreatePacienteDto } from "@/app/api/pacientes/dto/create-paciente.dto";
import type { UpdatePacienteDto } from "@/app/api/pacientes/dto/update-paciente.dto";

import { CreateObraSocialDto } from "@/app/api/obras-sociales/dto/create-obra-social.dto"
import { UpdateObraSocialDto } from "@/app/api/obras-sociales/dto/update-obra-social.dto"
import { ObraSocial } from "@/types/obraSocial"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Obras Sociales

export async function fetchObrasApi(): Promise<ObraSocial[]> {
    const request = await fetch("/api/obras-sociales")
    const response = await request.json()
    if(response.error) throw new Error(response.error)
    return response
}


export async function createObraSocial(createObraSocialDto:CreateObraSocialDto){
  const {nombreObraSocial} = createObraSocialDto
  const request = await fetch("api/obras-sociales",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({nombreObraSocial:nombreObraSocial})
  })

  const response = await request.json()

  if(response.error) throw new Error(response.error)
  return response

}

export async function updateObraSocial(updateObraSocial:UpdateObraSocialDto){
  const {nombreObraSocial,id} = updateObraSocial
  const request = await fetch(`api/obras-sociales/${id}`,{
    method:"PATCH",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({nombreObraSocial:nombreObraSocial})
  })

  const response = await request.json()
  if(response.error) throw new Error(response.error)
  return response

}

export async function deleteObraSocial(id:number){
  const request = await fetch(`api/obras-sociales/${id}`,{
    method:"DELETE",
    headers:{
      "Content-Type":"application/json"
    }
  })

  const response = await request.json()
  console.log(response)
  if(response.error) throw new Error(response.error)
  return response

}

export function formatFechaArgentina(fechaInput: string | Date | null | undefined): string {
  // 1. Si no hay dato, devolvemos un guion
  if (!fechaInput) return "-";

  let fecha: Date;

  // 2. Normalización inteligente
  if (typeof fechaInput === 'string') {
    // Caso A: Viene como "2026-01-14 22:50:57" (SQL standard) -> Lo convertimos a ISO UTC
    if (fechaInput.includes(' ') && !fechaInput.includes('T')) {
      fecha = new Date(fechaInput.replace(" ", "T") + "Z");
    } 
    // Caso B: Viene como "2026-01-14T22:50:57.000Z" (ISO standard) -> JS lo entiende directo
    else {
      fecha = new Date(fechaInput);
    }
  } else {
    // Caso C: Ya es un objeto Date
    fecha = fechaInput;
  }

  // 3. ¡VALIDACIÓN CRÍTICA! 
  // Verificamos si la fecha es válida. Si es "Invalid Date", getTime() devuelve NaN.
  if (isNaN(fecha.getTime())) {
    return "Fecha inválida"; 
  }

  // 4. Formateamos si todo está bien
  try {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false 
    }).format(fecha);
  } catch (error) {
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

export async function updatePaciente(updatePacienteDto: UpdatePacienteDto & { id: number }) {
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

export async function setEstadoPaciente(id: number, estadoPaciente: boolean): Promise<PacienteConObras> {
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
