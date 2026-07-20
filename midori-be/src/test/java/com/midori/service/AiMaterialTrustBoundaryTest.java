package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.dto.ai.AiMaterialDetailResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.AiConversationRepository;
import com.midori.repository.AiMessageRepository;
import com.midori.service.impl.AiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Phase 2 — Final Trust Boundary tests for AiServiceImpl.
 *
 * <p>These tests prove that real lesson material is identified only by
 * (materialType, materialId) and that the backend resolves content through
 * AiMaterialService — never trusting the client-supplied body.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiMaterialTrustBoundaryTest {

    @Mock
    private AiConversationRepository conversationRepository;

    @Mock
    private AiMessageRepository messageRepository;

    @Mock
    private AiCoreService aiCoreService;

    @Mock
    private AiRateLimitService rateLimitService;

    @Mock
    private AiMaterialService aiMaterialService;

    private AiServiceImpl aiService;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        aiService = new AiServiceImpl(
                conversationRepository,
                messageRepository,
                aiCoreService,
                rateLimitService,
                aiMaterialService,
                new ObjectMapper(),
                false // strict mode — no local fallback
        );
    }

    private AiMaterialDetailResponse fakeMaterial(String type, UUID id, String title,
                                                  String level, String content) {
        return AiMaterialDetailResponse.builder()
                .type(type)
                .id(id)
                .title(title)
                .level(level)
                .content(content)
                .truncated(false)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // CHAT — TRUST BOUNDARY
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Chat: trusted material resolution")
    class ChatTrustBoundary {

        @Test
        @DisplayName("valid material type+id resolves trusted database content (chat)")
        void chat_validReferenceResolvesTrustedContent() {
            UUID materialId = UUID.randomUUID();
            String trustedTitle = "N5 Vocabulary Lesson 1";
            String trustedContent = "DATABASE CONTENT: 食べる = taberu = to eat";
            when(aiMaterialService.getMaterialDetail("VOCABULARY", materialId))
                    .thenReturn(fakeMaterial("VOCABULARY", materialId, trustedTitle, "N5", trustedContent));

            // Stub conversation save so the chat() flow can proceed past the
            // rate-limit / conversation creation steps.
            UUID convId = UUID.randomUUID();
            com.midori.entity.AiConversation savedConv = com.midori.entity.AiConversation.builder()
                    .id(convId)
                    .user(com.midori.entity.User.builder().id(userId).build())
                    .title("Explain 食べる")
                    .createdAt(java.time.Instant.now())
                    .updatedAt(java.time.Instant.now())
                    .build();
            when(conversationRepository.save(any(com.midori.entity.AiConversation.class))).thenReturn(savedConv);
            when(messageRepository.save(any(com.midori.entity.AiMessage.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ChatRequest.MaterialInfo clientMaterial = new ChatRequest.MaterialInfo();
            clientMaterial.setId(materialId);
            clientMaterial.setType("VOCABULARY");
            clientMaterial.setTitle("FAKE CLIENT TITLE — must be ignored");
            clientMaterial.setContent("FAKE CLIENT BODY — must be ignored");
            clientMaterial.setLevel("N5");

            var response = aiService.chat(userId, null, "Explain 食べる", "VOCABULARY", materialId, clientMaterial);

            assertNotNull(response);
            verify(aiMaterialService).getMaterialDetail("VOCABULARY", materialId);
            // Service must NOT have been called with the fake content
        }

        @Test
        @DisplayName("chat: invalid material reference returns BadRequestException (400), never falls back to client content")
        void chat_invalidTypeReturnsBadRequest() {
            UUID materialId = UUID.randomUUID();
            when(aiMaterialService.getMaterialDetail("BOGUS", materialId))
                    .thenThrow(new BadRequestException("Invalid material type: BOGUS"));

            ChatRequest.MaterialInfo clientMaterial = new ChatRequest.MaterialInfo();
            clientMaterial.setId(materialId);
            clientMaterial.setType("BOGUS");
            clientMaterial.setTitle("Client tries to fake a lesson");
            clientMaterial.setContent("Client tries to send fake lesson body");

            BadRequestException ex = assertThrows(BadRequestException.class,
                    () -> aiService.chat(userId, null, "Hi", "BOGUS", materialId, clientMaterial));
            assertTrue(ex.getMessage().toLowerCase().contains("invalid material type"));
        }

        @Test
        @DisplayName("chat: unpublished / inactive material returns ResourceNotFoundException (404)")
        void chat_unavailableReturns404() {
            UUID materialId = UUID.randomUUID();
            when(aiMaterialService.getMaterialDetail("VOCABULARY", materialId))
                    .thenThrow(new ResourceNotFoundException("Vocabulary material not found or not available"));

            ChatRequest.MaterialInfo clientMaterial = new ChatRequest.MaterialInfo();
            clientMaterial.setId(materialId);
            clientMaterial.setType("VOCABULARY");
            clientMaterial.setContent("Pretend this is real content");

            ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                    () -> aiService.chat(userId, null, "Hi", "VOCABULARY", materialId, clientMaterial));
            assertTrue(ex.getMessage().toLowerCase().contains("not found"));
        }

        @Test
        @DisplayName("chat: missing materialType when materialId is supplied fails closed")
        void chat_missingTypeFailsClosed() {
            UUID materialId = UUID.randomUUID();
            ChatRequest.MaterialInfo clientMaterial = new ChatRequest.MaterialInfo();
            clientMaterial.setId(materialId);
            clientMaterial.setContent("client content should never reach the LLM");

            assertThrows(BadRequestException.class,
                    () -> aiService.chat(userId, null, "Hi", null, materialId, clientMaterial));
            // AI material service must NOT be consulted at all when type is missing
            verify(aiMaterialService, never()).getMaterialDetail(anyString(), any(UUID.class));
        }

        @Test
        @DisplayName("chat: no material reference → free-text behaviour preserved, AiMaterialService not called")
        void chat_noMaterialReferencePreservesFreeText() {
            ChatRequest.MaterialInfo clientMaterial = new ChatRequest.MaterialInfo();
            clientMaterial.setContent("");

            // Stub the conversation save path so the chat method can run
            // without NPE on the new AiConversation.
            UUID convId = UUID.randomUUID();
            com.midori.entity.AiConversation savedConv = com.midori.entity.AiConversation.builder()
                    .id(convId)
                    .user(com.midori.entity.User.builder().id(userId).build())
                    .title("Just a regular chat message")
                    .createdAt(java.time.Instant.now())
                    .updatedAt(java.time.Instant.now())
                    .build();
            when(conversationRepository.save(any(com.midori.entity.AiConversation.class))).thenReturn(savedConv);
            when(messageRepository.save(any(com.midori.entity.AiMessage.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // No NPE because the legacy fields are simply ignored at the trust boundary
            assertDoesNotThrow(() ->
                    aiService.chat(userId, null, "Just a regular chat message", null, null, clientMaterial));
            verify(aiMaterialService, never()).getMaterialDetail(anyString(), any(UUID.class));
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // QUIZ — TRUST BOUNDARY
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Quiz: trusted material resolution")
    class QuizTrustBoundary {

        @Test
        @DisplayName("valid material type+id resolves trusted content; fake client materialContent cannot override")
        void quiz_validReferenceResolvesTrustedContent() {
            UUID materialId = UUID.randomUUID();
            String trustedTitle = "Lesson 5";
            String trustedContent = "TRUSTED: 走る = hashiru = to run";
            when(aiMaterialService.getMaterialDetail("VOCABULARY", materialId))
                    .thenReturn(fakeMaterial("VOCABULARY", materialId, trustedTitle, "N5", trustedContent));
            when(aiCoreService.generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString()))
                    .thenReturn("{\"questions\": []}");

            GenerateQuestionsResponse response = aiService.generateQuestions(
                    userId, "Topic label", "N5", 3, "MULTIPLE_CHOICE",
                    "VOCABULARY", materialId,
                    "FAKE materialContent the client tries to inject",
                    "FAKE materialTitle the client tries to inject");

            assertNotNull(response);
            // Title returned to client must come from the DB, not from the client body
            assertEquals(trustedTitle, response.getMaterialTitle());

            ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);
            verify(aiCoreService).generateQuestions(
                    eq(trustedTitle), contentCaptor.capture(),
                    anyInt(), anyString(), anyString());
            // Captured content must be the trusted DB content, not the client fake
            assertEquals(trustedContent, contentCaptor.getValue());
        }

        @Test
        @DisplayName("quiz: invalid material reference does NOT fall back to client content")
        void quiz_invalidReferenceDoesNotFallBack() {
            UUID materialId = UUID.randomUUID();
            when(aiMaterialService.getMaterialDetail("VOCABULARY", materialId))
                    .thenThrow(new ResourceNotFoundException("Vocabulary material not found or not available"));

            assertThrows(ResourceNotFoundException.class,
                    () -> aiService.generateQuestions(
                            userId, "Topic", "N5", 5, "MULTIPLE_CHOICE",
                            "VOCABULARY", materialId,
                            "client tries to provide fake content",
                            "client tries to provide fake title"));

            // AI provider must NOT be called with the fake content
            verify(aiCoreService, never()).generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString());
        }

        @Test
        @DisplayName("quiz: missing materialType when materialId is supplied → BadRequestException")
        void quiz_missingTypeFailsClosed() {
            UUID materialId = UUID.randomUUID();

            assertThrows(BadRequestException.class,
                    () -> aiService.generateQuestions(
                            userId, "Topic", "N5", 5, "MULTIPLE_CHOICE",
                            null, materialId,
                            "some content", "some title"));

            verify(aiMaterialService, never()).getMaterialDetail(anyString(), any(UUID.class));
        }

        @Test
        @DisplayName("quiz: legacy free-text path (no materialId) still works with client materialContent")
        void quiz_legacyFreeTextPathPreserved() {
            when(aiCoreService.generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString()))
                    .thenReturn("{\"questions\": []}");

            GenerateQuestionsResponse response = aiService.generateQuestions(
                    userId, "Free topic", "N5", 3, "MULTIPLE_CHOICE",
                    null, null, "Manual content for free-text quiz", null);

            assertNotNull(response);
            verify(aiMaterialService, never()).getMaterialDetail(anyString(), any(UUID.class));
            verify(aiCoreService).generateQuestions(eq("Free topic"), eq("Manual content for free-text quiz"),
                    anyInt(), anyString(), anyString());
        }

        @Test
        @DisplayName("quiz: invalid materialType returns BadRequestException")
        void quiz_invalidTypeReturnsBadRequest() {
            UUID materialId = UUID.randomUUID();
            when(aiMaterialService.getMaterialDetail("BOGUS", materialId))
                    .thenThrow(new BadRequestException("Invalid material type: BOGUS"));

            assertThrows(BadRequestException.class,
                    () -> aiService.generateQuestions(
                            userId, "Topic", "N5", 5, "MULTIPLE_CHOICE",
                            "BOGUS", materialId,
                            "fake content", "fake title"));
        }
    }
}
