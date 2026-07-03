import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { extractApiError } from '../utils/apiError'

import { usePet } from '../api/hooks/usePet'
import { usePetEvents } from '../api/hooks/usePetEvents'
import { usePetAppointments } from '../api/hooks/usePetAppointments'
import { useCreateEvent } from '../api/hooks/useCreateEvent'
import { useUpdateEvent } from '../api/hooks/useUpdateEvent'
import { useDeleteEvent } from '../api/hooks/useDeleteEvent'
import { useCreateAppointment } from '../api/hooks/useCreateAppointment'
import { useUpdateAppointment } from '../api/hooks/useUpdateAppointment'
import { useDeleteAppointment } from '../api/hooks/useDeleteAppointment'

import { PetHeader } from '../components/pets/PetHeader'
import { EventListItem } from '../components/pets/EventListItem'
import { AppointmentListItem } from '../components/pets/AppointmentListItem'
import { EventFormModal } from '../components/pets/EventFormModal'
import { AppointmentFormModal } from '../components/pets/AppointmentFormModal'
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorAlert } from '../components/common/ErrorAlert'
import type { PetEvent, Appointment, PetEventRequest, AppointmentRequest } from '../types/pet'

type ActiveTab = 'events' | 'appointments'

interface EventModalState {
  open: boolean
  event: PetEvent | null
}

interface AppointmentModalState {
  open: boolean
  appointment: Appointment | null
}

interface DeleteModalState {
  open: boolean
  type: 'event' | 'appointment'
  id: number | null
  title: string
}

