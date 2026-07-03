package com.example.mybackend.web;

import com.example.mybackend.dto.AppointmentRequest;
import com.example.mybackend.dto.AppointmentResponse;
import com.example.mybackend.exception.PetAccessDeniedException;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.service.AppointmentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = AppointmentController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class AppointmentControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private AppointmentService appointmentService;

    private static final Long USER_ID = 10L;
    private static final Long PET_ID = 1L;

    @BeforeEach
    void setUpSecurity() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                        USER_ID, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    // ── GET /api/pets/{petId}/appointments ────────────────────────────────────

    @Test
    void listAppointments_success_returns200WithList() throws Exception {
        AppointmentResponse a = new AppointmentResponse(1L, "CHECK_UP",
                "2026-08-01T10:30", "City Clinic", "Annual check");
        when(appointmentService.listAppointments(PET_ID, USER_ID)).thenReturn(List.of(a));

        mockMvc.perform(get("/api/pets/{petId}/appointments", PET_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].appointmentType").value("CHECK_UP"))
                .andExpect(jsonPath("$[0].clinicOrDoctor").value("City Clinic"));
    }

    @Test
    void listAppointments_accessDenied_returns403() throws Exception {
        when(appointmentService.listAppointments(PET_ID, USER_ID))
                .thenThrow(new PetAccessDeniedException("Access denied"));

        mockMvc.perform(get("/api/pets/{petId}/appointments", PET_ID))
                .andExpect(status().isForbidden());
    }

    @Test
    void listAppointments_petNotFound_returns404() throws Exception {
        when(appointmentService.listAppointments(PET_ID, USER_ID))
                .thenThrow(new ResourceNotFoundException("Pet not found"));

        mockMvc.perform(get("/api/pets/{petId}/appointments", PET_ID))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/pets/{petId}/appointments ───────────────────────────────────

    @Test
    void createAppointment_validRequest_returns201() throws Exception {
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", "2026-08-01T10:30", "City Clinic", "Annual check");
        AppointmentResponse resp = new AppointmentResponse(1L, "CHECK_UP",
                "2026-08-01T10:30", "City Clinic", "Annual check");
        when(appointmentService.createAppointment(eq(PET_ID), eq(USER_ID), any()))
                .thenReturn(resp);

        mockMvc.perform(post("/api/pets/{petId}/appointments", PET_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.appointmentType").value("CHECK_UP"))
                .andExpect(jsonPath("$.dateTime").value("2026-08-01T10:30"));
    }

    @Test
    void createAppointment_missingClinic_returns400() throws Exception {
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", "2026-08-01T10:30", "", null);

        mockMvc.perform(post("/api/pets/{petId}/appointments", PET_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void createAppointment_missingDateTime_returns400() throws Exception {
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", null, "Clinic", null);

        mockMvc.perform(post("/api/pets/{petId}/appointments", PET_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createAppointment_accessDenied_returns403() throws Exception {
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", "2026-08-01T10:30", "Clinic", null);
        when(appointmentService.createAppointment(eq(PET_ID), eq(USER_ID), any()))
                .thenThrow(new PetAccessDeniedException("Access denied"));

        mockMvc.perform(post("/api/pets/{petId}/appointments", PET_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    // ── PUT /api/pets/{petId}/appointments/{appointmentId} ────────────────────

    @Test
    void updateAppointment_success_returns200() throws Exception {
        AppointmentRequest req = new AppointmentRequest(
                "VACCINE", "2026-09-01T09:00", "New Clinic", "Updated");
        AppointmentResponse resp = new AppointmentResponse(5L, "VACCINE",
                "2026-09-01T09:00", "New Clinic", "Updated");
        when(appointmentService.updateAppointment(eq(PET_ID), eq(5L), eq(USER_ID), any()))
                .thenReturn(resp);

        mockMvc.perform(put("/api/pets/{petId}/appointments/{appointmentId}", PET_ID, 5L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentType").value("VACCINE"));
    }

    @Test
    void updateAppointment_notFound_returns404() throws Exception {
        AppointmentRequest req = new AppointmentRequest(
                "CHECK_UP", "2026-08-01T10:30", "Clinic", null);
        when(appointmentService.updateAppointment(eq(PET_ID), eq(99L), eq(USER_ID), any()))
                .thenThrow(new ResourceNotFoundException("Appointment not found"));

        mockMvc.perform(put("/api/pets/{petId}/appointments/{appointmentId}", PET_ID, 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /api/pets/{petId}/appointments/{appointmentId} ─────────────────

    @Test
    void deleteAppointment_success_returns204() throws Exception {
        mockMvc.perform(delete("/api/pets/{petId}/appointments/{appointmentId}", PET_ID, 5L))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteAppointment_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Appointment not found"))
                .when(appointmentService).deleteAppointment(PET_ID, 99L, USER_ID);

        mockMvc.perform(delete("/api/pets/{petId}/appointments/{appointmentId}", PET_ID, 99L))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteAppointment_accessDenied_returns403() throws Exception {
        doThrow(new PetAccessDeniedException("Access denied"))
                .when(appointmentService).deleteAppointment(PET_ID, 5L, USER_ID);

        mockMvc.perform(delete("/api/pets/{petId}/appointments/{appointmentId}", PET_ID, 5L))
                .andExpect(status().isForbidden());
    }
}
