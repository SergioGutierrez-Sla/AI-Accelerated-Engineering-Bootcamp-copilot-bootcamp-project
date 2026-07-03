package com.example.mybackend.config;

import com.example.mybackend.domain.User;
import com.example.mybackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the database with a default test user on startup.
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
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedTestUser(
                "Sergio",
                "Gutierrez",
                "sergioa.gutierrezs@gmail.com",
                "Test123&"
        );
    }

    private void seedTestUser(String firstName, String lastName, String email, String rawPassword) {
        if (userRepository.existsByEmail(email)) {
            log.info("Seed user '{}' already exists — skipping.", email);
            return;
        }

        User user = new User(firstName, lastName, email,
                passwordEncoder.encode(rawPassword), "ROLE_USER");
        user.setActive(true);   // pre-verified so login works immediately
        userRepository.save(user);

        log.info("Seed user created: {} ({})", email, firstName + " " + lastName);
    }
}
