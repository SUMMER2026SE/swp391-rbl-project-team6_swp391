package com.midori.controller;

import com.midori.dto.classdto.AdminClassResponse;
import com.midori.dto.classdto.StudentClassResponse;
import com.midori.dto.homeworkdto.HomeworkResponse;
import com.midori.dto.response.ExamResponse;
import com.midori.entity.UserStatus;
import com.midori.exception.GlobalExceptionHandler;
import com.midori.exception.ResourceNotFoundException;
import com.midori.security.CustomUserDetails;
import com.midori.service.AdminClassService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminClassControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminClassService adminClassService;

    private AdminClassController adminClassController;
    private UUID classId;
    private AdminClassResponse sampleClass;
    private UUID studentId;
    private UUID adminId;
    private CustomUserDetails studentUser;
    private CustomUserDetails adminUser;

    @BeforeEach
    void setUp() {
        adminClassController = new AdminClassController(adminClassService);
        mockMvc = MockMvcBuilders.standaloneSetup(adminClassController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(
                    new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver()
                )
                .build();

        classId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        adminId = UUID.randomUUID();

        sampleClass = AdminClassResponse.builder()
                .id(classId)
                .name("Test Class")
                .description("Test Description")
                .teacherId(UUID.randomUUID())
                .teacher("Test Teacher")
                .students(10)
                .build();

        studentUser = CustomUserDetails.builder()
                .id(studentId)
                .email("student@test.com")
                .role("STUDENT")
                .status("ACTIVE")
                .emailVerified(true)
                .build();

        adminUser = CustomUserDetails.builder()
                .id(adminId)
                .email("admin@test.com")
                .role("ADMIN")
                .status("ACTIVE")
                .emailVerified(true)
                .build();
    }

    private void setAuthentication(CustomUserDetails user) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, null, user.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("GET /api/admin/classes")
    class GetAdminClasses {

        @Test
        @DisplayName("should return list of admin classes successfully")
        void getAdminClasses_success() throws Exception {
            setAuthentication(adminUser);
            List<AdminClassResponse> classes = List.of(sampleClass);
            when(adminClassService.getAdminClasses()).thenReturn(classes);

            mockMvc.perform(get("/api/admin/classes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].name", is("Test Class")));

            verify(adminClassService).getAdminClasses();
            clearAuthentication();
        }

        @Test
        @DisplayName("admin user has ROLE_ADMIN authority")
        void adminUserHasAdminRole() {
            setAuthentication(adminUser);
            var auth = SecurityContextHolder.getContext().getAuthentication();
            assert auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")) : "Admin user should have ROLE_ADMIN";
            clearAuthentication();
        }
    }

    @Nested
    @DisplayName("GET /api/admin/classes/{id}")
    class GetAdminClassById {

        @Test
        @DisplayName("should return admin class by id successfully")
        void getAdminClassById_success() throws Exception {
            setAuthentication(adminUser);
            when(adminClassService.getAdminClassById(classId)).thenReturn(sampleClass);

            mockMvc.perform(get("/api/admin/classes/{id}", classId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.name", is("Test Class")));

            verify(adminClassService).getAdminClassById(classId);
            clearAuthentication();
        }

        @Test
        @DisplayName("should return 404 when class not found")
        void getAdminClassById_notFound() throws Exception {
            setAuthentication(adminUser);
            UUID randomId = UUID.randomUUID();
            when(adminClassService.getAdminClassById(randomId))
                    .thenThrow(new ResourceNotFoundException("ClassEntity", "id", randomId));

            mockMvc.perform(get("/api/admin/classes/{id}", randomId))
                    .andExpect(status().isNotFound());

            verify(adminClassService).getAdminClassById(randomId);
            clearAuthentication();
        }
    }

    @Nested
    @DisplayName("GET /api/admin/classes/{id}/students")
    class GetClassStudents {

        @Test
        @DisplayName("should return class students successfully")
        void getClassStudents_success() throws Exception {
            setAuthentication(adminUser);
            StudentClassResponse student = StudentClassResponse.builder()
                    .studentId(UUID.randomUUID())
                    .email("student@example.com")
                    .fullName("Test Student")
                    .status(UserStatus.ACTIVE)
                    .build();
            when(adminClassService.getClassStudents(classId)).thenReturn(List.of(student));

            mockMvc.perform(get("/api/admin/classes/{id}/students", classId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].email", is("student@example.com")));

            verify(adminClassService).getClassStudents(classId);
            clearAuthentication();
        }
    }

    @Nested
    @DisplayName("GET /api/admin/classes/{id}/homeworks")
    class GetClassHomeworks {

        @Test
        @DisplayName("should return class homeworks successfully")
        void getClassHomeworks_success() throws Exception {
            setAuthentication(adminUser);
            HomeworkResponse homework = HomeworkResponse.builder()
                    .id(UUID.randomUUID())
                    .title("Test Homework")
                    .dueDate(Instant.now())
                    .build();
            when(adminClassService.getClassHomeworks(classId)).thenReturn(List.of(homework));

            mockMvc.perform(get("/api/admin/classes/{id}/homeworks", classId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].title", is("Test Homework")));

            verify(adminClassService).getClassHomeworks(classId);
            clearAuthentication();
        }
    }

    @Nested
    @DisplayName("GET /api/admin/classes/{id}/exams")
    class GetClassExams {

        @Test
        @DisplayName("should return class exams successfully")
        void getClassExams_success() throws Exception {
            setAuthentication(adminUser);
            ExamResponse exam = ExamResponse.builder()
                    .id(UUID.randomUUID())
                    .title("Test Exam")
                    .timeLimit(60)
                    .build();
            when(adminClassService.getClassExams(classId)).thenReturn(List.of(exam));

            mockMvc.perform(get("/api/admin/classes/{id}/exams", classId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].title", is("Test Exam")));

            verify(adminClassService).getClassExams(classId);
            clearAuthentication();
        }
    }
}
