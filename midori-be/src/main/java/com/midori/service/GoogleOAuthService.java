package com.midori.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.midori.dto.response.AuthResponse;
import com.midori.dto.response.UserResponse;
import com.midori.entity.OAuthAccount;
import com.midori.entity.User;
import com.midori.entity.UserProfile;
import com.midori.exception.BadRequestException;
import com.midori.exception.UnauthorizedException;
import com.midori.repository.OAuthAccountRepository;
import com.midori.repository.UserProfileRepository;
import com.midori.repository.UserRepository;
import com.midori.security.CustomUserDetails;
import com.midori.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collections;

@Slf4j
@Service
public class GoogleOAuthService {

    private static final String PROVIDER_GOOGLE = "GOOGLE";

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final OAuthAccountRepository oauthAccountRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final String googleClientId;

    public GoogleOAuthService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            OAuthAccountRepository oauthAccountRepository,
            JwtTokenProvider jwtTokenProvider,
            PasswordEncoder passwordEncoder,
            @Value("${app.google.client-id}") String googleClientId) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.oauthAccountRepository = oauthAccountRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.googleClientId = googleClientId;
    }

    @Transactional
    public AuthResponse authenticateWithGoogle(String idTokenString) {
        GoogleIdToken idToken = verifyIdToken(idTokenString);

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String googleUserId = payload.getSubject();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Google account must have a verified email");
        }

        Boolean emailVerified = payload.getEmailVerified();
        if (emailVerified == null || !emailVerified) {
            throw new BadRequestException("Google email must be verified");
        }

        var existingOAuth = oauthAccountRepository
                .findByProviderAndProviderUserId(PROVIDER_GOOGLE, googleUserId);

        User user;
        if (existingOAuth.isPresent()) {
            user = existingOAuth.get().getUser();
            log.info("Google OAuth login for existing user: {}", email);
        } else {
            var existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                user = existingUser.get();
                linkOAuthAccount(user, googleUserId, email);
                log.info("Linked Google OAuth account to existing user: {}", email);
            } else {
                user = createUserFromGoogle(email, name, picture);
                linkOAuthAccount(user, googleUserId, email);
                log.info("Created new user via Google OAuth: {}", email);
            }
        }

        CustomUserDetails userDetails = CustomUserDetails.fromUser(user);
        String token = jwtTokenProvider.generateTokenFromUserDetails(userDetails);
        return AuthResponse.of(token, toUserResponse(user));
    }

    private GoogleIdToken verifyIdToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new UnauthorizedException("Invalid Google ID token");
            }
            return idToken;
        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Google ID token verification failed: {}", e.getMessage());
            throw new UnauthorizedException("Invalid Google ID token");
        }
    }

    private void linkOAuthAccount(User user, String providerUserId, String email) {
        OAuthAccount oauth = OAuthAccount.builder()
                .user(user)
                .provider(PROVIDER_GOOGLE)
                .providerUserId(providerUserId)
                .email(email)
                .build();
        oauthAccountRepository.save(oauth);
    }

    private User createUserFromGoogle(String email, String name, String picture) {
        User user = User.builder()
                .email(email)
                .passwordHash(generateRandomPasswordHash())
                .role(com.midori.entity.Role.STUDENT)
                .status(com.midori.entity.UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(name != null ? name : extractNameFromEmail(email))
                .avatarUrl(picture)
                .build();
        userProfileRepository.save(profile);

        return user;
    }

    private String generateRandomPasswordHash() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        String randomPassword = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        return passwordEncoder.encode(randomPassword);
    }

    private String extractNameFromEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex);
        }
        return "User";
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
}
