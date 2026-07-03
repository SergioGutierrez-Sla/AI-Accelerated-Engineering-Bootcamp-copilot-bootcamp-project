import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { ErrorAlert } from '../common/ErrorAlert'
import type { PetEvent, PetEventRequest, EventType } from '../../types/pet'
import { ALL_EVENT_TYPES, EVENT_TYPE_LABELS } from '../../types/pet'

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'
const ERROR_CLASS = 'mt-1 text-xs text-red-600'

interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PetEventRequest) => void
  isLoading: boolean
  apiError: string | null
  /** Pass an existing event to edit; undefined for create mode. */
  event?: PetEvent | null
}

export function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  apiError,
  event,
}: EventFormModalProps) {
  const isEdit = Boolean(event)

  const [eventType, setEventType] = useState<EventType>('VACCINE')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [clinicOrVet, setClinicOrVet] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  // Pre-populate when editing
  useEffect(() => {
    if (event) {
      setEventType(event.eventType)
      setTitle(event.title)
      setDate(event.date)
      setDescription(event.description ?? '')
      setClinicOrVet(event.clinicOrVet ?? '')
    } else {
      setEventType('VACCINE')
      setTitle('')
      setDate('')
      setDescription('')
      setClinicOrVet('')
    }
    setFieldErrors({})
  }, [event, isOpen])

  function validate(): boolean {
    const errors: Partial<Record<string, string>> = {}
    if (!eventType) errors.eventType = 'Event type is required'
    if (!title.trim()) errors.title = 'Title is required'
    if (!date) errors.date = 'Date is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      eventType,
      title: title.trim(),
      date,
      description: description.trim() || undefined,
      clinicOrVet: clinicOrVet.trim() || undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Health Event' : 'Record Health Event'}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {apiError && <ErrorAlert message={apiError} />}

        {/* Event Type */}
        <div>
          <label htmlFor="eventType" className={LABEL_CLASS}>
            Event type <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className={INPUT_CLASS}
          >
            {ALL_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {fieldErrors.eventType && <p className={ERROR_CLASS}>{fieldErrors.eventType}</p>}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="event-title" className={LABEL_CLASS}>
            Title <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual rabies vaccine"
            maxLength={100}
            className={INPUT_CLASS}
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="event-date" className={LABEL_CLASS}>
            Date <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="event-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT_CLASS}
          />
          {fieldErrors.date && <p className={ERROR_CLASS}>{fieldErrors.date}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="event-description" className={LABEL_CLASS}>
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Additional details about this event…"
            className={INPUT_CLASS}
          />
        </div>

        {/* Clinic / Vet */}
        <div>
          <label htmlFor="event-clinic" className={LABEL_CLASS}>
            Clinic or vet <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="event-clinic"
            type="text"
            value={clinicOrVet}
            onChange={(e) => setClinicOrVet(e.target.value)}
            placeholder="e.g. City Animal Clinic"
            className={INPUT_CLASS}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Event'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
