package com.example.mybackend.service;

import com.example.mybackend.domain.Appointment;
import com.example.mybackend.domain.AppointmentType;
import com.example.mybackend.domain.Pet;
import com.example.mybackend.domain.User;
import com.example.mybackend.dto.AppointmentRequest;
import com.example.mybackend.dto.AppointmentResponse;
import com.example.mybackend.exception.PetAccessDeniedException;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PetService petService;

    @InjectMocks private AppointmentService appointmentService;

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

    // ── listAppointments ──────────────────────────────────────────────────────

    @Test
    void listAppointments_success_returnsSortedList() {
        Appointment a1 = new Appointment(pet, AppointmentType.CHECK_UP,
                LocalDateTime.of(2026, 8, 1, 10, 0), "Clinic A");
        Appointment a2 = new Appointment(pet, AppointmentType.VACCINE,
                LocalDateTime.of(2026, 9, 1, 14, 0), "Clinic B");
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(appointmentRepository.findByPetIdOrderByDateTimeAsc(PET_ID))
                .thenReturn(List.of(a1, a2));

        List<AppointmentResponse> result = appointmentService.listAppointments(PET_ID, USER_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).appointmentType()).isEqualTo("CHECK_UP");
    }

    @Test
    void listAppointments_accessDenied_throwsPetAccessDeniedException() {
        when(petService.getPetForUser(PET_ID, USER_ID))
                .thenThrow(new PetAccessDeniedException("Access denied"));

        assertThatThrownBy(() -> appointmentService.listAppointments(PET_ID, USER_ID))
                .isInstanceOf(PetAccessDeniedException.class);
    }

    // ── createAppointment ─────────────────────────────────────────────────────

    @Test
    void createAppointment_success_returnsMappedResponse() {
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", "2026-08-01T10:30", "City Clinic", "Annual check");
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse result = appointmentService.createAppointment(PET_ID, USER_ID, req);

        assertThat(result.appointmentType()).isEqualTo("CHECK_UP");
        assertThat(result.clinicOrDoctor()).isEqualTo("City Clinic");
        assertThat(result.dateTime()).isEqualTo("2026-08-01T10:30");
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    void createAppointment_invalidType_throwsIllegalArgumentException() {
        AppointmentRequest req = new AppointmentRequest(
                "INVALID", "2026-08-01T10:30", "Clinic", null);
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);

        assertThatThrownBy(() -> appointmentService.createAppointment(PET_ID, USER_ID, req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createAppointment_petNotFound_throwsResourceNotFoundException() {
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", "2026-08-01T10:30", "Clinic", null);
        when(petService.getPetForUser(PET_ID, USER_ID))
                .thenThrow(new ResourceNotFoundException("Pet not found"));

        assertThatThrownBy(() -> appointmentService.createAppointment(PET_ID, USER_ID, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── updateAppointment ─────────────────────────────────────────────────────

    @Test
    void updateAppointment_success_returnsUpdatedResponse() {
        Appointment existing = new Appointment(pet, AppointmentType.CHECK_UP,
                LocalDateTime.of(2026, 8, 1, 10, 0), "Old Clinic");
        ReflectionTestUtils.setField(existing, "id", 5L);
        AppointmentRequest req = new AppointmentRequest(
                "VACCINE", "2026-09-01T09:00", "New Clinic", "Updated notes");

        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(appointmentRepository.findByIdAndPetId(5L, PET_ID)).thenReturn(Optional.of(existing));
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse result = appointmentService.updateAppointment(
                PET_ID, 5L, USER_ID, req);

        assertThat(result.appointmentType()).isEqualTo("VACCINE");
        assertThat(result.clinicOrDoctor()).isEqualTo("New Clinic");
    }

    @Test
    void updateAppointment_notFound_throwsResourceNotFoundException() {
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(appointmentRepository.findByIdAndPetId(99L, PET_ID)).thenReturn(Optional.empty());
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", "2026-08-01T10:30", "Clinic", null);

        assertThatThrownBy(() -> appointmentService.updateAppointment(PET_ID, 99L, USER_ID, req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── deleteAppointment ─────────────────────────────────────────────────────

    @Test
    void deleteAppointment_success_deletesAppointment() {
        Appointment existing = new Appointment(pet, AppointmentType.CHECK_UP,
                LocalDateTime.of(2026, 8, 1, 10, 0), "Clinic");
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(appointmentRepository.findByIdAndPetId(5L, PET_ID)).thenReturn(Optional.of(existing));

        appointmentService.deleteAppointment(PET_ID, 5L, USER_ID);

        verify(appointmentRepository).delete(existing);
    }

    @Test
    void deleteAppointment_notFound_throwsResourceNotFoundException() {
        when(petService.getPetForUser(PET_ID, USER_ID)).thenReturn(pet);
        when(appointmentRepository.findByIdAndPetId(99L, PET_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> appointmentService.deleteAppointment(PET_ID, 99L, USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── parseDateTime helper ──────────────────────────────────────────────────

    @Test
    void parseDateTime_withMinutes_parsesCorrectly() {
        LocalDateTime dt = AppointmentService.parseDateTime("2026-08-01T10:30");
        assertThat(dt).isEqualTo(LocalDateTime.of(2026, 8, 1, 10, 30));
    }

    @Test
    void parseDateTime_withSeconds_parsesCorrectly() {
        LocalDateTime dt = AppointmentService.parseDateTime("2026-08-01T10:30:00");
        assertThat(dt).isEqualTo(LocalDateTime.of(2026, 8, 1, 10, 30, 0));
    }

    @Test
    void parseDateTime_invalid_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> AppointmentService.parseDateTime("not-a-date"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
