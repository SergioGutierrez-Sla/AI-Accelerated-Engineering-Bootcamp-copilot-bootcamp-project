package com.example.mybackend.service;

import com.example.mybackend.domain.PasswordResetToken;
import com.example.mybackend.domain.User;
import com.example.mybackend.domain.VerificationToken;
import com.example.mybackend.dto.LoginRequest;
import com.example.mybackend.dto.LoginResponse;
import com.example.mybackend.dto.MessageResponse;
import com.example.mybackend.dto.RegisterRequest;
import com.example.mybackend.exception.AccountNotActiveException;
import com.example.mybackend.exception.EmailAlreadyExistsException;
import com.example.mybackend.exception.InvalidTokenException;
import com.example.mybackend.repository.PasswordResetTokenRepository;
import com.example.mybackend.repository.UserRepository;
import com.example.mybackend.repository.VerificationTokenRepository;
import com.example.mybackend.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       VerificationTokenRepository verificationTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "An account with this email address already exists.");
        }

        String hash = passwordEncoder.encode(request.getPassword());
        User user = new User(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                hash,
                "ROLE_USER");
        userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        VerificationToken token = new VerificationToken(
                tokenValue, user, Instant.now().plus(24, ChronoUnit.HOURS));
        verificationTokenRepository.save(token);

        emailService.sendVerificationEmail(user.getEmail(), tokenValue);

        return new MessageResponse(
                "Registration successful. Please check your email to verify your account.");
    }

    @Transactional
    public MessageResponse verifyEmail(String tokenValue) {
        VerificationToken token = verificationTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new InvalidTokenException(
                        "Verification token is invalid or has expired."));

        if (token.isExpired()) {
            verificationTokenRepository.delete(token);
            throw new InvalidTokenException(
                    "Verification token is invalid or has expired.");
        }

        User user = token.getUser();
        user.setActive(true);
        userRepository.save(user);
        verificationTokenRepository.delete(token);

        return new MessageResponse("Email verified successfully. You can now log in.");
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!user.isActive()) {
            throw new AccountNotActiveException(
                    "Your email address has not been verified. Please check your inbox.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user);
        return new LoginResponse(token, jwtUtil.getExpirySeconds(), user.getRole());
    }

    @Transactional
    public MessageResponse requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);

            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken(
                    tokenValue, user, Instant.now().plus(1, ChronoUnit.HOURS));
            passwordResetTokenRepository.save(token);

            emailService.sendPasswordResetEmail(user.getEmail(), tokenValue);
        });

        return new MessageResponse(
                "If an account with that email exists, a password reset link has been sent.");
    }

    @Transactional
    public MessageResponse confirmPasswordReset(String tokenValue, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new InvalidTokenException(
                        "Password reset token is invalid or has expired."));

        if (token.isExpired() || token.isUsed()) {
            throw new InvalidTokenException(
                    "Password reset token is invalid or has expired.");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        return new MessageResponse(
                "Password reset successfully. You can now log in with your new password.");
    }
}
