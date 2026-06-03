package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.response.UserResponse;
import com.midori.entity.Role;
import com.midori.entity.UserStatus;
import com.midori.exception.ResourceNotFoundException;
import com.midori.service.AdminUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = AdminController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.midori\\.security\\..*|com\\.midori\\.config\\..*"
    )
)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminUserService adminUserService;

    private UserResponse sampleTeacher;
    private UUID teacherId;

    @BeforeEach
    void setUp() {
        teacherId = UUID.randomUUID();
        sampleTeacher = UserResponse.builder()
                .id(teacherId)
                .email("teacher@example.com")
                .role(Role.TEACHER)
                .status(UserStatus.PENDING_APPROVAL)
                .emailVerified(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("GET /api/admin/users/teachers/pending")
    class GetPendingTeachers {

        @Test
        @DisplayName("should return pending teachers successfully")
        void getPendingTeachers_success() throws Exception {
            List<UserResponse> teachers = List.of(sampleTeacher);
            when(adminUserService.getPendingTeachers()).thenReturn(teachers);

            mockMvc.perform(get("/api/admin/users/teachers/pending"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].email", is("teacher@example.com")))
                    .andExpect(jsonPath("$.data[0].role", is("TEACHER")));

            verify(adminUserService).getPendingTeachers();
        }

        @Test
        @DisplayName("should return empty list when no pending teachers")
        void getPendingTeachers_empty() throws Exception {
            when(adminUserService.getPendingTeachers()).thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/admin/users/teachers/pending"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(0)));

            verify(adminUserService).getPendingTeachers();
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/users/{userId}/approve")
    class ApproveTeacher {

        @Test
        @DisplayName("should approve teacher successfully")
        void approveTeacher_success() throws Exception {
            UserResponse approvedTeacher = UserResponse.builder()
                    .id(teacherId)
                    .email("teacher@example.com")
                    .role(Role.TEACHER)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            when(adminUserService.approveTeacher(teacherId)).thenReturn(approvedTeacher);

            mockMvc.perform(put("/api/admin/users/{userId}/approve", teacherId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("Teacher approved successfully")))
                    .andExpect(jsonPath("$.data.status", is("ACTIVE")));

            verify(adminUserService).approveTeacher(teacherId);
        }

        @Test
        @DisplayName("should return 404 when teacher not found")
        void approveTeacher_notFound() throws Exception {
            UUID randomId = UUID.randomUUID();
            when(adminUserService.approveTeacher(randomId))
                    .thenThrow(new ResourceNotFoundException("User", "id", randomId));

            mockMvc.perform(put("/api/admin/users/{userId}/approve", randomId))
                    .andExpect(status().isNotFound());

            verify(adminUserService).approveTeacher(randomId);
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/users/{userId}/suspend")
    class SuspendUser {

        @Test
        @DisplayName("should suspend user successfully")
        void suspendUser_success() throws Exception {
            UUID userId = UUID.randomUUID();
            UserResponse suspendedUser = UserResponse.builder()
                    .id(userId)
                    .email("user@example.com")
                    .role(Role.STUDENT)
                    .status(UserStatus.SUSPENDED)
                    .emailVerified(true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            when(adminUserService.suspendUser(userId)).thenReturn(suspendedUser);

            mockMvc.perform(put("/api/admin/users/{userId}/suspend", userId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("User suspended successfully")))
                    .andExpect(jsonPath("$.data.status", is("SUSPENDED")));

            verify(adminUserService).suspendUser(userId);
        }

        @Test
        @DisplayName("should return 404 when user not found")
        void suspendUser_notFound() throws Exception {
            UUID randomId = UUID.randomUUID();
            when(adminUserService.suspendUser(randomId))
                    .thenThrow(new ResourceNotFoundException("User", "id", randomId));

            mockMvc.perform(put("/api/admin/users/{userId}/suspend", randomId))
                    .andExpect(status().isNotFound());

            verify(adminUserService).suspendUser(randomId);
        }
    }
}
