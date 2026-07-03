import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { ErrorAlert } from '../common/ErrorAlert'
import type { Appointment, AppointmentRequest, AppointmentType } from '../../types/pet'
import { ALL_APPOINTMENT_TYPES, APPOINTMENT_TYPE_LABELS } from '../../types/pet'

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'
const ERROR_CLASS = 'mt-1 text-xs text-red-600'

interface AppointmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AppointmentRequest) => void
  isLoading: boolean
  apiError: string | null
  /** Pass an existing appointment to edit; undefined for create mode. */
  appointment?: Appointment | null
}

export function AppointmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  apiError,
  appointment,
}: AppointmentFormModalProps) {
  const isEdit = Boolean(appointment)

  const [appointmentType, setAppointmentType] = useState<AppointmentType>('CHECK_UP')
  const [dateTime, setDateTime] = useState('')
  const [clinicOrDoctor, setClinicOrDoctor] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (appointment) {
      setAppointmentType(appointment.appointmentType)
      setDateTime(appointment.dateTime)
      setClinicOrDoctor(appointment.clinicOrDoctor)
      setNotes(appointment.notes ?? '')
    } else {
      setAppointmentType('CHECK_UP')
      setDateTime('')
      setClinicOrDoctor('')
      setNotes('')
    }
    setFieldErrors({})
  }, [appointment, isOpen])

  function validate(): boolean {
    const errors: Partial<Record<string, string>> = {}
    if (!appointmentType) errors.appointmentType = 'Appointment type is required'
    if (!dateTime) errors.dateTime = 'Date and time is required'
    if (!clinicOrDoctor.trim()) errors.clinicOrDoctor = 'Clinic or doctor name is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      appointmentType,
      dateTime,
      clinicOrDoctor: clinicOrDoctor.trim(),
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Appointment' : 'Schedule Appointment'}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {apiError && <ErrorAlert message={apiError} />}

        {/* Appointment Type */}
        <div>
          <label htmlFor="appointmentType" className={LABEL_CLASS}>
            Type <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <select
            id="appointmentType"
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
            className={INPUT_CLASS}
          >
            {ALL_APPOINTMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {APPOINTMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {fieldErrors.appointmentType && (
            <p className={ERROR_CLASS}>{fieldErrors.appointmentType}</p>
          )}
        </div>

        {/* Date & Time */}
        <div>
          <label htmlFor="appointment-datetime" className={LABEL_CLASS}>
            Date and time <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="appointment-datetime"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className={INPUT_CLASS}
          />
          {fieldErrors.dateTime && <p className={ERROR_CLASS}>{fieldErrors.dateTime}</p>}
        </div>

        {/* Clinic / Doctor */}
        <div>
          <label htmlFor="appointment-clinic" className={LABEL_CLASS}>
            Clinic or doctor <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="appointment-clinic"
            type="text"
            value={clinicOrDoctor}
            onChange={(e) => setClinicOrDoctor(e.target.value)}
            placeholder="e.g. City Animal Clinic"
            className={INPUT_CLASS}
          />
          {fieldErrors.clinicOrDoctor && (
            <p className={ERROR_CLASS}>{fieldErrors.clinicOrDoctor}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="appointment-notes" className={LABEL_CLASS}>
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="appointment-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Any additional information…"
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
            {isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
