package com.midori.controller;

import com.midori.dto.response.AdminTeacherResponse;
import com.midori.entity.Role;
import com.midori.entity.UserStatus;
import com.midori.exception.ResourceNotFoundException;
import com.midori.security.CustomUserDetails;
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
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
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

    private AdminTeacherResponse sampleTeacher;
    private UUID teacherId;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        teacherId = UUID.randomUUID();
        adminId = UUID.randomUUID();
        sampleTeacher = AdminTeacherResponse.builder()
                .id(teacherId)
                .email("teacher@example.com")
                .role(Role.TEACHER)
                .status(UserStatus.PENDING_APPROVAL)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        CustomUserDetails adminDetails = mock(CustomUserDetails.class);
        when(adminDetails.getId()).thenReturn(adminId);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(adminDetails);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("GET /api/admin/users/teachers/pending")
    class GetPendingTeachers {

        @Test
        @DisplayName("should return pending teachers successfully")
        void getPendingTeachers_success() throws Exception {
            List<AdminTeacherResponse> teachers = List.of(sampleTeacher);
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
            AdminTeacherResponse approvedTeacher = AdminTeacherResponse.builder()
                    .id(teacherId)
                    .email("teacher@example.com")
                    .role(Role.TEACHER)
                    .status(UserStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            when(adminUserService.approveTeacher(teacherId, adminId)).thenReturn(approvedTeacher);

            mockMvc.perform(put("/api/admin/users/{userId}/approve", teacherId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("Teacher approved successfully")))
                    .andExpect(jsonPath("$.data.status", is("ACTIVE")));

            verify(adminUserService).approveTeacher(teacherId, adminId);
        }

        @Test
        @DisplayName("should return 404 when teacher not found")
        void approveTeacher_notFound() throws Exception {
            UUID randomId = UUID.randomUUID();
            when(adminUserService.approveTeacher(randomId, adminId))
                    .thenThrow(new ResourceNotFoundException("User", "id", randomId));

            mockMvc.perform(put("/api/admin/users/{userId}/approve", randomId))
                    .andExpect(status().isNotFound());

            verify(adminUserService).approveTeacher(randomId, adminId);
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/users/{userId}/reject")
    class RejectTeacher {

        @Test
        @DisplayName("should reject pending teacher successfully")
        void rejectTeacher_success() throws Exception {
            AdminTeacherResponse rejectedTeacher = AdminTeacherResponse.builder()
                    .id(teacherId)
                    .email("teacher@example.com")
                    .role(Role.TEACHER)
                    .status(UserStatus.REJECTED)
                    .rejectionReason("Certificate not valid")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            when(adminUserService.rejectTeacher(teacherId, "Certificate not valid", adminId)).thenReturn(rejectedTeacher);

            mockMvc.perform(put("/api/admin/users/{userId}/reject", teacherId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "reason": "Certificate not valid"
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("Teacher rejected successfully")))
                    .andExpect(jsonPath("$.data.status", is("REJECTED")))
                    .andExpect(jsonPath("$.data.rejectionReason", is("Certificate not valid")));

            verify(adminUserService).rejectTeacher(teacherId, "Certificate not valid", adminId);
        }

        @Test
        @DisplayName("should reject invalid payload")
        void rejectTeacher_invalidPayload() throws Exception {
            mockMvc.perform(put("/api/admin/users/{userId}/reject", teacherId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "reason": "   "
                                    }
                                    """))
                    .andExpect(status().isBadRequest());

            verify(adminUserService, never()).rejectTeacher(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/users/{userId}/suspend")
    class SuspendUser {

        @Test
        @DisplayName("should suspend user successfully")
        void suspendUser_success() throws Exception {
            UUID userId = UUID.randomUUID();
            AdminTeacherResponse suspendedUser = AdminTeacherResponse.builder()
                    .id(userId)
                    .email("user@example.com")
                    .role(Role.STUDENT)
                    .status(UserStatus.SUSPENDED)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            when(adminUserService.suspendUser(userId)).thenReturn(suspendedUser);

            mockMvc.perform(put("/api/admin/users/{userId}/suspend", userId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("Teacher suspended successfully")))
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
