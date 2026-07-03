package com.example.mybackend.service;

import com.example.mybackend.domain.EventType;
import com.example.mybackend.domain.Pet;
import com.example.mybackend.domain.PetEvent;
import com.example.mybackend.domain.User;
import com.example.mybackend.dto.PetEventRequest;
import com.example.mybackend.dto.PetEventResponse;
import com.example.mybackend.exception.PetAccessDeniedException;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.repository.PetEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetEventServiceTest {

    @Mock private PetEventRepository petEventRepository;
    @Mock private PetService petService;

    @InjectMocks private PetEventService petEventService;

    private Pet pet;
    private static final Long PET_ID = 1L;
    private static final Long USER_ID = 10L;

    @BeforeEach
    void setUp() {
        User owner = new User("Test", "Owner", "owner@test.com", "hash", "ROLE_USER");
        ReflectionTestUtils.setField(owner, "id", USER_ID);
        pet = new Pet(owner, "Buddy", "Dog");
        ReflectionTestUtils.setField(pet, "id", PET_ID);
    }

    // ── listEvents ────────────────────────────────────────────────────────────

    @Test
    void listEvents_success_returnsSortedList() {
        PetEvent e1 = new PetEvent(pet, EventType.VACCINE, "Vaccine", LocalDate.of(2026, 6, 1));
        PetEvent e2 = new PetEvent(pet, EventType.ALLERGY, "Allergy", LocalDate.of(2026, 5, 1));
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(petEventRepository.findByPetIdOrderByDateDesc(PET_ID)).thenReturn(List.of(e1, e2));

        List<PetEventResponse> result = petEventService.listEvents(PET_ID, USER_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).eventType()).isEqualTo("VACCINE");
    }

    @Test
    void listEvents_accessDenied_throwsPetAccessDeniedException() {
        when(petService.getPetForUser(PET_ID, USER_ID))
                .thenThrow(new PetAccessDeniedException("Access denied"));

        assertThatThrownBy(() -> petEventService.listEvents(PET_ID, USER_ID))
                .isInstanceOf(PetAccessDeniedException.class);
    }

    // ── createEvent ───────────────────────────────────────────────────────────

    @Test
    void createEvent_success_returnsMappedResponse() {
        PetEventRequest req = new PetEventRequest("VACCINE", "Annual vaccine",
                "2026-06-15", "Administered by Dr. Smith", "City Clinic");
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(petEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PetEventResponse result = petEventService.createEvent(PET_ID, USER_ID, req);

        assertThat(result.title()).isEqualTo("Annual vaccine");
        assertThat(result.eventType()).isEqualTo("VACCINE");
        assertThat(result.date()).isEqualTo("2026-06-15");
        verify(petEventRepository).save(any(PetEvent.class));
    }

    @Test
    void createEvent_petNotFound_throwsResourceNotFoundException() {
        PetEventRequest req = new PetEventRequest("VACCINE", "Vaccine", "2026-06-15", null, null);
        when(petService.getPetForUser(PET_ID, USER_ID))
                .thenThrow(new ResourceNotFoundException("Pet not found"));

        assertThatThrownBy(() -> petEventService.createEvent(PET_ID, USER_ID, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createEvent_invalidEventType_throwsIllegalArgumentException() {
        PetEventRequest req = new PetEventRequest("INVALID_TYPE", "Title", "2026-06-15", null, null);
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);

        assertThatThrownBy(() -> petEventService.createEvent(PET_ID, USER_ID, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("INVALID_TYPE");
    }

    // ── updateEvent ───────────────────────────────────────────────────────────

    @Test
    void updateEvent_success_returnsUpdatedResponse() {
        PetEvent existing = new PetEvent(pet, EventType.VACCINE, "Old title", LocalDate.of(2026, 1, 1));
        ReflectionTestUtils.setField(existing, "id", 5L);
        PetEventRequest req = new PetEventRequest("ALLERGY", "New title", "2026-07-01", null, null);

        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(petEventRepository.findByIdAndPetId(5L, PET_ID)).thenReturn(Optional.of(existing));
        when(petEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PetEventResponse result = petEventService.updateEvent(PET_ID, 5L, USER_ID, req);

        assertThat(result.title()).isEqualTo("New title");
        assertThat(result.eventType()).isEqualTo("ALLERGY");
    }

    @Test
    void updateEvent_eventNotFound_throwsResourceNotFoundException() {
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(petEventRepository.findByIdAndPetId(99L, PET_ID)).thenReturn(Optional.empty());
        PetEventRequest req = new PetEventRequest("VACCINE", "Title", "2026-07-01", null, null);

        assertThatThrownBy(() -> petEventService.updateEvent(PET_ID, 99L, USER_ID, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── deleteEvent ───────────────────────────────────────────────────────────

    @Test
    void deleteEvent_success_deletesEvent() {
        PetEvent existing = new PetEvent(pet, EventType.VACCINE, "Title", LocalDate.now());
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(petEventRepository.findByIdAndPetId(5L, PET_ID)).thenReturn(Optional.of(existing));

        petEventService.deleteEvent(PET_ID, 5L, USER_ID);

        verify(petEventRepository).delete(existing);
    }

    @Test
    void deleteEvent_eventNotFound_throwsResourceNotFoundException() {
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(petEventRepository.findByIdAndPetId(99L, PET_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petEventService.deleteEvent(PET_ID, 99L, USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
