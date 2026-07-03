import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEvent } from '../petApi'
import type { PetEventRequest } from '../../types/pet'

interface UpdateEventVars {
  eventId: number
  data: PetEventRequest
}

export function useUpdateEvent(petId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, data }: UpdateEventVars) => updateEvent(petId, eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId, 'events'] })
    },
  })
}
