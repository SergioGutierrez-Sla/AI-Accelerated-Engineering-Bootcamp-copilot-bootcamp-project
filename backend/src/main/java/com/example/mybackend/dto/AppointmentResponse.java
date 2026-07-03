package com.example.mybackend.dto;

public record AppointmentResponse(
        Long id,
        String appointmentType,
        String dateTime,
        String clinicOrDoctor,
        String notes
) {}
