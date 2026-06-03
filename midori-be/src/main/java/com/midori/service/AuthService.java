package com.midori.service;

import com.midori.dto.request.*;
import com.midori.dto.response.AuthResponse;
import com.midori.dto.response.UserResponse;
import com.midori.entity.*;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.exception.UnauthorizedException;
import com.midori.repository.*;
import com.midori.security.CustomUserDetails;
import com.midori.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final Random otpRandom = new SecureRandom();

    @Value("${app.token.email-verification-expiration:60}")
    private long emailVerificationExpiration;

    @Value("${app.token.password-reset-expiration:3600}")
    private long passwordResetExpiration;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Role role = resolveRole(request.getRole());
        UserStatus status = (role == Role.TEACHER) ? UserStatus.PENDING_APPROVAL : UserStatus.ACTIVE;

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .status(status)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(extractNameFromEmail(request.getEmail()))
                .build();
        userProfileRepository.save(profile);

        EmailVerificationToken verificationToken = createEmailVerificationToken(user);
        emailService.sendVerificationOtp(user.getEmail(), verificationToken.getToken());

        return toUserResponse(user);
    }

    private Role resolveRole(String roleStr) {
        if (roleStr == null || roleStr.isBlank()) {
            return Role.STUDENT;
        }
        String normalized = roleStr.toUpperCase().trim();
        switch (normalized) {
            case "STUDENT":
                return Role.STUDENT;
            case "TEACHER":
                return Role.TEACHER;
            case "ADMIN":
                throw new BadRequestException("Admin registration is not allowed via public signup");
            default:
                throw new BadRequestException("Invalid role: " + roleStr + ". Allowed values: STUDENT, TEACHER");
        }
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.getEmailVerified()) {
            throw new UnauthorizedException("Please verify your email before logging in");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new UnauthorizedException("Account has been banned");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new UnauthorizedException("Account has been suspended");
        }
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            throw new UnauthorizedException("Your teacher account is pending admin approval. You will be able to login once approved.");
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

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        EmailVerificationToken tokenEntity = emailVerificationTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (tokenEntity.getUsed()) {
            throw new BadRequestException("Verification token has already been used");
        }

        if (tokenEntity.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        User user = tokenEntity.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        tokenEntity.setUsed(true);
        emailVerificationTokenRepository.save(tokenEntity);
    }

    @Transactional
    public void resendVerification(ResendVerificationRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            return;
        }

        if (user.getEmailVerified()) {
            return;
        }

        EmailVerificationToken verificationToken = createEmailVerificationToken(user);
        emailService.sendVerificationOtp(user.getEmail(), verificationToken.getToken());
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null) {
            return;
        }

        PasswordResetToken resetToken = createPasswordResetToken(user);
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken tokenEntity = passwordResetTokenRepository
                .findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (tokenEntity.getUsed()) {
            throw new BadRequestException("Reset token has already been used");
        }

        if (tokenEntity.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        User user = tokenEntity.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("New password must be different from current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void logout() {
    }

    private EmailVerificationToken createEmailVerificationToken(User user) {
        String otp = generateOtp();
        Instant expiresAt = Instant.now().plusSeconds(emailVerificationExpiration);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .token(otp)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        return emailVerificationTokenRepository.save(verificationToken);
    }

    private PasswordResetToken createPasswordResetToken(User user) {
        String token = generateSecureToken();
        Instant expiresAt = Instant.now().plusSeconds(passwordResetExpiration);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        return passwordResetTokenRepository.save(resetToken);
    }

    private String generateOtp() {
        int otp = otpRandom.nextInt(1_000_000);
        return String.format("%06d", otp);
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
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
