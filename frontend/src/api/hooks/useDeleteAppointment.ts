import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAppointment } from '../petApi'

export function useDeleteAppointment(petId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (appointmentId: number) => deleteAppointment(petId, appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId, 'appointments'] })
    },
  })
}
