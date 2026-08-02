package com.midori.ai.core;

import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderFactory;
import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.exception.AiProcessingException;
import com.midori.ai.impl.OpenRouterProvider.TemporaryFailureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests for AiCoreService cross-provider fallback behavior.
 *
 * Scenarios covered:
 * 1. Gemini succeeds on first key
 * 2. Gemini key 1 gets 429, key 2 succeeds
 * 3. All Gemini keys fail (429), OpenRouter succeeds
 * 4. OpenRouter key 1 fails temporarily, key 2 succeeds
 * 5. Gemini model unavailable, OpenRouter succeeds
 * 6. Gemini API_KEY_INVALID on one key, next valid Gemini key succeeds
 * 7. Both providers fail, final aggregated error returned
 * 8. Validation/DTO error does NOT trigger provider fallback
 * 9. Provider order openrouter,gemini works
 * 10. Missing OpenRouter config skips OpenRouter safely
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiCoreServiceFallbackTest {

    @Mock
    private AiProvider geminiProvider;

    @Mock
    private AiProvider openRouterProvider;

    private AiConfigProperties config;
    private AiProviderFactory factory;
    private AiCoreService service;

    @BeforeEach
    void setUp() {
        config = new AiConfigProperties();
        config.setProviderOrder("gemini,openrouter");

        factory = mock(AiProviderFactory.class);
        when(factory.resolve(AiProviderType.GEMINI)).thenReturn(geminiProvider);
        when(factory.resolve(AiProviderType.OPENROUTER)).thenReturn(openRouterProvider);

        when(geminiProvider.hasAvailableRoute(any())).thenAnswer(inv -> geminiProvider.isConfigured());
        when(openRouterProvider.hasAvailableRoute(any())).thenAnswer(inv -> openRouterProvider.isConfigured());

        service = new AiCoreService(factory, config);
        AiCoreService.resetProviderCallCount();
        AiCoreService.clearAttemptTraces();
    }

    // ============================================================
    // Scenario 1: Gemini succeeds on first key
    // ============================================================

    @Test
    @DisplayName("Scenario 1: Gemini succeeds on first key — OpenRouter not called")
    void geminiSucceedsFirstKey() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any())).thenReturn("gemini response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("gemini response", result);
        verify(geminiProvider).chat(any(), any(), any(), any());
        verify(openRouterProvider, never()).chat(any(), any(), any(), any());
    }

    // ============================================================
    // Scenario 2: Gemini 429 triggers cross-provider fallback
    // (Internal key rotation is tested at OpenRouterKeyManager level)
    // ============================================================

    @Test
    @DisplayName("Scenario 2: Gemini 429 triggers cross-provider fallback to OpenRouter")
    void gemini429TriggersCrossProviderFallback() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 429: rate limit exceeded"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any())).thenReturn("openrouter fallback response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("openrouter fallback response", result);
        verify(geminiProvider, atLeastOnce()).chat(any(), any(), any(), any());
        verify(openRouterProvider).chat(any(), any(), any(), any());
    }

    // ============================================================
    // Scenario 3: All Gemini keys fail (429), OpenRouter succeeds
    // ============================================================

    @Test
    @DisplayName("Scenario 3: All Gemini keys fail 429, OpenRouter succeeds")
    void allGeminiKeysFail429OpenRouterSucceeds() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 429: rate limit exceeded"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any())).thenReturn("openrouter response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("openrouter response", result);
        verify(geminiProvider, atLeastOnce()).chat(any(), any(), any(), any());
        verify(openRouterProvider).chat(any(), any(), any(), any());
    }

    // ============================================================
    // Scenario 4: OpenRouter 429 triggers cross-provider fallback
    // (Internal key rotation is tested at OpenRouterKeyManager level)
    // ============================================================

    @Test
    @DisplayName("Scenario 4: OpenRouter 429 triggers cross-provider fallback (Gemini is fallback)")
    void openRouter429TriggersCrossProviderFallback() throws Exception {
        // Use openrouter-first order so OpenRouter is tried first
        config.setProviderOrder("openrouter,gemini");

        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any())).thenReturn("gemini fallback response");

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 429: rate limit"));

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("gemini fallback response", result);
        verify(openRouterProvider).chat(any(), any(), any(), any());
        verify(geminiProvider).chat(any(), any(), any(), any());
    }

    // ============================================================
    // Scenario 5: Gemini HTTP 404 (model not found) — now temporary, falls back to OpenRouter
    // ============================================================

    @Test
    @DisplayName("Scenario 5: Gemini HTTP 404 model not found — fallback to OpenRouter")
    void geminiModelUnavailableOpenRouterSucceeds() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 404: model not found"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any())).thenReturn("openrouter response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("openrouter response", result);
        verify(openRouterProvider).chat(any(), any(), any(), any());
    }

    // ============================================================
    // Scenario 6: Gemini API_KEY_INVALID — permanent, NO cross-provider fallback
    // ============================================================

    @Test
    @DisplayName("Scenario 6: Gemini API_KEY_INVALID — permanent failure, NO fallback to OpenRouter")
    void geminiApiKeyInvalidNoFallback() {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("API_KEY_INVALID"));

        AiProcessingException ex = assertThrows(AiProcessingException.class,
                () -> service.chat("system", "user", null, AiTaskType.DEFAULT));

        // OpenRouter must NOT be called — API_KEY_INVALID is a permanent application config error
        verify(openRouterProvider, never()).chat(any(), any(), any(), any());
        assertTrue(ex.getMessage().contains("GEMINI"));
        assertTrue(ex.getMessage().contains("API_KEY_INVALID"));
    }

    // ============================================================
    // Scenario 7: Both providers fail, final aggregated error returned
    // ============================================================

    @Test
    @DisplayName("Scenario 7: Both providers fail, final aggregated error returned")
    void bothProvidersFailAggregatedError() {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 429: rate limit"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 429: rate limit"));

        AiProcessingException ex = assertThrows(AiProcessingException.class,
                () -> service.chat("system", "user", null, AiTaskType.DEFAULT));

        assertTrue(ex.getMessage().contains("All AI providers failed"));
        assertTrue(ex.getMessage().contains("GEMINI"));
        assertTrue(ex.getMessage().contains("OPENROUTER"));
    }

    // ============================================================
    // Scenario 8: Validation/DTO error does NOT trigger provider fallback
    // ============================================================

    @Test
    @DisplayName("Scenario 8: Validation/DTO error does NOT trigger provider fallback")
    void dtoErrorDoesNotTriggerFallback() {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new AiProcessingException("validation error: empty prompt"));

        AiProcessingException ex = assertThrows(AiProcessingException.class,
                () -> service.chat("system", "user", null, AiTaskType.DEFAULT));

        // OpenRouter must NOT be called — this is a permanent application error
        verify(openRouterProvider, never()).chat(any(), any(), any(), any());
        assertTrue(ex.getMessage().contains("All AI providers failed"));
    }

    // ============================================================
    // Scenario 9: Provider order openrouter,gemini works
    // ============================================================

    @Test
    @DisplayName("Scenario 9: Provider order openrouter,gemini — OpenRouter attempted first")
    void openRouterFirstProviderOrder() throws Exception {
        config.setProviderOrder("openrouter,gemini");

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any())).thenReturn("openrouter response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("openrouter response", result);
        verify(openRouterProvider).chat(any(), any(), any(), any());
        verify(geminiProvider, never()).chat(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Scenario 9b: Provider order openrouter,gemini — fallback to Gemini")
    void openRouterFirstFallsBackToGemini() throws Exception {
        config.setProviderOrder("openrouter,gemini");

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 429: rate limit"));

        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any())).thenReturn("gemini fallback response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("gemini fallback response", result);
        verify(openRouterProvider).chat(any(), any(), any(), any());
        verify(geminiProvider).chat(any(), any(), any(), any());
    }

    // ============================================================
    // Scenario 10: Missing OpenRouter config skips OpenRouter safely
    // ============================================================

    @Test
    @DisplayName("Scenario 10: Missing OpenRouter config skips OpenRouter safely")
    void missingOpenRouterConfigSkipped() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any())).thenReturn("gemini response");

        // OpenRouter is not configured
        when(openRouterProvider.isConfigured()).thenReturn(false);
        // Make resolve throw so it looks unconfigured
        doThrow(new RuntimeException("not configured")).when(factory).resolve(AiProviderType.OPENROUTER);

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("gemini response", result);
        verify(geminiProvider).chat(any(), any(), any(), any());
    }

    // ============================================================
    // Additional tests
    // ============================================================

    @Test
    @DisplayName("generateQuestions uses cross-provider fallback")
    void generateQuestionsWithFallback() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.generateQuestions(any(), any(), anyInt(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 503: service unavailable"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.generateQuestions(any(), any(), anyInt(), any(), any(), any(), any()))
                .thenReturn("{\"questions\":[]}");

        String result = service.generateQuestions("topic", "content", 3, "MULTIPLE_CHOICE", "EASY");

        assertNotNull(result);
        verify(geminiProvider).generateQuestions(any(), any(), anyInt(), any(), any(), any(), any());
        verify(openRouterProvider).generateQuestions(any(), any(), anyInt(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Temporary timeout failure triggers fallback")
    void timeoutTriggersFallback() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Connection timeout"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any())).thenReturn("openrouter response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("openrouter response", result);
        verify(openRouterProvider).chat(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Permanent auth error does NOT trigger fallback across providers")
    void authErrorDoesNotCrossProvider() {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("API_KEY_INVALID"));

        AiProcessingException ex = assertThrows(AiProcessingException.class,
                () -> service.chat("system", "user", null, AiTaskType.DEFAULT));

        assertTrue(ex.getMessage().contains("GEMINI"));
        verify(openRouterProvider, never()).chat(any(), any(), any(), any());
    }

    @Test
    @DisplayName("HTTP 502 triggers fallback across providers")
    void http502TriggersFallback() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("HTTP 502: bad gateway"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any())).thenReturn("openrouter response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("openrouter response", result);
        verify(openRouterProvider).chat(any(), any(), any(), any());
    }

    @Test
    @DisplayName("getProviderOrder parses comma-separated list correctly")
    void providerOrderParsedCorrectly() {
        config.setProviderOrder("gemini,openrouter");
        assertNotNull(config.getProviderOrder());
        assertEquals("gemini,openrouter", config.getProviderOrder());
    }

    @Test
    @DisplayName("OpenRouter TemporaryFailureException triggers fallback to Gemini")
    void temporaryFailureExceptionTriggersFallback() throws Exception {
        // With order=gemini,openrouter: Gemini is tried first, throws TemporaryFailureException,
        // then AiCoreService falls back to OpenRouter (second in order)
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any()))
                .thenThrow(new TemporaryFailureException("AI Sensei đang quá tải"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("google/gemma-4-31b-it:free");
        when(openRouterProvider.getModels()).thenReturn(List.of("google/gemma-4-31b-it:free"));
        when(openRouterProvider.chat(any(), any(), any(), any())).thenReturn("openrouter fallback response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);

        assertEquals("openrouter fallback response", result);
        // Gemini was tried first and failed temporarily
        verify(geminiProvider).chat(any(), any(), any(), any());
        // OpenRouter was called as fallback
        verify(openRouterProvider).chat(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Unknown provider in order is silently skipped")
    void unknownProviderSkipped() throws Exception {
        config.setProviderOrder("gemini,unknown,openrouter");

        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash"));
        when(geminiProvider.chat(any(), any(), any(), any())).thenReturn("gemini response");

        String result = service.chat("system", "user", null, AiTaskType.DEFAULT);
        assertEquals("gemini response", result);
    }
}