export function PetDetailPage() {
  const { petId: petIdParam } = useParams<{ petId: string }>()
  const petId = Number(petIdParam)
  const { user, logout } = useAuth()

  const [activeTab, setActiveTab] = useState<ActiveTab>('appointments')
  const [eventModal, setEventModal] = useState<EventModalState>({ open: false, event: null })
  const [appointmentModal, setAppointmentModal] = useState<AppointmentModalState>({
    open: false,
    appointment: null,
  })
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    open: false,
    type: 'event',
    id: null,
    title: '',
  })
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────────
  const petQuery = usePet(petId)
  const eventsQuery = usePetEvents(petId)
  const appointmentsQuery = usePetAppointments(petId)

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createEvent = useCreateEvent(petId)
  const updateEvent = useUpdateEvent(petId)
  const deleteEvent = useDeleteEvent(petId)
  const createAppointment = useCreateAppointment(petId)
  const updateAppointment = useUpdateAppointment(petId)
  const deleteAppointment = useDeleteAppointment(petId)

  // ── Event handlers ────────────────────────────────────────────────────────────

  function handleEventSubmit(data: PetEventRequest) {
    setMutationError(null)
    if (eventModal.event) {
      updateEvent.mutate(
        { eventId: eventModal.event.id, data },
        {
          onSuccess: () => setEventModal({ open: false, event: null }),
          onError: (err) => setMutationError(extractApiError(err)),
        },
      )
    } else {
      createEvent.mutate(data, {
        onSuccess: () => setEventModal({ open: false, event: null }),
        onError: (err) => setMutationError(extractApiError(err)),
      })
    }
  }

  function handleAppointmentSubmit(data: AppointmentRequest) {
    setMutationError(null)
    if (appointmentModal.appointment) {
      updateAppointment.mutate(
        { appointmentId: appointmentModal.appointment.id, data },
        {
          onSuccess: () => setAppointmentModal({ open: false, appointment: null }),
          onError: (err) => setMutationError(extractApiError(err)),
        },
      )
    } else {
      createAppointment.mutate(data, {
        onSuccess: () => setAppointmentModal({ open: false, appointment: null }),
        onError: (err) => setMutationError(extractApiError(err)),
      })
    }
  }

  function handleDeleteConfirm() {
    if (!deleteModal.id) return
    setDeleteError(null)

    if (deleteModal.type === 'event') {
      deleteEvent.mutate(deleteModal.id, {
        onSuccess: () => setDeleteModal({ open: false, type: 'event', id: null, title: '' }),
        onError: (err) => setDeleteError(extractApiError(err)),
      })
    } else {
      deleteAppointment.mutate(deleteModal.id, {
        onSuccess: () =>
          setDeleteModal({ open: false, type: 'appointment', id: null, title: '' }),
        onError: (err) => setDeleteError(extractApiError(err)),
      })
    }
  }

  // ── Error states ──────────────────────────────────────────────────────────────

  if (petQuery.isError) {
    const status = (petQuery.error as { response?: { status?: number } })?.response?.status
    const is403 = status === 403
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-md">
          <div className="mb-4 text-4xl">{is403 ? '🔒' : '🐾'}</div>
          <h2 className="mb-2 text-xl font-bold !text-gray-900">
            {is403 ? 'Access Denied' : 'Pet Not Found'}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {is403
              ? "You don't have permission to view this pet."
              : "We couldn't find this pet in your account."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to My Pets
          </Link>
        </div>
      </div>
    )
  }

  const eventIsLoading = createEvent.isPending || updateEvent.isPending
  const appointmentIsLoading = createAppointment.isPending || updateAppointment.isPending
  const deleteIsLoading = deleteEvent.isPending || deleteAppointment.isPending

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header */}
      <header className="border-b bg-blue-700 px-6 py-4 shadow-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-white">🐾 Pet Manager</h1>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-blue-100">{user.email}</span>}
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-white/40 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          ← My Pets
        </Link>

        {/* Pet header card */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-md">
          {petQuery.isPending ? (
            <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ) : petQuery.data ? (
            <PetHeader pet={petQuery.data} />
          ) : null}
        </div>

        {/* Tab bar */}
        <div className="mb-4 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {(['appointments', 'events'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'appointments' ? '📅 Appointments' : '📋 Health Events'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'appointments' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold !text-gray-900">Upcoming Appointments</h3>
              <button
                type="button"
                onClick={() => {
                  setMutationError(null)
                  setAppointmentModal({ open: true, appointment: null })
                }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Schedule
              </button>
            </div>

            {appointmentsQuery.isError && (
              <ErrorAlert
                message={extractApiError(appointmentsQuery.error)}
                onDismiss={() => appointmentsQuery.refetch()}
              />
            )}

            {appointmentsQuery.isPending ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : appointmentsQuery.data?.length === 0 ? (
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                <EmptyState
                  icon="📅"
                  message="No appointments scheduled yet"
                  hint="Schedule your pet's next check-up, vaccine, or other visit."
                  action={
                    <button
                      type="button"
                      onClick={() => setAppointmentModal({ open: true, appointment: null })}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Schedule first appointment
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {appointmentsQuery.data?.map((a) => (
                  <AppointmentListItem
                    key={a.id}
                    appointment={a}
                    onEdit={(appt) => {
                      setMutationError(null)
                      setAppointmentModal({ open: true, appointment: appt })
                    }}
                    onDelete={(appt) => {
                      setDeleteError(null)
                      setDeleteModal({
                        open: true,
                        type: 'appointment',
                        id: appt.id,
                        title: `${APPOINTMENT_TYPE_LABELS_INLINE[appt.appointmentType]} at ${appt.clinicOrDoctor}`,
                      })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold !text-gray-900">Health History</h3>
              <button
                type="button"
                onClick={() => {
                  setMutationError(null)
                  setEventModal({ open: true, event: null })
                }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Record Event
              </button>
            </div>

            {eventsQuery.isError && (
              <ErrorAlert
                message={extractApiError(eventsQuery.error)}
                onDismiss={() => eventsQuery.refetch()}
              />
            )}

            {eventsQuery.isPending ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : eventsQuery.data?.length === 0 ? (
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                <EmptyState
                  icon="📋"
                  message="No health events recorded yet"
                  hint="Record vaccines, vet visits, allergies, and more."
                  action={
                    <button
                      type="button"
                      onClick={() => setEventModal({ open: true, event: null })}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Record first event
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {eventsQuery.data?.map((ev) => (
                  <EventListItem
                    key={ev.id}
                    event={ev}
                    onEdit={(e) => {
                      setMutationError(null)
                      setEventModal({ open: true, event: e })
                    }}
                    onDelete={(e) => {
                      setDeleteError(null)
                      setDeleteModal({
                        open: true,
                        type: 'event',
                        id: e.id,
                        title: e.title,
                      })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <EventFormModal
        isOpen={eventModal.open}
        onClose={() => setEventModal({ open: false, event: null })}
        onSubmit={handleEventSubmit}
        isLoading={eventIsLoading}
        apiError={mutationError}
        event={eventModal.event}
      />

      <AppointmentFormModal
        isOpen={appointmentModal.open}
        onClose={() => setAppointmentModal({ open: false, appointment: null })}
        onSubmit={handleAppointmentSubmit}
        isLoading={appointmentIsLoading}
        apiError={mutationError}
        appointment={appointmentModal.appointment}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.title}
        isLoading={deleteIsLoading}
        error={deleteError}
      />
    </div>
  )
}

// Inline labels for the delete modal description (avoids import cycle)
const APPOINTMENT_TYPE_LABELS_INLINE: Record<string, string> = {
  CHECK_UP: 'Check-up',
  VACCINE: 'Vaccine',
  SURGERY: 'Surgery',
  DEWORMING: 'Deworming',
  OTHER: 'Appointment',
}
