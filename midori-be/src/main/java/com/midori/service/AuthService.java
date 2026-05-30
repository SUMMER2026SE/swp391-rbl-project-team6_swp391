package com.midori.service;

import com.midori.dto.request.LoginRequest;
import com.midori.dto.request.RegisterRequest;
import com.midori.dto.response.AuthResponse;
import com.midori.dto.response.UserResponse;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserProfile;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.exception.UnauthorizedException;
import com.midori.repository.UserProfileRepository;
import com.midori.repository.UserRepository;
import com.midori.security.CustomUserDetails;
import com.midori.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(extractNameFromEmail(request.getEmail()))
                .build();
        userProfileRepository.save(profile);

        return toUserResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new UnauthorizedException("Account has been banned");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new UnauthorizedException("Account has been suspended");
        }

        CustomUserDetails userDetails = CustomUserDetails.fromUser(user);
        String token = jwtTokenProvider.generateTokenFromUserDetails(userDetails);

        return AuthResponse.of(token, toUserResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String extractNameFromEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex);
        }
        return "User";
    }
}
