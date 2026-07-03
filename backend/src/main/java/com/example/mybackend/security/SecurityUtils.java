package com.example.mybackend.security;

import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the authenticated user's ID from the SecurityContext.
     * The principal is a Long set by JwtAuthenticationFilter.
     */
    public static Long getAuthenticatedUserId() {
        return (Long) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }
}
