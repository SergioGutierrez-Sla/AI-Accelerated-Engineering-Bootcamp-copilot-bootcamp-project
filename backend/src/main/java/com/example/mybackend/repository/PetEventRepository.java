package com.example.mybackend.repository;

import com.example.mybackend.domain.PetEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PetEventRepository extends JpaRepository<PetEvent, Long> {

    /** Returns all events for a pet, most recent first. */
    List<PetEvent> findByPetIdOrderByDateDesc(Long petId);

    /** Finds an event by ID only if it belongs to the given pet — prevents cross-pet access. */
    Optional<PetEvent> findByIdAndPetId(Long eventId, Long petId);
}
