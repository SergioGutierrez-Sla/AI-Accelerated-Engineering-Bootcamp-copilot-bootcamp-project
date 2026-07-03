package com.example.mybackend.dto;

public record PetEventResponse(
        Long id,
        String eventType,
        String title,
        String date,
        String description,
        String clinicOrVet
) {}
