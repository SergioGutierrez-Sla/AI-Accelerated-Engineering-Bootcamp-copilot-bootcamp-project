package com.example.mybackend.repository;

import com.example.mybackend.domain.Pet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {

    /** Finds a pet by ID only if it belongs to the given owner — single-query ownership check. */
    Optional<Pet> findByIdAndOwnerId(Long petId, Long ownerId);
}
