import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAppointment } from '../petApi'
import type { AppointmentRequest } from '../../types/pet'

export function useCreateAppointment(petId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AppointmentRequest) => createAppointment(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId, 'appointments'] })
    },
  })
}
