package com.midori.service;

import com.midori.dto.response.AdminTeacherCertificateResponse;
import com.midori.dto.response.AdminTeacherResponse;
import com.midori.entity.NotificationType;
import com.midori.entity.Role;
import com.midori.entity.TeacherCertificate;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.TeacherCertificateRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final TeacherCertificateRepository teacherCertificateRepository;
    private final NotificationHelperService notificationHelper;

    @Transactional(readOnly = true)
    public List<AdminTeacherResponse> getPendingTeachers() {
        List<User> pendingTeachers = userRepository.findByRoleAndStatusWithProfile(Role.TEACHER, UserStatus.PENDING_APPROVAL);
        return pendingTeachers.stream()
                .map(this::toAdminTeacherResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminTeacherResponse> getActiveTeachers() {
        List<User> activeTeachers = userRepository.findByRoleAndStatusWithProfile(Role.TEACHER, UserStatus.ACTIVE);
        return activeTeachers.stream()
                .map(this::toAdminTeacherResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminTeacherResponse approveTeacher(UUID userId) {
        User user = getTeacherById(userId);

        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Teacher account is not pending approval");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setRejectionReason(null);
        User savedUser = userRepository.save(user);

        // Notify teacher about account approval
        notificationHelper.createNotification(
                savedUser,
                "Teacher Approved",
                "Your teacher account has been approved.",
                NotificationType.TEACHER_APPROVED
        );

        log.info("Approved teacher: {} ({})", savedUser.getEmail(), userId);
        return toAdminTeacherResponse(savedUser);
    }

    @Transactional
    public AdminTeacherResponse rejectTeacher(UUID userId, String reason) {
        User user = getTeacherById(userId);

        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only pending teacher applications can be rejected");
        }

        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(reason.trim());
        User savedUser = userRepository.save(user);

        // Notify teacher about account rejection (include the reason)
        String content = reason != null && !reason.isBlank()
                ? "Your teacher account application was rejected. Reason: " + reason.trim()
                : "Your teacher account application was rejected.";
        notificationHelper.createNotification(
                savedUser,
                "Teacher Rejected",
                content,
                NotificationType.CONTENT_REJECTED
        );

        log.info("Rejected teacher application: {} ({})", savedUser.getEmail(), userId);
        return toAdminTeacherResponse(savedUser);
    }

    @Transactional
    public AdminTeacherResponse suspendUser(UUID userId) {
        User user = getTeacherById(userId);

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Only active teachers can be suspended");
        }

        user.setStatus(UserStatus.SUSPENDED);
        User savedUser = userRepository.save(user);

        log.info("Suspended teacher: {} ({})", savedUser.getEmail(), userId);
        return toAdminTeacherResponse(savedUser);
    }

    @Transactional
    public AdminTeacherResponse activateUser(UUID userId) {
        User user = getTeacherById(userId);

        if (user.getStatus() != UserStatus.SUSPENDED) {
            throw new BadRequestException("Only suspended teachers can be activated");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setRejectionReason(null);
        User savedUser = userRepository.save(user);

        log.info("Activated teacher: {} ({})", savedUser.getEmail(), userId);
        return toAdminTeacherResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public List<AdminTeacherCertificateResponse> getTeacherCertificates(UUID userId) {
        getTeacherById(userId);
        List<TeacherCertificate> certs = teacherCertificateRepository.findByTeacherIdOrderByCreatedAtDesc(userId);
        return certs.stream()
                .map(this::toAdminCertificateResponse)
                .collect(Collectors.toList());
    }

    private AdminTeacherCertificateResponse toAdminCertificateResponse(TeacherCertificate cert) {
        return AdminTeacherCertificateResponse.builder()
                .id(cert.getId())
                .title(cert.getTitle())
                .issuer(cert.getIssuer())
                .issuedDate(cert.getIssuedDate())
                .certificateUrl(cert.getCertificateUrl())
                .imageUrl(cert.getImageUrl())
                .description(cert.getDescription())
                .createdAt(cert.getCreatedAt())
                .updatedAt(cert.getUpdatedAt())
                .build();
    }

    private AdminTeacherResponse toAdminTeacherResponse(User user) {
        if (user.getProfile() != null) {
            return AdminTeacherResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .status(user.getStatus())
                    .displayName(user.getProfile().getDisplayName())
                    .avatarUrl(user.getProfile().getAvatarUrl())
                    .bio(user.getProfile().getBio())
                    .phone(user.getProfile().getPhone())
                    .location(user.getProfile().getLocation())
                    .dateOfBirth(user.getProfile().getDateOfBirth())
                    .rejectionReason(user.getRejectionReason())
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .build();
        }
        return AdminTeacherResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .rejectionReason(user.getRejectionReason())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private User getTeacherById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("Only teacher accounts can be managed here");
        }

        // Force initialize lazy associations
        if (user.getProfile() != null) {
            user.getProfile().getAvatarUrl();
        }
        return user;
    }
}
