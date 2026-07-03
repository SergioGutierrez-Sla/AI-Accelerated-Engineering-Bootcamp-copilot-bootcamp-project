package com.example.mybackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class PetEventRequest {

    /** Enum name as string, e.g. "VACCINE", "OPERATION" */
    @NotBlank(message = "Event type is required")
    private String eventType;

    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    /** ISO 8601 date: yyyy-MM-dd */
    @NotNull(message = "Date is required")
    private String date;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private String clinicOrVet;

    public PetEventRequest() {}

    public PetEventRequest(String eventType, String title, String date,
                           String description, String clinicOrVet) {
        this.eventType = eventType;
        this.title = title;
        this.date = date;
        this.description = description;
        this.clinicOrVet = clinicOrVet;
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getClinicOrVet() { return clinicOrVet; }
    public void setClinicOrVet(String clinicOrVet) { this.clinicOrVet = clinicOrVet; }
}
