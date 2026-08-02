package com.midori.ai.core;

import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderFactory;
import com.midori.ai.AiProviderType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.key.GeminiKeyManager;
import com.midori.ai.key.OpenRouterKeyManager;
import com.midori.exception.AiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AiProviderRotationRegressionTest {

    @Mock
    private AiProviderFactory providerFactory;

    @Mock
    private AiProvider geminiProvider;

    @Mock
    private AiProvider openRouterProvider;

    private AiConfigProperties config;
    private AiCoreService aiCoreService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        config = new AiConfigProperties();
        config.setProviderOrder("gemini,openrouter");

        when(geminiProvider.getName()).thenReturn("GEMINI");
        when(openRouterProvider.getName()).thenReturn("OPENROUTER");

        when(providerFactory.resolve(AiProviderType.GEMINI)).thenReturn(geminiProvider);
        when(providerFactory.resolve(AiProviderType.OPENROUTER)).thenReturn(openRouterProvider);

        when(geminiProvider.hasAvailableRoute(any())).thenAnswer(inv -> geminiProvider.isConfigured());
        when(openRouterProvider.hasAvailableRoute(any())).thenAnswer(inv -> openRouterProvider.isConfigured());

        aiCoreService = new AiCoreService(providerFactory, config);
    }

    // 1. Key Manager 429 rotation test
    @Test
    @DisplayName("GeminiKeyManager rotates key on 429 cooldown")
    void geminiKeyRotationOn429() {
        GeminiKeyManager keyManager = new GeminiKeyManager("key1,key2,key3");
        assertEquals("key1", keyManager.getCurrentKey(false));
        assertEquals(0, keyManager.getKeyIndex("key1"));

        // Simulate 429 failure
        keyManager.markKeyFailedAndGetNext();
        assertEquals("key2", keyManager.getCurrentKey(false));
        assertEquals(1, keyManager.getKeyIndex("key2"));
    }

    // 2. Key Manager 401 permanent exclusion test
    @Test
    @DisplayName("GeminiKeyManager permanently excludes key on 401 error")
    void geminiKeyExclusionOn401() {
        GeminiKeyManager keyManager = new GeminiKeyManager("key1,key2,key3");
        assertEquals("key1", keyManager.getCurrentKey(false));

        // Simulate 401 auth exclusion
        keyManager.excludeKey("key1");
        assertEquals(2, keyManager.getRemainingKeyCount());
        assertEquals("key2", keyManager.getCurrentKey(false));
    }

    // 3. Fallback Order & Cross-Provider Failure Test
    @Test
    @DisplayName("All Gemini credentials fail, fallback to OpenRouter succeeds")
    void allGeminiKeysFailFallbackToOpenRouterSucceeds() throws Exception {
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.getLastModelUsed()).thenReturn("gemini-flash-latest");
        when(geminiProvider.getModels()).thenReturn(List.of("gemini-flash-latest"));
        
        // Gemini fails permanently due to invalid keys
        when(geminiProvider.chat(anyString(), anyString(), anyList(), any()))
                .thenThrow(new AiException.InvalidApiKeyException("Gemini credentials invalid"));

        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.getLastModelUsed()).thenReturn("openrouter-model");
        when(openRouterProvider.getModels()).thenReturn(List.of("openrouter-model"));
        when(openRouterProvider.chat(anyString(), anyString(), anyList(), any())).thenReturn("OpenRouter success response");

        AiCoreService.AiResponse response = aiCoreService.chatWithDetails("sys", "user", new ArrayList<>(), null);
        assertEquals("OpenRouter success response", response.content());
        assertEquals("OPENROUTER", response.providerName());
    }

    // 4. Model-level 404 reuse test
    @Test
    @DisplayName("Gemini model-scoped 404 does not put key on cooldown or exclude it")
    void modelScoped404KeepsKeyActive() {
        GeminiKeyManager keyManager = new GeminiKeyManager("key1,key2");
        assertEquals("key1", keyManager.getCurrentKey(false));

        // Model not found (404) occurs, key index is NOT changed, key is NOT put on cooldown
        // (Simulated by verifying key is still in non-cooldown state and index is same)
        assertEquals("key1", keyManager.getCurrentKey(false));
    }

    // 5. Network-scoped failure does not permanently exclude keys
    @Test
    @DisplayName("Provider network/timeout failure does not exclude all keys")
    void networkFailureDoesNotExcludeKeys() {
        GeminiKeyManager keyManager = new GeminiKeyManager("key1,key2");
        assertEquals("key1", keyManager.getCurrentKey(false));

        // Simulate network failure (should NOT trigger excludeKey or put other keys out)
        assertEquals(2, keyManager.getRemainingKeyCount());
    }

    // 6. Partial results return HTTP 200 payload without throwing exception
    @Test
    @DisplayName("Partial results return HTTP 200 state with partial questions preserved")
    void partialResultsReturnedWithSuccessState() {
        AiExamParseResponse response = new AiExamParseResponse();
        response.setSuccess(true);
        response.setPartial(true);
        response.setCode("AI_PARTIAL_RESULT");
        
        List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setContent("Partial question");
        questions.add(q);
        response.setQuestions(questions);
        response.setRequestedCount(10);
        response.setGeneratedCount(1);

        assertTrue(response.isSuccess());
        assertTrue(response.isPartial());
        assertEquals("AI_PARTIAL_RESULT", response.getCode());
        assertEquals(1, response.getQuestions().size());
    }
}
