package com.example.mybackend.service;

import com.example.mybackend.domain.EventType;
import com.example.mybackend.domain.Pet;
import com.example.mybackend.domain.PetEvent;
import com.example.mybackend.dto.PetEventRequest;
import com.example.mybackend.dto.PetEventResponse;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.repository.PetEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PetEventService {

    private static final Logger log = LoggerFactory.getLogger(PetEventService.class);

    private final PetEventRepository petEventRepository;
    private final PetService petService;

    public PetEventService(PetEventRepository petEventRepository, PetService petService) {
        this.petEventRepository = petEventRepository;
        this.petService = petService;
    }

    @Transactional(readOnly = true)
    public List<PetEventResponse> listEvents(Long petId, Long userId) {
        petService.getPetForUser(petId, userId); // ownership check
        return petEventRepository.findByPetIdOrderByDateDesc(petId)
                .stream()
                .map(PetEventService::toResponse)
                .toList();
    }

    @Transactional
    public PetEventResponse createEvent(Long petId, Long userId, PetEventRequest req) {
        Pet pet = petService.getPetForUser(petId, userId);
        EventType eventType = parseEventType(req.getEventType());
        LocalDate date = LocalDate.parse(req.getDate());

        PetEvent event = new PetEvent(pet, eventType, req.getTitle(), date);
        event.setDescription(req.getDescription());
        event.setClinicOrVet(req.getClinicOrVet());

        PetEvent saved = petEventRepository.save(event);
        log.info("Created event '{}' for pet {}", req.getTitle(), petId);
        return toResponse(saved);
    }

    @Transactional
    public PetEventResponse updateEvent(Long petId, Long eventId, Long userId, PetEventRequest req) {
        petService.getPetForUser(petId, userId);
        PetEvent event = petEventRepository.findByIdAndPetId(eventId, petId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found with id: " + eventId));

        event.setEventType(parseEventType(req.getEventType()));
        event.setTitle(req.getTitle());
        event.setDate(LocalDate.parse(req.getDate()));
        event.setDescription(req.getDescription());
        event.setClinicOrVet(req.getClinicOrVet());

        return toResponse(petEventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long petId, Long eventId, Long userId) {
        petService.getPetForUser(petId, userId);
        PetEvent event = petEventRepository.findByIdAndPetId(eventId, petId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Event not found with id: " + eventId));
        petEventRepository.delete(event);
        log.info("Deleted event {} from pet {}", eventId, petId);
    }

    private static EventType parseEventType(String value) {
        try {
            return EventType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid event type: '" + value + "'. Valid values: OPERATION, ALLERGY, EXAM_RESULT, VACCINE, DEWORMING, MEDICAL_NOTE");
        }
    }

    static PetEventResponse toResponse(PetEvent event) {
        return new PetEventResponse(
                event.getId(),
                event.getEventType().name(),
                event.getTitle(),
                event.getDate().toString(),
                event.getDescription(),
                event.getClinicOrVet()
        );
    }
}
