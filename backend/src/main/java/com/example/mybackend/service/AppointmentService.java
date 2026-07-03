package com.example.mybackend.service;

import com.example.mybackend.domain.Appointment;
import com.example.mybackend.domain.AppointmentType;
import com.example.mybackend.domain.Pet;
import com.example.mybackend.dto.AppointmentRequest;
import com.example.mybackend.dto.AppointmentResponse;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);
    private static final DateTimeFormatter DT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    private final AppointmentRepository appointmentRepository;
    private final PetService petService;

    public AppointmentService(AppointmentRepository appointmentRepository, PetService petService) {
        this.appointmentRepository = appointmentRepository;
        this.petService = petService;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listAppointments(Long petId, Long userId) {
        petService.getPetForUser(petId, userId); // ownership check
        return appointmentRepository.findByPetIdOrderByDateTimeAsc(petId)
                .stream()
                .map(AppointmentService::toResponse)
                .toList();
    }

    @Transactional
    public AppointmentResponse createAppointment(Long petId, Long userId, AppointmentRequest req) {
        Pet pet = petService.getPetForUser(petId, userId);
        AppointmentType type = parseAppointmentType(req.getAppointmentType());
        LocalDateTime dt = parseDateTime(req.getDateTime());

        Appointment appointment = new Appointment(pet, type, dt, req.getClinicOrDoctor());
        appointment.setNotes(req.getNotes());

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Created appointment '{}' for pet {}", req.getAppointmentType(), petId);
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse updateAppointment(Long petId, Long appointmentId,
                                                  Long userId, AppointmentRequest req) {
        petService.getPetForUser(petId, userId);
        Appointment appointment = appointmentRepository.findByIdAndPetId(appointmentId, petId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + appointmentId));

        appointment.setAppointmentType(parseAppointmentType(req.getAppointmentType()));
        appointment.setDateTime(parseDateTime(req.getDateTime()));
        appointment.setClinicOrDoctor(req.getClinicOrDoctor());
        appointment.setNotes(req.getNotes());

        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public void deleteAppointment(Long petId, Long appointmentId, Long userId) {
        petService.getPetForUser(petId, userId);
        Appointment appointment = appointmentRepository.findByIdAndPetId(appointmentId, petId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found with id: " + appointmentId));
        appointmentRepository.delete(appointment);
        log.info("Deleted appointment {} from pet {}", appointmentId, petId);
    }

    private static AppointmentType parseAppointmentType(String value) {
        try {
            return AppointmentType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid appointment type: '" + value + "'. Valid values: CHECK_UP, VACCINE, SURGERY, DEWORMING, OTHER");
        }
    }

    /** Accepts both "yyyy-MM-dd'T'HH:mm" and full ISO datetime with seconds. */
    static LocalDateTime parseDateTime(String value) {
        try {
            return LocalDateTime.parse(value, DT_FORMAT);
        } catch (DateTimeParseException e) {
            try {
                return LocalDateTime.parse(value);
            } catch (DateTimeParseException ex) {
                throw new IllegalArgumentException(
                        "Invalid dateTime format: '" + value + "'. Expected yyyy-MM-dd'T'HH:mm");
            }
        }
    }

    static AppointmentResponse toResponse(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                a.getAppointmentType().name(),
                a.getDateTime().format(DT_FORMAT),
                a.getClinicOrDoctor(),
                a.getNotes()
        );
    }
}
