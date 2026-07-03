import { useQuery } from '@tanstack/react-query'
import { listAppointments } from '../petApi'

export function usePetAppointments(petId: number) {
  return useQuery({
    queryKey: ['pets', petId, 'appointments'],
    queryFn: () => listAppointments(petId),
    retry: false,
  })
}
