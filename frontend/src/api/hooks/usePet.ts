import { useQuery } from '@tanstack/react-query'
import { getPet } from '../petApi'

export function usePet(petId: number) {
  return useQuery({
    queryKey: ['pets', petId],
    queryFn: () => getPet(petId),
    retry: false,
  })
}
