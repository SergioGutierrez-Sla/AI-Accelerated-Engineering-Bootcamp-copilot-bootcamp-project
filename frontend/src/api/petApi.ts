import { apiClient } from './authApi'
import type {
  PetSummary,
  PetEvent,
  PetEventRequest,
  Appointment,
  AppointmentRequest,
} from '../types/pet'

// ── Pet ───────────────────────────────────────────────────────────────────────

export async function getPet(petId: number): Promise<PetSummary> {
  const response = await apiClient.get<PetSummary>(`/api/pets/${petId}`)
  return response.data
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function listEvents(petId: number): Promise<PetEvent[]> {
  const response = await apiClient.get<PetEvent[]>(`/api/pets/${petId}/events`)
  return response.data
}

export async function createEvent(petId: number, data: PetEventRequest): Promise<PetEvent> {
  const response = await apiClient.post<PetEvent>(`/api/pets/${petId}/events`, data)
  return response.data
}

export async function updateEvent(
  petId: number,
  eventId: number,
  data: PetEventRequest,
): Promise<PetEvent> {
  const response = await apiClient.put<PetEvent>(`/api/pets/${petId}/events/${eventId}`, data)
  return response.data
}

export async function deleteEvent(petId: number, eventId: number): Promise<void> {
  await apiClient.delete(`/api/pets/${petId}/events/${eventId}`)
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function listAppointments(petId: number): Promise<Appointment[]> {
  const response = await apiClient.get<Appointment[]>(`/api/pets/${petId}/appointments`)
  return response.data
}

export async function createAppointment(
  petId: number,
  data: AppointmentRequest,
): Promise<Appointment> {
  const response = await apiClient.post<Appointment>(`/api/pets/${petId}/appointments`, data)
  return response.data
}

export async function updateAppointment(
  petId: number,
  appointmentId: number,
  data: AppointmentRequest,
): Promise<Appointment> {
  const response = await apiClient.put<Appointment>(
    `/api/pets/${petId}/appointments/${appointmentId}`,
    data,
  )
  return response.data
}

export async function deleteAppointment(petId: number, appointmentId: number): Promise<void> {
  await apiClient.delete(`/api/pets/${petId}/appointments/${appointmentId}`)
}
