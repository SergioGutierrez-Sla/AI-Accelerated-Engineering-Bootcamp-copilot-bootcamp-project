import type { PetEvent } from '../../types/pet'
import { EVENT_TYPE_LABELS } from '../../types/pet'

interface EventListItemProps {
  event: PetEvent
  onEdit: (event: PetEvent) => void
  onDelete: (event: PetEvent) => void
}

export function EventListItem({ event, onEdit, onDelete }: EventListItemProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {EVENT_TYPE_LABELS[event.eventType]}
          </span>
          <span className="text-xs text-gray-400">{event.date}</span>
        </div>
        <p className="truncate font-medium !text-gray-900">{event.title}</p>
        {event.description && (
          <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{event.description}</p>
        )}
        {event.clinicOrVet && (
          <p className="mt-0.5 text-xs text-gray-400">📍 {event.clinicOrVet}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onEdit(event)}
          aria-label={`Edit ${event.title}`}
          className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(event)}
          aria-label={`Delete ${event.title}`}
          className="rounded-md border border-red-100 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
