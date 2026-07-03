package com.example.mybackend.web;

import com.example.mybackend.dto.PetEventRequest;
import com.example.mybackend.dto.PetEventResponse;
import com.example.mybackend.exception.PetAccessDeniedException;
import com.example.mybackend.exception.ResourceNotFoundException;
import com.example.mybackend.service.PetEventService;
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
    value = PetEventController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class PetEventControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private PetEventService petEventService;

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

    // ── GET /api/pets/{petId}/events ──────────────────────────────────────────

    @Test
    void listEvents_success_returns200WithList() throws Exception {
        PetEventResponse e1 = new PetEventResponse(1L, "VACCINE", "Annual vaccine",
                "2026-06-15", null, "City Clinic");
        when(petEventService.listEvents(PET_ID, USER_ID)).thenReturn(List.of(e1));

        mockMvc.perform(get("/api/pets/{petId}/events", PET_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Annual vaccine"))
                .andExpect(jsonPath("$[0].eventType").value("VACCINE"));
    }

    @Test
    void listEvents_accessDenied_returns403() throws Exception {
        when(petEventService.listEvents(PET_ID, USER_ID))
                .thenThrow(new PetAccessDeniedException("Access denied"));

        mockMvc.perform(get("/api/pets/{petId}/events", PET_ID))
                .andExpect(status().isForbidden());
    }

    @Test
    void listEvents_petNotFound_returns404() throws Exception {
        when(petEventService.listEvents(PET_ID, USER_ID))
                .thenThrow(new ResourceNotFoundException("Pet not found"));

        mockMvc.perform(get("/api/pets/{petId}/events", PET_ID))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/pets/{petId}/events ─────────────────────────────────────────

    @Test
    void createEvent_validRequest_returns201() throws Exception {
        PetEventRequest req = new PetEventRequest("VACCINE", "Annual vaccine",
                "2026-06-15", null, "City Clinic");
        PetEventResponse resp = new PetEventResponse(1L, "VACCINE", "Annual vaccine",
                "2026-06-15", null, "City Clinic");
        when(petEventService.createEvent(eq(PET_ID), eq(USER_ID), any())).thenReturn(resp);

        mockMvc.perform(post("/api/pets/{petId}/events", PET_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("Annual vaccine"));
    }

    @Test
    void createEvent_missingTitle_returns400() throws Exception {
        PetEventRequest req = new PetEventRequest("VACCINE", "",
                "2026-06-15", null, null);

        mockMvc.perform(post("/api/pets/{petId}/events", PET_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void createEvent_accessDenied_returns403() throws Exception {
        PetEventRequest req = new PetEventRequest("VACCINE", "Title",
                "2026-06-15", null, null);
        when(petEventService.createEvent(eq(PET_ID), eq(USER_ID), any()))
                .thenThrow(new PetAccessDeniedException("Access denied"));

        mockMvc.perform(post("/api/pets/{petId}/events", PET_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    // ── PUT /api/pets/{petId}/events/{eventId} ────────────────────────────────

    @Test
    void updateEvent_success_returns200() throws Exception {
        PetEventRequest req = new PetEventRequest("ALLERGY", "Updated",
                "2026-07-01", null, null);
        PetEventResponse resp = new PetEventResponse(5L, "ALLERGY", "Updated",
                "2026-07-01", null, null);
        when(petEventService.updateEvent(eq(PET_ID), eq(5L), eq(USER_ID), any()))
                .thenReturn(resp);

        mockMvc.perform(put("/api/pets/{petId}/events/{eventId}", PET_ID, 5L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventType").value("ALLERGY"));
    }

    @Test
    void updateEvent_notFound_returns404() throws Exception {
        PetEventRequest req = new PetEventRequest("VACCINE", "Title",
                "2026-07-01", null, null);
        when(petEventService.updateEvent(eq(PET_ID), eq(99L), eq(USER_ID), any()))
                .thenThrow(new ResourceNotFoundException("Event not found"));

        mockMvc.perform(put("/api/pets/{petId}/events/{eventId}", PET_ID, 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    // ── DELETE /api/pets/{petId}/events/{eventId} ─────────────────────────────

    @Test
    void deleteEvent_success_returns204() throws Exception {
        mockMvc.perform(delete("/api/pets/{petId}/events/{eventId}", PET_ID, 5L))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteEvent_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Event not found"))
                .when(petEventService).deleteEvent(PET_ID, 99L, USER_ID);

        mockMvc.perform(delete("/api/pets/{petId}/events/{eventId}", PET_ID, 99L))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteEvent_accessDenied_returns403() throws Exception {
        doThrow(new PetAccessDeniedException("Access denied"))
                .when(petEventService).deleteEvent(PET_ID, 5L, USER_ID);

        mockMvc.perform(delete("/api/pets/{petId}/events/{eventId}", PET_ID, 5L))
                .andExpect(status().isForbidden());
    }
}
