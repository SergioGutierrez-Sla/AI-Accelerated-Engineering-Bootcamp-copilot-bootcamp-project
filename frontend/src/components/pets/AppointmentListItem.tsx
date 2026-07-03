import type { Appointment } from '../../types/pet'
import { APPOINTMENT_TYPE_LABELS } from '../../types/pet'

interface AppointmentListItemProps {
  appointment: Appointment
  onEdit: (appointment: Appointment) => void
  onDelete: (appointment: Appointment) => void
}

function isPast(dateTime: string): boolean {
  return new Date(dateTime) < new Date()
}

export function AppointmentListItem({
  appointment,
  onEdit,
  onDelete,
}: AppointmentListItemProps) {
  const past = isPast(appointment.dateTime)

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border p-4 shadow-sm ${
        past
          ? 'border-gray-100 bg-gray-50 opacity-70'
          : 'border-blue-50 bg-white'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              past ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {APPOINTMENT_TYPE_LABELS[appointment.appointmentType]}
          </span>
          <span className="text-xs text-gray-400">
            {appointment.dateTime.replace('T', ' at ')}
          </span>
          {past && (
            <span className="text-xs text-gray-400">(past)</span>
          )}
        </div>
        <p className="truncate font-medium !text-gray-900">📍 {appointment.clinicOrDoctor}</p>
        {appointment.notes && (
          <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{appointment.notes}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onEdit(appointment)}
          aria-label={`Edit appointment at ${appointment.clinicOrDoctor}`}
          className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(appointment)}
          aria-label={`Delete appointment at ${appointment.clinicOrDoctor}`}
          className="rounded-md border border-red-100 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
