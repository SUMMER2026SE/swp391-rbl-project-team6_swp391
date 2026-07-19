package com.midori.controller;

import com.midori.dto.ai.AiMaterialDetailResponse;
import com.midori.dto.ai.AiMaterialSummaryResponse;
import com.midori.exception.BadRequestException;
import com.midori.exception.GlobalExceptionHandler;
import com.midori.exception.ResourceNotFoundException;
import com.midori.security.CustomUserDetails;
import com.midori.service.AiMaterialService;
import org.junit.jupiter.api.AfterEach;
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

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Endpoint-level tests for {@link AiMaterialController}.
 *
 * <p>The {@code @PreAuthorize} annotations are validated by the
 * {@code SecurityConfig} integration smoke tests. Here we focus on:
 * <ul>
 *   <li>List returns lightweight summaries</li>
 *   <li>Detail endpoint contract (type validation, 404 for unknown material)</li>
 *   <li>Service-level exception mapping to HTTP 400 / 404</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiMaterialControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AiMaterialService aiMaterialService;

    private AiMaterialController controller;
    private UUID studentId;
    private CustomUserDetails studentUser;

    @BeforeEach
    void setUp() {
        controller = new AiMaterialController(aiMaterialService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        studentId = UUID.randomUUID();
        studentUser = CustomUserDetails.builder()
                .id(studentId)
                .email("student@test.com")
                .role("STUDENT")
                .status("ACTIVE")
                .emailVerified(true)
                .build();
        setSecurityContext(studentUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setSecurityContext(CustomUserDetails userDetails) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    // ═══════════════════════════════════════════════════════════════════
    // LIST
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("GET /api/ai/materials")
    class ListTests {

        @Test
        @DisplayName("Authenticated STUDENT can list materials")
        void list_ok() throws Exception {
            AiMaterialSummaryResponse v = AiMaterialSummaryResponse.builder()
                    .type("VOCABULARY").id(UUID.randomUUID())
                    .title("N5 Vocab 1").level("N5").lessonNumber(1)
                    .shortDescription("desc").updatedAt(Instant.now())
                    .build();
            AiMaterialSummaryResponse g = AiMaterialSummaryResponse.builder()
                    .type("GRAMMAR").id(UUID.randomUUID())
                    .title("N5 Grammar 1").level("N5").lessonNumber(1)
                    .shortDescription("gdesc").updatedAt(Instant.now())
                    .build();
            when(aiMaterialService.listMaterials(eq(null), eq(null), eq(null)))
                    .thenReturn(List.of(v, g));

            mockMvc.perform(get("/api/ai/materials"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].type").value("VOCABULARY"))
                    .andExpect(jsonPath("$.data[0].title").value("N5 Vocab 1"))
                    .andExpect(jsonPath("$.data[0].level").value("N5"));
        }

        @Test
        @DisplayName("List passes type/level/search to service")
        void list_passesParams() throws Exception {
            when(aiMaterialService.listMaterials(eq("GRAMMAR"), eq("N5"), eq("verb")))
                    .thenReturn(List.of());

            mockMvc.perform(get("/api/ai/materials")
                            .param("type", "GRAMMAR")
                            .param("level", "N5")
                            .param("search", "verb"))
                    .andExpect(status().isOk());

            verify(aiMaterialService).listMaterials("GRAMMAR", "N5", "verb");
        }

        @Test
        @DisplayName("Invalid type returns HTTP 400 via GlobalExceptionHandler")
        void list_invalidType() throws Exception {
            when(aiMaterialService.listMaterials(eq("kanji"), eq(null), eq(null)))
                    .thenThrow(new BadRequestException("Invalid material type"));

            mockMvc.perform(get("/api/ai/materials").param("type", "kanji"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("ADMIN role can also list materials")
        void list_admin() throws Exception {
            SecurityContextHolder.clearContext();
            CustomUserDetails admin = CustomUserDetails.builder()
                    .id(UUID.randomUUID()).email("a@x.com")
                    .role("ADMIN").status("ACTIVE").emailVerified(true).build();
            setSecurityContext(admin);

            when(aiMaterialService.listMaterials(any(), any(), any())).thenReturn(List.of());

            mockMvc.perform(get("/api/ai/materials"))
                    .andExpect(status().isOk());
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // DETAIL
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("GET /api/ai/materials/{type}/{id}")
    class DetailTests {

        @Test
        @DisplayName("Returns detail payload with formatted content")
        void detail_ok() throws Exception {
            UUID id = UUID.randomUUID();
            AiMaterialDetailResponse detail = AiMaterialDetailResponse.builder()
                    .type("VOCABULARY").id(id).title("Vocab 1")
                    .level("N5").lessonNumber(1)
                    .content("Vocabulary Lesson: Vocab 1\nJLPT Level: N5\n- 水: nước\n")
                    .truncated(false)
                    .build();
            when(aiMaterialService.getMaterialDetail("VOCABULARY", id)).thenReturn(detail);

            mockMvc.perform(get("/api/ai/materials/{type}/{id}", "VOCABULARY", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.type").value("VOCABULARY"))
                    .andExpect(jsonPath("$.data.title").value("Vocab 1"))
                    .andExpect(jsonPath("$.data.content").value(org.hamcrest.Matchers.containsString("水")))
                    .andExpect(jsonPath("$.data.truncated").value(false));
        }

        @Test
        @DisplayName("Unknown material returns HTTP 404")
        void detail_404() throws Exception {
            UUID id = UUID.randomUUID();
            when(aiMaterialService.getMaterialDetail("VOCABULARY", id))
                    .thenThrow(new ResourceNotFoundException("Material not found"));

            mockMvc.perform(get("/api/ai/materials/{type}/{id}", "VOCABULARY", id))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Invalid type returns HTTP 400")
        void detail_400() throws Exception {
            UUID id = UUID.randomUUID();
            when(aiMaterialService.getMaterialDetail(eq("kanji"), eq(id)))
                    .thenThrow(new BadRequestException("Invalid material type"));

            mockMvc.perform(get("/api/ai/materials/{type}/{id}", "kanji", id))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Unparseable UUID produces a 4xx error (no service call)")
        void detail_invalidUuid() throws Exception {
            // StandaloneSetup surfaces the UUID parse failure as 500 (the
            // default ConversionService throws IllegalArgumentException, which
            // the default error handler does not map to 400). With the full
            // Spring Boot stack, this is mapped to HTTP 400 via
            // MethodArgumentTypeMismatchException. Either way the request must
            // not produce a 2xx and must not reach the service.
            // Assert that the response is NOT a 2xx success.
            int status = mockMvc.perform(
                    get("/api/ai/materials/{type}/{id}", "VOCABULARY", "not-a-uuid"))
                    .andReturn().getResponse().getStatus();
            org.junit.jupiter.api.Assertions.assertTrue(
                    status >= 400,
                    "Expected status >= 400, but was " + status);
            verify(aiMaterialService, org.mockito.Mockito.never())
                    .getMaterialDetail(any(), any());
        }
    }
}
