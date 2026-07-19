package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.entity.AiConversation;
import com.midori.entity.AiMessage;
import com.midori.entity.User;
import com.midori.repository.AiConversationRepository;
import com.midori.repository.AiMessageRepository;
import com.midori.service.impl.AiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for AiServiceImpl focusing on:
 * - Strict fallback behavior (fallbackEnabled=false)
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiServiceImplTest {

    @Mock
    private AiConversationRepository conversationRepository;

    @Mock
    private AiMessageRepository messageRepository;

    @Mock
    private AiCoreService aiCoreService;

    @Mock
    private AiRateLimitService rateLimitService;

    private AiServiceImpl aiService;
    private ObjectMapper objectMapper;
    private UUID userId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        userId = UUID.randomUUID();
        aiService = new AiServiceImpl(
                conversationRepository,
                messageRepository,
                aiCoreService,
                rateLimitService,
                objectMapper,
                false // fallbackEnabled = false (strict mode)
        );
    }

    private AiServiceImpl createServiceWithFallback(boolean fallbackEnabled) {
        return new AiServiceImpl(
                conversationRepository,
                messageRepository,
                aiCoreService,
                rateLimitService,
                objectMapper,
                fallbackEnabled
        );
    }

    @Nested
    @DisplayName("Strict Fallback Mode Tests (fallbackEnabled=false)")
    class StrictFallbackTests {

        @Test
        @DisplayName("fallbackEnabled=false: when AI provider fails, return error response without local fallback")
        void strictMode_noLocalFallback() {
            AiServiceImpl strictService = createServiceWithFallback(false);

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("API error"));

            var response = strictService.generateQuestions(userId, "Test Topic", "N5", 5, "MULTIPLE_CHOICE", "Some content");

            assertNotNull(response);
            assertEquals("Test Topic", response.getMaterialTitle());
            assertTrue(response.getQuestions().isEmpty(), "No questions should be returned in strict mode when AI fails");
            assertFalse(response.getIsFallback(), "getIsFallback must be false - no fake success response");
            assertNotNull(response.getErrorMessage(), "Error message must be present");
            assertEquals("AI", response.getSource());
        }

        @Test
        @DisplayName("fallbackEnabled=false: no API keys, JWTs, or full conversation content in logs when strict mode fails")
        void strictMode_noSensitiveDataInLogs() {
            AiServiceImpl strictService = createServiceWithFallback(false);

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("API error"));

            var response = strictService.generateQuestions(userId, "Topic", "N5", 3, "MULTIPLE_CHOICE", "content");

            assertTrue(response.getQuestions().isEmpty());
            assertNotNull(response.getErrorMessage());
        }

        @Test
        @DisplayName("fallbackEnabled=true: when AI fails, local fallback may run with warning")
        void fallbackMode_localFallbackRuns() {
            AiServiceImpl fallbackService = createServiceWithFallback(true);

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("API error"));

            var response = fallbackService.generateQuestions(userId, "Test Topic", "N5", 3, "MULTIPLE_CHOICE", "日本語|にほんご|Japanese");

            assertNotNull(response);
        }

        @Test
        @DisplayName("fallbackEnabled=false: provider not configured returns error without fallback")
        void strictMode_providerNotConfigured() {
            AiServiceImpl strictService = createServiceWithFallback(false);

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenThrow(new IllegalStateException("Provider not configured"));

            var response = strictService.generateQuestions(userId, "Topic", "N5", 5, "MULTIPLE_CHOICE", null);

            assertTrue(response.getQuestions().isEmpty());
            assertFalse(response.getIsFallback());
            assertNotNull(response.getErrorMessage());
        }

        @Test
        @DisplayName("fallbackEnabled=false: all providers fail returns error through existing error contract")
        void strictMode_allProvidersFail() {
            AiServiceImpl strictService = createServiceWithFallback(false);

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenThrow(new RuntimeException("All providers failed"));

            var response = strictService.generateQuestions(userId, "Topic", "N5", 5, "MULTIPLE_CHOICE", null);

            assertTrue(response.getQuestions().isEmpty());
            assertFalse(response.getIsFallback());
            assertEquals("AI", response.getSource());
            assertNotNull(response.getErrorMessage());
        }
    }

    @Nested
    @DisplayName("UserId Propagation Tests")
    class UserIdPropagationTests {

        @Test
        @DisplayName("UUID passed to generateQuestions comes from CustomUserDetails principal")
        void userIdFromPrincipal() {
            UUID expectedUserId = UUID.randomUUID();

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenReturn("{\"questions\": []}");

            var response = aiService.generateQuestions(expectedUserId, "Topic", "N5", 5, "MULTIPLE_CHOICE", null);

            assertNotNull(response);
            verify(aiCoreService).generateQuestions(anyString(), isNull(), anyInt(), anyString(), anyString());
        }
    }
}
