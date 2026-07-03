import { useQuery } from '@tanstack/react-query'
import { listEvents } from '../petApi'

export function usePetEvents(petId: number) {
  return useQuery({
    queryKey: ['pets', petId, 'events'],
    queryFn: () => listEvents(petId),
    retry: false,
  })
}
