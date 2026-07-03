package com.example.mybackend.web;

import com.example.mybackend.dto.PetEventRequest;
import com.example.mybackend.dto.PetEventResponse;
import com.example.mybackend.security.SecurityUtils;
import com.example.mybackend.service.PetEventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets/{petId}/events")
public class PetEventController {

    private final PetEventService petEventService;

    public PetEventController(PetEventService petEventService) {
        this.petEventService = petEventService;
    }

    @GetMapping
    public ResponseEntity<List<PetEventResponse>> listEvents(@PathVariable Long petId) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        return ResponseEntity.ok(petEventService.listEvents(petId, userId));
    }

    @PostMapping
    public ResponseEntity<PetEventResponse> createEvent(
            @PathVariable Long petId,
            @Valid @RequestBody PetEventRequest request) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(petEventService.createEvent(petId, userId, request));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<PetEventResponse> updateEvent(
            @PathVariable Long petId,
            @PathVariable Long eventId,
            @Valid @RequestBody PetEventRequest request) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        return ResponseEntity.ok(petEventService.updateEvent(petId, eventId, userId, request));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long petId,
            @PathVariable Long eventId) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        petEventService.deleteEvent(petId, eventId, userId);
        return ResponseEntity.noContent().build();
    }
}
