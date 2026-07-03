import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteEvent } from '../petApi'

export function useDeleteEvent(petId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: number) => deleteEvent(petId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId, 'events'] })
    },
  })
}
