package com.example.mybackend.repository;

import com.example.mybackend.domain.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /** Returns all appointments for a pet, soonest first. */
    List<Appointment> findByPetIdOrderByDateTimeAsc(Long petId);

    /** Finds an appointment by ID only if it belongs to the given pet. */
    Optional<Appointment> findByIdAndPetId(Long appointmentId, Long petId);
}
