package com.example.mybackend.exception;

public class PetAccessDeniedException extends RuntimeException {

    public PetAccessDeniedException(String message) {
        super(message);
    }
}
