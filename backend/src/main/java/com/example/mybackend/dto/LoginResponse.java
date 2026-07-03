package com.example.mybackend.dto;

public record LoginResponse(String token, long expiresIn, String role) {}
