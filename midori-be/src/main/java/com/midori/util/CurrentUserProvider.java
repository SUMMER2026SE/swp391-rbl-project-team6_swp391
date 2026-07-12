package com.midori.util;

import com.midori.exception.BadRequestException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Objects;

@Component
public class CurrentUserProvider {

    private final HttpServletRequest request;

    public CurrentUserProvider(HttpServletRequest request) {
        this.request = request;
    }

    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return userDetails.getUsername();
        }
        return null;
    }

    public String requireStudentId() {
        String userId = getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("Unauthenticated");
        }

        if (!hasRole("ROLE_STUDENT", "STUDENT")) {
            throw new BadRequestException("Forbidden");
        }
        return userId;
    }

    public boolean hasRole(String... roles) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        for (GrantedAuthority authority : authorities) {
            String authorityRole = authority.getAuthority();
            if (authorityRole == null) {
                continue;
            }
            for (String role : roles) {
                if (Objects.equals(authorityRole, role) || Objects.equals(authorityRole, "ROLE_" + role)) {
                    return true;
                }
            }
        }
        return false;
    }
}
