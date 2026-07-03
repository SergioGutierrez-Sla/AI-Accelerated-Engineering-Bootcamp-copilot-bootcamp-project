package com.example.mybackend.security;

import com.example.mybackend.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    // Must be >= 32 chars for HMAC-SHA256
    private static final String TEST_SECRET = "test-secret-key-that-is-32chars!!!";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expirySeconds", 3600L);
        jwtUtil.validateSecret();
    }

    @Test
    void generateToken_containsCorrectEmailAndRoleClaims() {
        User user = createPersistedUser();
        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.extractEmail(token)).isEqualTo("test@example.com");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("ROLE_USER");
    }

    @Test
    void generateToken_containsCorrectUserId() {
        User user = createPersistedUser();
        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.extractUserId(token)).isEqualTo(1L);
    }

    @Test
    void validateToken_validToken_returnsTrue() {
        String token = jwtUtil.generateToken(createPersistedUser());

        assertThat(jwtUtil.validateToken(token)).isTrue();
    }

    @Test
    void validateToken_tamperedToken_returnsFalse() {
        assertThat(jwtUtil.validateToken("not.a.valid.token")).isFalse();
    }

    @Test
    void validateToken_emptyString_returnsFalse() {
        assertThat(jwtUtil.validateToken("")).isFalse();
    }

    @Test
    void validateSecret_secretTooShort_throwsIllegalStateException() {
        JwtUtil weakJwt = new JwtUtil();
        ReflectionTestUtils.setField(weakJwt, "jwtSecret", "short");
        ReflectionTestUtils.setField(weakJwt, "expirySeconds", 3600L);

        assertThatThrownBy(weakJwt::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 characters");
    }

    @Test
    void getExpirySeconds_returnsConfiguredValue() {
        assertThat(jwtUtil.getExpirySeconds()).isEqualTo(3600L);
    }

    private User createPersistedUser() {
        User user = new User("Test", "User", "test@example.com", "hash", "ROLE_USER");
        ReflectionTestUtils.setField(user, "id", 1L);
        return user;
    }
}
