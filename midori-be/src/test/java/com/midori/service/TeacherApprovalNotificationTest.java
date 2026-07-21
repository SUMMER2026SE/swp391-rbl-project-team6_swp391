package com.midori.service;

import com.midori.entity.NotificationType;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.repository.TeacherCertificateRepository;
import com.midori.repository.TeacherStatusEventRepository;
import com.midori.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * End-to-end notification contract for the Teacher Approval flow.
 *
 * <p>These tests guard against the original "broadcast to ALL users when a
 * teacher is approved" bug. The contract that AdminUserService must obey:
 *
 * <ul>
 *   <li>{@link AdminUserService#approveTeacher(UUID, UUID)} calls
 *       {@link NotificationHelperService#createNotification(User, String, String, NotificationType)}
 *       exactly once.</li>
 *   <li>The single {@link User} passed to the helper is the teacher who was
 *       just approved (and nobody else).</li>
 *   <li>The {@link NotificationType} is {@code APPROVED} (the canonical
 *       post-V41 value; legacy {@code TEACHER_APPROVED} must not leak back
 *       in).</li>
 *   <li>The broadcast-by-role / broadcast-to-all-recipients helpers are
 *       never invoked from the approval path.</li>
 *   <li>Rejecting a teacher mirrors the same single-recipient contract with
 *       type {@code CONTEXT}.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class TeacherApprovalNotificationTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeacherCertificateRepository teacherCertificateRepository;

    @Mock
    private TeacherStatusEventRepository teacherStatusEventRepository;

    @Mock
    private NotificationHelperService notificationHelper;

    @InjectMocks
    private AdminUserService adminUserService;

    private User pendingTeacher;
    private User otherPendingTeacher;
    private User sampleAdmin;
    private UUID teacherId;
    private UUID otherTeacherId;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        teacherId = UUID.randomUUID();
        otherTeacherId = UUID.randomUUID();
        adminId = UUID.randomUUID();

        sampleAdmin = User.builder()
                .id(adminId)
                .email("admin@midori.local")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        pendingTeacher = User.builder()
                .id(teacherId)
                .email("teacher@example.com")
                .passwordHash("hashedPassword")
                .role(Role.TEACHER)
                .status(UserStatus.PENDING_APPROVAL)
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // A second teacher who happens to be pending too. The test asserts
        // this teacher must NOT receive a notification when the first one is
        // approved.
        otherPendingTeacher = User.builder()
                .id(otherTeacherId)
                .email("teacher-2@example.com")
                .passwordHash("hashedPassword")
                .role(Role.TEACHER)
                .status(UserStatus.PENDING_APPROVAL)
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("approveTeacher: single-user notification with type APPROVED, no broadcast")
    void approveTeacher_createsSingleUserNotificationWithApprovedType() {
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(pendingTeacher));
        when(userRepository.findById(adminId)).thenReturn(Optional.of(sampleAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.approveTeacher(teacherId, adminId);

        ArgumentCaptor<User> recipientCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<NotificationType> typeCaptor = ArgumentCaptor.forClass(NotificationType.class);
        verify(notificationHelper).createNotification(
                recipientCaptor.capture(),
                any(String.class),
                any(String.class),
                typeCaptor.capture());

        User recipient = recipientCaptor.getValue();
        assertThat(recipient).isNotNull();
        assertThat(recipient.getId()).isEqualTo(teacherId);
        assertThat(recipient.getEmail()).isEqualTo("teacher@example.com");
        assertThat(recipient.getRole()).isEqualTo(Role.TEACHER);

        assertThat(typeCaptor.getValue()).isEqualTo(NotificationType.APPROVED);

        // Crucially: the broadcast helpers must NOT be invoked. Approving a
        // single teacher is a single-recipient event, not a system-wide push.
        verify(notificationHelper, never()).notifyAllByRole(
                any(Role.class), any(UserStatus.class), any(String.class), any(String.class),
                any(NotificationType.class));
        verify(notificationHelper, never()).createNotificationForRecipients(
                anyList(), any(String.class), any(String.class), any(NotificationType.class));
    }

    @Test
    @DisplayName("approveTeacher: the approved teacher is the ONLY recipient (no other teacher)")
    void approveTeacher_doesNotNotifyOtherTeachers() {
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(pendingTeacher));
        when(userRepository.findById(adminId)).thenReturn(Optional.of(sampleAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.approveTeacher(teacherId, adminId);

        ArgumentCaptor<User> recipientCaptor = ArgumentCaptor.forClass(User.class);
        verify(notificationHelper).createNotification(
                recipientCaptor.capture(),
                any(String.class),
                any(String.class),
                any(NotificationType.class));

        User recipient = recipientCaptor.getValue();
        assertThat(recipient.getId())
                .as("Only the approved teacher may receive the notification")
                .isEqualTo(teacherId)
                .isNotEqualTo(otherTeacherId);
        assertThat(recipient.getEmail()).isNotEqualTo(otherPendingTeacher.getEmail());
    }

    @Test
    @DisplayName("rejectTeacher: single-user notification with type CONTEXT, no broadcast")
    void rejectTeacher_createsSingleUserNotificationWithContextType() {
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(pendingTeacher));
        when(userRepository.findById(adminId)).thenReturn(Optional.of(sampleAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.rejectTeacher(teacherId, "Incomplete documentation", adminId);

        ArgumentCaptor<User> recipientCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<NotificationType> typeCaptor = ArgumentCaptor.forClass(NotificationType.class);
        verify(notificationHelper).createNotification(
                recipientCaptor.capture(),
                any(String.class),
                any(String.class),
                typeCaptor.capture());

        assertThat(recipientCaptor.getValue().getId()).isEqualTo(teacherId);
        assertThat(typeCaptor.getValue()).isEqualTo(NotificationType.CONTEXT);

        verify(notificationHelper, never()).notifyAllByRole(
                any(Role.class), any(UserStatus.class), any(String.class), any(String.class),
                any(NotificationType.class));
        verify(notificationHelper, never()).createNotificationForRecipients(
                anyList(), any(String.class), any(String.class), any(NotificationType.class));
    }

    @Test
    @DisplayName("approveTeacher: never uses legacy TEACHER_APPROVED type")
    void approveTeacher_doesNotUseLegacyType() {
        when(userRepository.findById(teacherId)).thenReturn(Optional.of(pendingTeacher));
        when(userRepository.findById(adminId)).thenReturn(Optional.of(sampleAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.approveTeacher(teacherId, adminId);

        ArgumentCaptor<NotificationType> typeCaptor = ArgumentCaptor.forClass(NotificationType.class);
        verify(notificationHelper).createNotification(
                any(User.class), any(String.class), any(String.class), typeCaptor.capture());

        // After V41 the legacy value no longer exists in the enum; this
        // assertion is here to fail loudly if someone tries to re-introduce
        // it (the import alone would break compilation, which is the desired
        // safety net).
        assertThat(List.of(NotificationType.values()))
                .as("Legacy TEACHER_APPROVED must not be re-introduced")
                .doesNotContainNull()
                .extracting(NotificationType::name)
                .doesNotContain("TEACHER_APPROVED", "TEACHER_REJECTED",
                        "CONTENT_APPROVED", "CONTENT_REJECTED");
    }
}
