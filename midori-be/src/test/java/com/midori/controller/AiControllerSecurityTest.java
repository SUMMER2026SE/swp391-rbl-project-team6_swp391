package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.GenerateQuestionsRequest;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.exception.GlobalExceptionHandler;
import com.midori.exception.UnauthorizedException;
import com.midori.security.CustomUserDetails;
import com.midori.service.AiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiControllerSecurityTest {

    private MockMvc mockMvc;

    @Mock
    private AiService aiService;

    private AiController aiController;

    private ObjectMapper objectMapper;
    private UUID studentId;
    private UUID adminId;
    private UUID teacherId;
    private CustomUserDetails studentUser;
    private CustomUserDetails adminUser;
    private CustomUserDetails teacherUser;

    @BeforeEach
    void setUp() {
        aiController = new AiController(aiService);
        mockMvc = MockMvcBuilders.standaloneSetup(aiController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();

        studentId = UUID.randomUUID();
        adminId = UUID.randomUUID();
        teacherId = UUID.randomUUID();

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

        teacherUser = CustomUserDetails.builder()
                .id(teacherId)
                .email("teacher@test.com")
                .role("TEACHER")
                .status("ACTIVE")
                .emailVerified(true)
                .build();
    }

    private void setSecurityContext(CustomUserDetails userDetails) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("Null Principal Defensive Path")
    class NullPrincipalTests {

        @Test
        @DisplayName("null principal throws UnauthorizedException which maps to HTTP 401")
        void nullPrincipal_throwsUnauthorizedException() {
            clearSecurityContext();
            AiController controllerWithNullGuard = new AiController(aiService);

            assertThrows(UnauthorizedException.class, () -> controllerWithNullGuard.generateQuestions(
                    new GenerateQuestionsRequest(), null));
        }

        @Test
        @DisplayName("GlobalExceptionHandler maps UnauthorizedException to HTTP 401")
        void unauthorizedException_mapsTo401() {
            GlobalExceptionHandler handler = new GlobalExceptionHandler();
            UnauthorizedException ex = new UnauthorizedException("Authentication required");

            var response = handler.handleUnauthorized(ex);

            assertEquals(401, response.getStatusCode().value());
            assertFalse(response.getBody().isSuccess());
        }
    }

    @Nested
    @DisplayName("POST /api/ai/generate-questions - Input Validation")
    class GenerateQuestionsValidation {

        @Test
        @DisplayName("should reject topic exceeding 255 characters")
        void generateQuestions_topicTooLong() throws Exception {
            setSecurityContext(studentUser);

            String longTopic = "a".repeat(256);
            GenerateQuestionsRequest request = new GenerateQuestionsRequest();
            request.setTopic(longTopic);
            request.setLevel("N5");
            request.setCount(5);
            request.setType("MULTIPLE_CHOICE");

            mockMvc.perform(post("/api/ai/generate-questions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }

        @Test
        @DisplayName("should reject material content exceeding 12000 characters")
        void generateQuestions_materialContentTooLong() throws Exception {
            setSecurityContext(studentUser);

            GenerateQuestionsRequest request = new GenerateQuestionsRequest();
            request.setTopic("Japanese Grammar");
            request.setLevel("N5");
            request.setCount(5);
            request.setType("MULTIPLE_CHOICE");
            request.setMaterialContent("a".repeat(12001));

            mockMvc.perform(post("/api/ai/generate-questions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }

        @Test
        @DisplayName("should reject question count exceeding 20")
        void generateQuestions_countTooHigh() throws Exception {
            setSecurityContext(studentUser);

            GenerateQuestionsRequest request = new GenerateQuestionsRequest();
            request.setTopic("Japanese Grammar");
            request.setLevel("N5");
            request.setCount(21);
            request.setType("MULTIPLE_CHOICE");

            mockMvc.perform(post("/api/ai/generate-questions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }

        @Test
        @DisplayName("should reject question count less than 1")
        void generateQuestions_countTooLow() throws Exception {
            setSecurityContext(studentUser);

            GenerateQuestionsRequest request = new GenerateQuestionsRequest();
            request.setTopic("Japanese Grammar");
            request.setLevel("N5");
            request.setCount(0);
            request.setType("MULTIPLE_CHOICE");

            mockMvc.perform(post("/api/ai/generate-questions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }
    }

    @Nested
    @DisplayName("POST /api/ai/chat - Input Validation")
    class ChatValidation {

        @Test
        @DisplayName("should reject message exceeding 4000 characters")
        void chat_messageTooLong() throws Exception {
            setSecurityContext(studentUser);

            String longMessage = "a".repeat(4001);
            ChatRequest request = new ChatRequest();
            request.setMessage(longMessage);

            mockMvc.perform(post("/api/ai/chat")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }

        @Test
        @DisplayName("should reject blank message")
        void chat_blankMessage() throws Exception {
            setSecurityContext(studentUser);

            ChatRequest request = new ChatRequest();
            request.setMessage("");

            mockMvc.perform(post("/api/ai/chat")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }

        @Test
        @DisplayName("should reject null message")
        void chat_nullMessage() throws Exception {
            setSecurityContext(studentUser);

            String jsonWithoutMessage = "{\"conversationId\": null}";

            mockMvc.perform(post("/api/ai/chat")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(jsonWithoutMessage))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }
    }

    @Nested
    @DisplayName("Nested MaterialInfo Validation - HTTP Endpoint Test")
    class NestedMaterialValidationTests {

        @Test
        @DisplayName("should reject nested selectedMaterial.content exceeding 12000 characters via HTTP endpoint")
        void nestedMaterialContentTooLong_rejectedViaHttp() throws Exception {
            setSecurityContext(studentUser);

            String longContent = "a".repeat(12001);
            String requestJson = String.format("""
                {
                    "message": "What does this mean?",
                    "selectedMaterial": {
                        "id": "vocab-1",
                        "title": "Test Vocabulary",
                        "type": "VOCABULARY",
                        "level": "N5",
                        "content": "%s"
                    }
                }
                """, longContent);

            mockMvc.perform(post("/api/ai/chat")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)));
        }
    }
}
