package com.example.mybackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AppointmentRequest {

    /** Enum name as string, e.g. "CHECK_UP", "VACCINE" */
    @NotBlank(message = "Appointment type is required")
    private String appointmentType;

    /** ISO 8601 datetime: yyyy-MM-dd'T'HH:mm (seconds optional) */
    @NotNull(message = "Date and time is required")
    private String dateTime;

    @NotBlank(message = "Clinic or doctor is required")
    private String clinicOrDoctor;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    public AppointmentRequest() {}

    public AppointmentRequest(String appointmentType, String dateTime,
                              String clinicOrDoctor, String notes) {
        this.appointmentType = appointmentType;
        this.dateTime = dateTime;
        this.clinicOrDoctor = clinicOrDoctor;
        this.notes = notes;
    }

    public String getAppointmentType() { return appointmentType; }
    public void setAppointmentType(String appointmentType) { this.appointmentType = appointmentType; }

    public String getDateTime() { return dateTime; }
    public void setDateTime(String dateTime) { this.dateTime = dateTime; }

    public String getClinicOrDoctor() { return clinicOrDoctor; }
    public void setClinicOrDoctor(String clinicOrDoctor) { this.clinicOrDoctor = clinicOrDoctor; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
