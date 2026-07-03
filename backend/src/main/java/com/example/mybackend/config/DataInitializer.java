package com.example.mybackend.config;

import com.example.mybackend.domain.Pet;
import com.example.mybackend.domain.User;
import com.example.mybackend.repository.PetRepository;
import com.example.mybackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a default test user and pet on startup.
 * Only active when the "prod" profile is NOT active (i.e. local dev with H2).
 *
 * Test credentials:
 *   Email:    sergioa.gutierrezs@gmail.com
 *   Password: Test123&
 */
@Component
@Profile("!prod")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PetRepository petRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PetRepository petRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.petRepository = petRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        User user = seedTestUser(
                "Sergio",
                "Gutierrez",
                "sergioa.gutierrezs@gmail.com",
                "Test123&"
        );
        if (user != null) {
            seedTestPet(user, "Buddy", "Dog", "Labrador");
        }
    }

    /** Returns the user (existing or newly created), or null if it already had a pet. */
    private User seedTestUser(String firstName, String lastName, String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            log.info("Seed user '{}' already exists — skipping user creation.", email);
            return userRepository.findByEmail(email).orElse(null);
        }

        User user = new User(firstName, lastName, email,
                passwordEncoder.encode(rawPassword), "ROLE_USER");
        user.setActive(true);
        userRepository.save(user);
        log.info("Seed user created: {} ({})", email, firstName + " " + lastName);
        return user;
    }

    private void seedTestPet(User owner, String name, String species, String breed) {
        boolean hasPet = petRepository.findByIdAndOwnerId(1L, owner.getId()).isPresent()
                || petRepository.findAll().stream()
                        .anyMatch(p -> p.getOwner().getId().equals(owner.getId()));
        if (hasPet) {
            log.info("Seed pet for user '{}' already exists — skipping.", owner.getEmail());
            return;
        }

        Pet pet = new Pet(owner, name, species);
        pet.setBreed(breed);
        pet.setPhotoUrl("https://images.dog.ceo/breeds/labrador/n02099712_102.jpg");
        petRepository.save(pet);
        log.info("Seed pet created: '{}' ({}) for user '{}'", name, species, owner.getEmail());
    }
}

