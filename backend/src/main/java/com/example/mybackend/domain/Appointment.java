package com.example.mybackend.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentType appointmentType;

    @Column(nullable = false)
    private LocalDateTime dateTime;

    @Column(nullable = false)
    private String clinicOrDoctor;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    protected Appointment() {}

    public Appointment(Pet pet, AppointmentType appointmentType, LocalDateTime dateTime,
                       String clinicOrDoctor) {
        this.pet = pet;
        this.appointmentType = appointmentType;
        this.dateTime = dateTime;
        this.clinicOrDoctor = clinicOrDoctor;
        this.createdAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Pet getPet() { return pet; }

    public AppointmentType getAppointmentType() { return appointmentType; }
    public void setAppointmentType(AppointmentType appointmentType) { this.appointmentType = appointmentType; }

    public LocalDateTime getDateTime() { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }

    public String getClinicOrDoctor() { return clinicOrDoctor; }
    public void setClinicOrDoctor(String clinicOrDoctor) { this.clinicOrDoctor = clinicOrDoctor; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
