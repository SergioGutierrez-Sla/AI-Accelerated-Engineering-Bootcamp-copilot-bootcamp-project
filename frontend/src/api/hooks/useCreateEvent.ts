import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEvent } from '../petApi'
import type { PetEventRequest } from '../../types/pet'

export function useCreateEvent(petId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PetEventRequest) => createEvent(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId, 'events'] })
    },
  })
}
