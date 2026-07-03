package com.example.mybackend.service;

import com.example.mybackend.domain.Pet;
import com.example.mybackend.dto.PetResponse;
import com.example.mybackend.exception.PetAccessDeniedException;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.repository.PetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetService {

    private final PetRepository petRepository;

    public PetService(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    /**
     * Loads a pet and verifies it belongs to the given user.
     *
     * @throws ResourceNotFoundException  if no pet with petId exists
     * @throws PetAccessDeniedException   if the pet exists but belongs to a different user
     */
    @Transactional(readOnly = true)
    public Pet getPetForUser(Long petId, Long userId) {
        // First check if pet exists at all
        if (!petRepository.existsById(petId)) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }
        // Then check ownership
        return petRepository.findByIdAndOwnerId(petId, userId)
                .orElseThrow(() -> new PetAccessDeniedException(
                        "You do not have access to this pet."));
    }

    @Transactional(readOnly = true)
    public PetResponse getPetResponse(Long petId, Long userId) {
        Pet pet = getPetForUser(petId, userId);
        return toResponse(pet);
    }

    public static PetResponse toResponse(Pet pet) {
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getPhotoUrl()
        );
    }
}
