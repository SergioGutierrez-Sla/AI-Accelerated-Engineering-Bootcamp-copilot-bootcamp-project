package com.example.mybackend.dto;

public record PetResponse(
        Long id,
        String name,
        String species,
        String breed,
        String photoUrl
) {}
