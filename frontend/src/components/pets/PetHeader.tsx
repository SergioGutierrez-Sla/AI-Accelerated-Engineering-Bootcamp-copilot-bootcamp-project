import type { PetSummary } from '../../types/pet'

interface PetHeaderProps {
  pet: PetSummary
}

export function PetHeader({ pet }: PetHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Photo */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-sky-100">
        {pet.photoUrl ? (
          <img
            src={pet.photoUrl}
            alt={`Photo of ${pet.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🐾</div>
        )}
      </div>

      {/* Info */}
      <div>
        <h2 className="text-2xl font-bold !text-gray-900">{pet.name}</h2>
        <p className="text-sm text-gray-500">
          {pet.species}
          {pet.breed ? ` · ${pet.breed}` : ''}
        </p>
      </div>
    </div>
  )
}
