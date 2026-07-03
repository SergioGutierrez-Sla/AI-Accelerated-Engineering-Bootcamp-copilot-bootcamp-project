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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private VerificationTokenRepository verificationTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_validRequest_createsUserAndSendsVerificationEmail() {
        RegisterRequest req = new RegisterRequest("John", "Doe", "john@test.com", "Password1");

        when(userRepository.existsByEmail("john@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("bcryptHash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(verificationTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MessageResponse response = authService.register(req);

        assertThat(response.message()).contains("Registration successful");
        verify(emailService).sendVerificationEmail(eq("john@test.com"), anyString());
    }

    @Test
    void register_duplicateEmail_throwsEmailAlreadyExistsException() {
        RegisterRequest req = new RegisterRequest("John", "Doe", "john@test.com", "Password1");

        when(userRepository.existsByEmail("john@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(any(), any());
    }

    // ── verifyEmail ───────────────────────────────────────────────────────────

    @Test
    void verifyEmail_validToken_activatesUserAndDeletesToken() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");
        VerificationToken token = new VerificationToken(
                "valid-token", user, Instant.now().plus(1, ChronoUnit.HOURS));

        when(verificationTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MessageResponse response = authService.verifyEmail("valid-token");

        assertThat(response.message()).contains("verified");
        assertThat(user.isActive()).isTrue();
        verify(verificationTokenRepository).delete(token);
    }

    @Test
    void verifyEmail_expiredToken_throwsInvalidTokenException() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");
        VerificationToken token = new VerificationToken(
                "expired-token", user, Instant.now().minus(1, ChronoUnit.HOURS));

        when(verificationTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.verifyEmail("expired-token"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void verifyEmail_unknownToken_throwsInvalidTokenException() {
        when(verificationTokenRepository.findByToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail("bad-token"))
                .isInstanceOf(InvalidTokenException.class);
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_validActiveUser_returnsLoginResponse() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");
        user.setActive(true);

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password1", "hash")).thenReturn(true);
        when(jwtUtil.generateToken(user)).thenReturn("jwt-token");
        when(jwtUtil.getExpirySeconds()).thenReturn(3600L);

        LoginResponse response = authService.login(new LoginRequest("john@test.com", "Password1"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.role()).isEqualTo("ROLE_USER");
        assertThat(response.expiresIn()).isEqualTo(3600L);
    }

    @Test
    void login_wrongPassword_throwsBadCredentialsException() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");
        user.setActive(true);

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Wrong1", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("john@test.com", "Wrong1")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_inactiveAccount_throwsAccountNotActiveException() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");
        // active = false by default

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("john@test.com", "Password1")))
                .isInstanceOf(AccountNotActiveException.class)
                .hasMessageContaining("not been verified");
    }

    @Test
    void login_unknownEmail_throwsBadCredentialsException() {
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@test.com", "Pass1")))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ── requestPasswordReset ─────────────────────────────────────────────────

    @Test
    void requestPasswordReset_existingEmail_generatesTokenAndSendsEmail() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");

        when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MessageResponse response = authService.requestPasswordReset("john@test.com");

        assertThat(response.message()).contains("If an account");
        verify(emailService).sendPasswordResetEmail(eq("john@test.com"), anyString());
    }

    @Test
    void requestPasswordReset_unknownEmail_returnsSuccessWithoutSendingEmail() {
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        MessageResponse response = authService.requestPasswordReset("nobody@test.com");

        assertThat(response.message()).contains("If an account");
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    // ── confirmPasswordReset ─────────────────────────────────────────────────

    @Test
    void confirmPasswordReset_validToken_updatesPasswordAndMarksTokenUsed() {
        User user = new User("John", "Doe", "john@test.com", "oldHash", "ROLE_USER");
        PasswordResetToken token = new PasswordResetToken(
                "valid-reset", user, Instant.now().plus(1, ChronoUnit.HOURS));

        when(passwordResetTokenRepository.findByToken("valid-reset")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewPass1")).thenReturn("newHash");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MessageResponse response = authService.confirmPasswordReset("valid-reset", "NewPass1");

        assertThat(response.message()).contains("Password reset successfully");
        assertThat(user.getPasswordHash()).isEqualTo("newHash");
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    void confirmPasswordReset_expiredToken_throwsInvalidTokenException() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");
        PasswordResetToken token = new PasswordResetToken(
                "expired-reset", user, Instant.now().minus(1, ChronoUnit.HOURS));

        when(passwordResetTokenRepository.findByToken("expired-reset")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.confirmPasswordReset("expired-reset", "NewPass1"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void confirmPasswordReset_alreadyUsedToken_throwsInvalidTokenException() {
        User user = new User("John", "Doe", "john@test.com", "hash", "ROLE_USER");
        PasswordResetToken token = new PasswordResetToken(
                "used-reset", user, Instant.now().plus(1, ChronoUnit.HOURS));
        token.setUsed(true);

        when(passwordResetTokenRepository.findByToken("used-reset")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.confirmPasswordReset("used-reset", "NewPass1"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void confirmPasswordReset_unknownToken_throwsInvalidTokenException() {
        when(passwordResetTokenRepository.findByToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.confirmPasswordReset("bad-token", "NewPass1"))
                .isInstanceOf(InvalidTokenException.class);
    }
}
