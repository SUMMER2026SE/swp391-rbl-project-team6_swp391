package com.midori.service;

import com.midori.dto.response.UserResponse;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.entity.UserStatus;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    private User sampleTeacher;
    private User sampleTeacherActive;
    private User sampleTeacherSuspended;
    private User sampleStudent;
    private UUID teacherId;
    private UUID teacherActiveId;
    private UUID teacherSuspendedId;
    private UUID studentId;

    @BeforeEach
    void setUp() {
        teacherId = UUID.randomUUID();
        teacherActiveId = UUID.randomUUID();
        teacherSuspendedId = UUID.randomUUID();
        studentId = UUID.randomUUID();

        // Teacher pending approval — for approve/reject tests
        sampleTeacher = User.builder()
                .id(teacherId)
                .email("teacher@example.com")
                .passwordHash("hashedPassword")
                .role(Role.TEACHER)
                .status(UserStatus.PENDING_APPROVAL)
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Teacher active — for suspend test
        sampleTeacherActive = User.builder()
                .id(teacherActiveId)
                .email("teacher-active@example.com")
                .passwordHash("hashedPassword")
                .role(Role.TEACHER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Teacher suspended — for activate test
        sampleTeacherSuspended = User.builder()
                .id(teacherSuspendedId)
                .email("teacher-suspended@example.com")
                .passwordHash("hashedPassword")
                .role(Role.TEACHER)
                .status(UserStatus.SUSPENDED)
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        sampleStudent = User.builder()
                .id(studentId)
                .email("student@example.com")
                .passwordHash("hashedPassword")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("getPendingTeachers")
    class GetPendingTeachersTests {

        @Test
        @DisplayName("should return list of pending teachers when teachers exist")
        void getPendingTeachers_success() {
            List<User> pendingTeachers = List.of(sampleTeacher);
            when(userRepository.findByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL))
                    .thenReturn(pendingTeachers);

            List<UserResponse> result = adminUserService.getPendingTeachers();

            assertThat(result).hasSize(1);
            UserResponse response = result.get(0);
            assertThat(response.getEmail()).isEqualTo("teacher@example.com");
            assertThat(response.getRole()).isEqualTo(Role.TEACHER);
            assertThat(response.getStatus()).isEqualTo(UserStatus.PENDING_APPROVAL);
            verify(userRepository).findByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL);
        }

        @Test
        @DisplayName("should return empty list when no pending teachers")
        void getPendingTeachers_empty() {
            when(userRepository.findByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL))
                    .thenReturn(Collections.emptyList());

            List<UserResponse> result = adminUserService.getPendingTeachers();

            assertThat(result).isEmpty();
            verify(userRepository).findByRoleAndStatus(Role.TEACHER, UserStatus.PENDING_APPROVAL);
        }
    }

    @Nested
    @DisplayName("approveTeacher")
    class ApproveTeacherTests {

        @Test
        @DisplayName("should approve teacher successfully")
        void approveTeacher_success() {
            when(userRepository.findById(teacherId)).thenReturn(Optional.of(sampleTeacher));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UserResponse result = adminUserService.approveTeacher(teacherId);

            assertThat(result.getStatus()).isEqualTo(UserStatus.ACTIVE);
            verify(userRepository).findById(teacherId);
            verify(userRepository).save(sampleTeacher);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when user not found")
        void approveTeacher_userNotFound() {
            when(userRepository.findById(teacherId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.approveTeacher(teacherId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");

            verify(userRepository).findById(teacherId);
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException when user is not a teacher")
        void approveTeacher_notTeacher() {
            when(userRepository.findById(studentId)).thenReturn(Optional.of(sampleStudent));

            assertThatThrownBy(() -> adminUserService.approveTeacher(studentId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessage("Only teacher accounts can be managed here");

            verify(userRepository).findById(studentId);
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BadRequestException when teacher is not pending approval")
        void approveTeacher_notPendingApproval() {
            sampleTeacher.setStatus(UserStatus.ACTIVE);
            when(userRepository.findById(teacherId)).thenReturn(Optional.of(sampleTeacher));

            assertThatThrownBy(() -> adminUserService.approveTeacher(teacherId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessage("Teacher account is not pending approval");

            verify(userRepository).findById(teacherId);
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("suspendUser")
    class SuspendUserTests {

        @Test
        @DisplayName("should suspend user successfully")
        void suspendUser_success() {
            when(userRepository.findById(teacherActiveId)).thenReturn(Optional.of(sampleTeacherActive));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UserResponse result = adminUserService.suspendUser(teacherActiveId);

            assertThat(result.getStatus()).isEqualTo(UserStatus.SUSPENDED);
            verify(userRepository).findById(teacherActiveId);
            verify(userRepository).save(sampleTeacherActive);
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when user not found")
        void suspendUser_userNotFound() {
            UUID randomId = UUID.randomUUID();
            when(userRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminUserService.suspendUser(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");

            verify(userRepository).findById(randomId);
            verify(userRepository, never()).save(any());
        }
    }
}
