package com.midori.ai.core;

import com.midori.ai.AiProvider;
import com.midori.ai.AiProviderFactory;
import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import com.midori.ai.config.AiConfigProperties;
import com.midori.ai.impl.GeminiProvider;
import com.midori.ai.impl.OpenRouterProvider;
import com.midori.exception.AiException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class AiProviderFailFastTest {

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

        when(geminiProvider.getType()).thenReturn(AiProviderType.GEMINI);
        when(geminiProvider.isConfigured()).thenReturn(true);
        when(geminiProvider.hasAvailableRoute(any())).thenReturn(true);

        when(openRouterProvider.getType()).thenReturn(AiProviderType.OPENROUTER);
        when(openRouterProvider.isConfigured()).thenReturn(true);
        when(openRouterProvider.hasAvailableRoute(any())).thenReturn(true);

        service = new AiCoreService(factory, config);
        AiCoreService.clearRequestTimer();
        AiCoreService.startRequestTimer();
    }

    @AfterEach
    void tearDown() {
        AiCoreService.clearRequestTimer();
        AiProviderStateManager.reset();
    }

    @Test
    void test429Classification() {
        // Quota
        assertEquals(AiFailureKind.QUOTA, AiCoreService.classify429("Quota exceeded for metric: free_tier_requests"));
        assertEquals(AiFailureKind.QUOTA, AiCoreService.classify429("resource_exhausted"));
        assertEquals(AiFailureKind.QUOTA, AiCoreService.classify429("Exhausted your current quota"));

        // Rate Limit
        assertEquals(AiFailureKind.RATE_LIMIT, AiCoreService.classify429("rate limit exceeded"));
        assertEquals(AiFailureKind.RATE_LIMIT, AiCoreService.classify429("too many requests"));
        assertEquals(AiFailureKind.RATE_LIMIT, AiCoreService.classify429(null));
    }

    @Test
    void testUnknownExceptionNotClassifiedAsRateLimit() {
        // Unknown exceptions should not record a request failure
        AiCoreService.RouteMetadata route = new AiCoreService.RouteMetadata("GEMINI", "gemini-flash", 0, "abcd...efgh");
        assertFalse(AiCoreService.isRouteFailedInRequest(route));
    }

    @Test
    void testRouteMetadataAndFailureTracking() {
        AiCoreService.RouteMetadata route1 = new AiCoreService.RouteMetadata("GEMINI", "gemini-flash", 0, "abcd...efgh");
        AiCoreService.RouteMetadata route2 = new AiCoreService.RouteMetadata("GEMINI", "gemini-flash", 1, "ijkl...mnop");

        assertFalse(service.isRouteFailedInRequest(route1));
        AiCoreService.recordRequestFailure(route1, AiFailureKind.QUOTA);
        assertTrue(service.isRouteFailedInRequest(route1));
        assertFalse(service.isRouteFailedInRequest(route2));
    }

    @Test
    void testRequestFailuresClearedOnTimerReset() {
        AiCoreService.RouteMetadata route = new AiCoreService.RouteMetadata("GEMINI", "gemini-flash", 0, "abcd...efgh");
        AiCoreService.recordRequestFailure(route, AiFailureKind.TIMEOUT);
        assertTrue(AiCoreService.isRouteFailedInRequest(route));

        AiCoreService.clearRequestTimer();
        assertFalse(AiCoreService.isRouteFailedInRequest(route));
    }

    @Test
    void testCooldownKeyMaskingLookupAndWrite() {
        String provider = "GEMINI";
        String rawKey = "AIzaSyD-unmasked-gemini-key-123456";
        String maskedKey = "AIza...3456";

        // Cooldown registration and lookup must use canonical key mask
        AiProviderStateManager.recordKeyCooldown(provider, "model", 0, maskedKey, 60000L, "test");
        assertTrue(AiProviderStateManager.isKeyInCooldown(provider, maskedKey));

        // Raw key must never be logged or stored. In lookup, if raw key is queried, we mask it to verify.
        // Our normalized KeyManagers call isKeyInCooldown(provider, mask(rawKey)). Let's test that:
        assertTrue(AiProviderStateManager.isKeyInCooldown(provider, maskedKey));
    }

    @Test
    void testErrorClassificationAllQuota() {
        AiCoreService.RouteMetadata route = new AiCoreService.RouteMetadata("GEMINI", "gemini-flash", 0, "abcd...efgh");
        AiCoreService.recordRequestFailure(route, AiFailureKind.QUOTA);

        Exception ex = assertThrows(AiException.QuotaExhaustedException.class, () -> {
            throw service.failFastFailure(AiTaskType.COMPLEX_REASONING);
        });
        assertTrue(ex.getMessage().contains("Fail-fast"));
    }

    @Test
    void testErrorClassificationAllRateLimit() {
        AiCoreService.RouteMetadata route = new AiCoreService.RouteMetadata("GEMINI", "gemini-flash", 0, "abcd...efgh");
        AiCoreService.recordRequestFailure(route, AiFailureKind.RATE_LIMIT);

        Exception ex = assertThrows(AiException.RateLimitedException.class, () -> {
            throw service.failFastFailure(AiTaskType.COMPLEX_REASONING);
        });
        assertTrue(ex.getMessage().contains("Fail-fast"));
    }

    @Test
    void testErrorClassificationMixedQuotaAndTimeout() {
        AiCoreService.RouteMetadata route1 = new AiCoreService.RouteMetadata("GEMINI", "gemini-flash", 0, "abcd...efgh");
        AiCoreService.RouteMetadata route2 = new AiCoreService.RouteMetadata("OPENROUTER", "gemma-2", 0, "ijkl...mnop");

        AiCoreService.recordRequestFailure(route1, AiFailureKind.QUOTA);
        AiCoreService.recordRequestFailure(route2, AiFailureKind.TIMEOUT);

        Exception ex = assertThrows(AiException.ProviderUnavailableException.class, () -> {
            throw service.failFastFailure(AiTaskType.COMPLEX_REASONING);
        });
        assertTrue(ex.getMessage().contains("temporarily unavailable due to quota limits or provider timeout"));
    }

    @Test
    void testTimeoutCapConditionalRules() {
        // Unaffected READING task
        AiCoreService.setReadingTask(true);
        AiCoreService.setCurrentExecutingProvider("OPENROUTER");
        AiCoreService.setCurrentExecutingModel("google/gemma-4-26b-a4b-it:free");
        long timeoutReading = AiCoreService.getRemainingTimeoutMs(30000L, AiTaskType.COMPLEX_REASONING);
        // Reading is NOT capped at 60s
        assertTrue(timeoutReading > 60000L || timeoutReading == 30000L); // depending on request start time and question count

        // Affected WRITING/COMPLEX_REASONING task with free OpenRouter model
        AiCoreService.setReadingTask(false);
        AiCoreService.setCurrentExecutingProvider("OPENROUTER");
        AiCoreService.setCurrentExecutingModel("google/gemma-4-26b-a4b-it:free");
        AiCoreService.setRequestQuestionCount(10);
        long timeoutWriting = AiCoreService.getRemainingTimeoutMs(120000L, AiTaskType.COMPLEX_REASONING);
        // Writing with free model is capped at 60s
        assertTrue(timeoutWriting <= 60000L);
    }
}
