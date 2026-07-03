import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAppointment } from '../petApi'
import type { AppointmentRequest } from '../../types/pet'

interface UpdateAppointmentVars {
  appointmentId: number
  data: AppointmentRequest
}

export function useUpdateAppointment(petId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ appointmentId, data }: UpdateAppointmentVars) =>
      updateAppointment(petId, appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId, 'appointments'] })
    },
  })
}
