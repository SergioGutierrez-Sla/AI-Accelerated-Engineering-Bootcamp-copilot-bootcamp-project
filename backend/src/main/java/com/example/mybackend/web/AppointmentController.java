package com.example.mybackend.web;

import com.example.mybackend.dto.AppointmentRequest;
import com.example.mybackend.dto.AppointmentResponse;
import com.example.mybackend.security.SecurityUtils;
import com.example.mybackend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets/{petId}/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> listAppointments(@PathVariable Long petId) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        return ResponseEntity.ok(appointmentService.listAppointments(petId, userId));
    }

    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @PathVariable Long petId,
            @Valid @RequestBody AppointmentRequest request) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(petId, userId, request));
    }

    @PutMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long petId,
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentRequest request) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        return ResponseEntity.ok(
                appointmentService.updateAppointment(petId, appointmentId, userId, request));
    }

    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<Void> deleteAppointment(
            @PathVariable Long petId,
            @PathVariable Long appointmentId) {
        Long userId = SecurityUtils.getAuthenticatedUserId();
        appointmentService.deleteAppointment(petId, appointmentId, userId);
        return ResponseEntity.noContent().build();
    }
}
