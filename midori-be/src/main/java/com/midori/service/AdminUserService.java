package com.midori.service;

import com.midori.dto.request.BanUserRequest;
import com.midori.dto.response.AdminTeacherCertificateResponse;
import com.midori.dto.response.AdminTeacherResponse;
import com.midori.entity.NotificationType;
import com.midori.entity.Role;
import com.midori.entity.TeacherCertificate;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassRepository;
import com.midori.repository.TeacherCertificateRepository;
import com.midori.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final ClassRepository classRepository;
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

    @Transactional(readOnly = true)
    public com.midori.dto.response.AdminTeacherStatsResponse getTeacherStats() {
        long pending = userRepository.countByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL);
        long total = userRepository.countByRole(Role.TEACHER);
        long active = userRepository.countByRoleAndStatus(Role.TEACHER, UserStatus.ACTIVE);

        java.time.Instant now = java.time.Instant.now();
        java.time.ZoneId zone = java.time.ZoneId.systemDefault();
        java.time.Instant startOfToday = now.atZone(zone).toLocalDate().atStartOfDay(zone).toInstant();
        long pendingToday = userRepository.countByRoleAndStatusAndCreatedAtBetween(
                Role.TEACHER, UserStatus.PENDING_APPROVAL, startOfToday, now);

        java.time.Instant sevenDaysAgo = startOfToday.minus(7, java.time.temporal.ChronoUnit.DAYS);
        long pendingThisWeek = userRepository.countByRoleAndStatusAndCreatedAtBetween(
                Role.TEACHER, UserStatus.PENDING_APPROVAL, sevenDaysAgo, now);

        long pendingCertified = userRepository.countTeachersWithCertificates(
                Role.TEACHER, UserStatus.PENDING_APPROVAL);

        long totalClasses = classRepository.count();
        long totalStudents = classRepository.countDistinctStudentsAcrossAllClasses();

        return com.midori.dto.response.AdminTeacherStatsResponse.builder()
                .pendingTeachers(pending)
                .pendingTeachersToday(pendingToday)
                .pendingTeachersThisWeek(pendingThisWeek)
                .pendingTeachersCertified(pendingCertified)
                .totalTeachers(total)
                .activeTeachers(active)
                .totalClasses(totalClasses)
                .totalStudents(totalStudents)
                .build();
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
                NotificationType.TEACHER_REJECTED
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
    public Page<AdminTeacherResponse> getAllUsers(Role role, UserStatus status, String keyword, Pageable pageable) {
        Page<User> userPage = userRepository.findAllWithFilters(role, status, keyword, pageable);
        java.util.List<User> users = userPage.getContent();
        // Pre-compute per-teacher class/student aggregates in a single grouped
        // query each so we don't N+1 the class repository for every row.
        java.util.Map<java.util.UUID, Long> classCounts = new java.util.HashMap<>();
        java.util.Map<java.util.UUID, Long> studentCounts = new java.util.HashMap<>();
        boolean anyTeacher = users.stream().anyMatch(u -> u.getRole() == Role.TEACHER);
        if (anyTeacher) {
            for (Object[] row : classRepository.countClassesPerTeacher()) {
                classCounts.put((java.util.UUID) row[0], ((Number) row[1]).longValue());
            }
            for (Object[] row : classRepository.countStudentsPerTeacher()) {
                studentCounts.put((java.util.UUID) row[0], ((Number) row[1]).longValue());
            }
        }
        java.util.List<AdminTeacherResponse> enriched = new java.util.ArrayList<>(users.size());
        for (User u : users) {
            Long tc = (u.getRole() == Role.TEACHER) ? classCounts.getOrDefault(u.getId(), 0L) : null;
            Long ts = (u.getRole() == Role.TEACHER) ? studentCounts.getOrDefault(u.getId(), 0L) : null;
            enriched.add(toAdminTeacherResponse(u, tc, ts));
        }
        // Preserve the original Page metadata (totals, sort, etc.) but replace
        // the content with the enriched DTOs.
        return userPage.map(u -> enriched.get(users.indexOf(u)));
    }

    @Transactional
    public AdminTeacherResponse banUser(UUID userId, BanUserRequest request, UUID adminId) {
        User user = getUserById(userId);

        if (user.getId().equals(adminId)) {
            throw new AccessDeniedException("You cannot ban your own account");
        }

        if (user.getRole() == Role.ADMIN) {
            throw new AccessDeniedException("Cannot ban another admin account");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new BadRequestException("User is already banned");
        }

        user.setStatus(UserStatus.BANNED);
        user.setRejectionReason(request.getReason().trim());
        User savedUser = userRepository.save(user);

        log.info("Admin ({}) banned user: {} ({})", adminId, savedUser.getEmail(), userId);
        return toAdminTeacherResponse(savedUser);
    }

    @Transactional
    public AdminTeacherResponse restoreUser(UUID userId) {
        User user = getUserById(userId);

        if (user.getStatus() != UserStatus.BANNED && user.getStatus() != UserStatus.SUSPENDED) {
            throw new BadRequestException("Only banned or suspended users can be restored");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setRejectionReason(null);
        User savedUser = userRepository.save(user);

        log.info("Admin restored user: {} ({})", savedUser.getEmail(), userId);
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
        // Single-teacher callers (approve/reject/suspend/activate/ban/restore)
        // don't need class aggregates in the response, so leave them null and
        // delegate to the canonical mapper.
        return toAdminTeacherResponse(user, null, null);
    }

    private AdminTeacherResponse toAdminTeacherResponse(User user, Long totalClasses, Long totalStudents) {
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
                    .totalClasses(totalClasses)
                    .totalStudents(totalStudents)
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
                .totalClasses(totalClasses)
                .totalStudents(totalStudents)
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

    private User getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Force initialize lazy associations
        if (user.getProfile() != null) {
            user.getProfile().getAvatarUrl();
        }
        return user;
    }
}
