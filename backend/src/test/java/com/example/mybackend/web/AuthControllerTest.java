package com.example.mybackend.web;

import com.example.mybackend.dto.LoginRequest;
import com.example.mybackend.dto.LoginResponse;
import com.example.mybackend.dto.MessageResponse;
import com.example.mybackend.dto.PasswordResetConfirmDto;
import com.example.mybackend.dto.PasswordResetRequestDto;
import com.example.mybackend.dto.RegisterRequest;
import com.example.mybackend.exception.AccountNotActiveException;
import com.example.mybackend.exception.EmailAlreadyExistsException;
import com.example.mybackend.exception.InvalidTokenException;
import com.example.mybackend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    value = AuthController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    // ── POST /api/auth/register ───────────────────────────────────────────────

    @Test
    void register_validRequest_returns201WithMessage() throws Exception {
        RegisterRequest req = new RegisterRequest("John", "Doe", "john@test.com", "Password1");

        when(authService.register(any())).thenReturn(
                new MessageResponse("Registration successful. Please check your email."));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value(
                        "Registration successful. Please check your email."));
    }

    @Test
    void register_invalidEmail_returns400WithFieldErrors() throws Exception {
        RegisterRequest req = new RegisterRequest("John", "Doe", "not-an-email", "Password1");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void register_weakPassword_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("John", "Doe", "john@test.com", "weak");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest req = new RegisterRequest("John", "Doe", "john@test.com", "Password1");

        when(authService.register(any())).thenThrow(
                new EmailAlreadyExistsException("An account with this email address already exists."));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "An account with this email address already exists."));
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────

    @Test
    void login_validCredentials_returns200WithToken() throws Exception {
        LoginRequest req = new LoginRequest("john@test.com", "Password1");

        when(authService.login(any())).thenReturn(
                new LoginResponse("jwt-token", 3600L, "ROLE_USER"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    void login_badCredentials_returns401() throws Exception {
        LoginRequest req = new LoginRequest("john@test.com", "WrongPass1");

        when(authService.login(any())).thenThrow(
                new BadCredentialsException("Invalid email or password."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void login_unverifiedAccount_returns403() throws Exception {
        LoginRequest req = new LoginRequest("john@test.com", "Password1");

        when(authService.login(any())).thenThrow(
                new AccountNotActiveException(
                        "Your email address has not been verified. Please check your inbox."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    // ── GET /api/auth/verify-email ───────────────────────────────────────────

    @Test
    void verifyEmail_validToken_returns200() throws Exception {
        when(authService.verifyEmail("valid-token")).thenReturn(
                new MessageResponse("Email verified successfully. You can now log in."));

        mockMvc.perform(get("/api/auth/verify-email").param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "Email verified successfully. You can now log in."));
    }

    @Test
    void verifyEmail_invalidToken_returns400() throws Exception {
        when(authService.verifyEmail("bad-token")).thenThrow(
                new InvalidTokenException("Verification token is invalid or has expired."));

        mockMvc.perform(get("/api/auth/verify-email").param("token", "bad-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Verification token is invalid or has expired."));
    }

    // ── POST /api/auth/password-reset/request ────────────────────────────────

    @Test
    void requestPasswordReset_anyEmail_returns200WithGenericMessage() throws Exception {
        PasswordResetRequestDto req = new PasswordResetRequestDto("john@test.com");

        when(authService.requestPasswordReset(anyString())).thenReturn(
                new MessageResponse("If an account with that email exists, a password reset link has been sent."));

        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "If an account with that email exists, a password reset link has been sent."));
    }

    // ── POST /api/auth/password-reset/confirm ────────────────────────────────

    @Test
    void confirmPasswordReset_validToken_returns200() throws Exception {
        PasswordResetConfirmDto req = new PasswordResetConfirmDto("valid-token", "NewPass1");

        when(authService.confirmPasswordReset(anyString(), anyString())).thenReturn(
                new MessageResponse("Password reset successfully. You can now log in with your new password."));

        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "Password reset successfully. You can now log in with your new password."));
    }

    @Test
    void confirmPasswordReset_expiredToken_returns400() throws Exception {
        PasswordResetConfirmDto req = new PasswordResetConfirmDto("expired-token", "NewPass1");

        when(authService.confirmPasswordReset(anyString(), anyString())).thenThrow(
                new InvalidTokenException("Password reset token is invalid or has expired."));

        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Password reset token is invalid or has expired."));
    }
}
