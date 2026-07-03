export type EventType =
  | 'OPERATION'
  | 'ALLERGY'
  | 'EXAM_RESULT'
  | 'VACCINE'
  | 'DEWORMING'
  | 'MEDICAL_NOTE'

export type AppointmentType =
  | 'CHECK_UP'
  | 'VACCINE'
  | 'SURGERY'
  | 'DEWORMING'
  | 'OTHER'

export interface PetSummary {
  id: number
  name: string
  species: string
  breed: string | null
  photoUrl: string | null
}

export interface PetEvent {
  id: number
  eventType: EventType
  title: string
  date: string           // 'yyyy-MM-dd'
  description: string | null
  clinicOrVet: string | null
}

export interface PetEventRequest {
  eventType: EventType
  title: string
  date: string
  description?: string
  clinicOrVet?: string
}

export interface Appointment {
  id: number
  appointmentType: AppointmentType
  dateTime: string       // 'yyyy-MM-ddTHH:mm'
  clinicOrDoctor: string
  notes: string | null
}

export interface AppointmentRequest {
  appointmentType: AppointmentType
  dateTime: string
  clinicOrDoctor: string
  notes?: string
}

// ── Display label helpers ──────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  OPERATION: 'Operation',
  ALLERGY: 'Allergy',
  EXAM_RESULT: 'Exam Result',
  VACCINE: 'Vaccine',
  DEWORMING: 'Deworming',
  MEDICAL_NOTE: 'Medical Note',
}

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  CHECK_UP: 'Check-up',
  VACCINE: 'Vaccine',
  SURGERY: 'Surgery',
  DEWORMING: 'Deworming',
  OTHER: 'Other',
}

export const ALL_EVENT_TYPES: EventType[] = [
  'OPERATION',
  'ALLERGY',
  'EXAM_RESULT',
  'VACCINE',
  'DEWORMING',
  'MEDICAL_NOTE',
]

export const ALL_APPOINTMENT_TYPES: AppointmentType[] = [
  'CHECK_UP',
  'VACCINE',
  'SURGERY',
  'DEWORMING',
  'OTHER',
]
