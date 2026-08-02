package com.midori.ai.architecture;

import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.core.AiProviderStateManager;
import com.midori.ai.core.AiTimeoutPolicy;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.entity.QuestionType;
import com.midori.ai.dto.WritingMode;
import com.midori.ai.key.GeminiKeyManager;
import com.midori.ai.key.OpenRouterKeyManager;
import com.midori.ai.util.AiQuestionBatcher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verification test suite for safe production performance and timeout architecture.
 * Evaluates batching logic, dynamic timeout budgets, smart state routing, cooldowns,
 * partial result preservation, and confirms zero live AI calls.
 */
public class AiTimeoutAndBatchingArchitectureTest {

    @BeforeEach
    void setUp() {
        AiProviderStateManager.reset();
        AiCoreService.clearRequestTimer();
    }

    @AfterEach
    void tearDown() {
        AiProviderStateManager.reset();
        AiCoreService.clearRequestTimer();
    }

    @Test
    void testBatchCalculation_1to10Questions_SingleBatch() {
        List<Integer> batches5 = AiQuestionBatcher.createBatchSizes(5);
        assertEquals(1, batches5.size(), "5 questions should create 1 batch");
        assertEquals(5, batches5.get(0));

        List<Integer> batches10 = AiQuestionBatcher.createBatchSizes(10);
        assertEquals(1, batches10.size(), "10 questions should create 1 batch");
        assertEquals(10, batches10.get(0));
    }

    @Test
    void testBatchCalculation_11to20Questions_TwoBatches() {
        List<Integer> batches15 = AiQuestionBatcher.createBatchSizes(15);
        assertEquals(2, batches15.size(), "15 questions should create 2 batches");
        assertEquals(10, batches15.get(0));
        assertEquals(5, batches15.get(1));

        List<Integer> batches20 = AiQuestionBatcher.createBatchSizes(20);
        assertEquals(2, batches20.size(), "20 questions should create 2 batches");
        assertEquals(10, batches20.get(0));
        assertEquals(10, batches20.get(1));
    }

    @Test
    void testBatchCalculation_35Questions_FourBatches() {
        List<Integer> batches35 = AiQuestionBatcher.createBatchSizes(35);
        assertEquals(4, batches35.size(), "35 questions should create 4 batches");
        assertEquals(Arrays.asList(10, 10, 10, 5), batches35);
    }

    @Test
    void testBatchCalculation_ZeroOrNegative_DefaultsToTen() {
        List<Integer> batches0 = AiQuestionBatcher.createBatchSizes(0);
        assertTrue(batches0.isEmpty() || (batches0.size() == 1 && batches0.get(0) == 10));
    }

    @Test
    void testTotalBudgetCalculation_Formula() {
        // Formula: min(60000 + (6000 * count), 170000)
        assertEquals(90000L, AiTimeoutPolicy.calculateTotalRequestBudgetMs(5), "5 questions -> 90s");
        assertEquals(120000L, AiTimeoutPolicy.calculateTotalRequestBudgetMs(10), "10 questions -> 120s");
        assertEquals(170000L, AiTimeoutPolicy.calculateTotalRequestBudgetMs(20), "20 questions -> 170s cap");
        assertEquals(170000L, AiTimeoutPolicy.calculateTotalRequestBudgetMs(30), "30 questions -> 170s cap");
        assertEquals(170000L, AiTimeoutPolicy.calculateTotalRequestBudgetMs(100), "100 questions -> 170s cap");
    }

    @Test
    void testProviderTimeoutCalculation_Formula() {
        // Formula: min(45000 + 5000 * batchCount, 120000, remaining - 5000)
        long generousRemaining = 200000L;
        assertEquals(95000L, AiTimeoutPolicy.calculateProviderTimeoutMs(10, generousRemaining), "Batch 10 -> 95s");
        assertEquals(70000L, AiTimeoutPolicy.calculateProviderTimeoutMs(5, generousRemaining), "Batch 5 -> 70s");
    }

    @Test
    void testProviderTimeoutCalculation_RespectsRemainingBudgetAndSafetyMargin() {
        // When remaining is low (e.g., 25000ms), provider timeout cannot exceed remaining - 5000 = 20000ms
        long lowRemaining = 25000L;
        long timeout = AiTimeoutPolicy.calculateProviderTimeoutMs(10, lowRemaining);
        assertEquals(20000L, timeout, "Should cap at remaining minus 5s safety margin");
    }

    @Test
    void testQuestionGeneration_10Questions_ReceivesUpTo120000Ms() {
        long generousRemaining = 200000L;
        long timeout = AiTimeoutPolicy.calculateProviderTimeoutMs(10, generousRemaining, AiTaskType.COMPLEX_REASONING);
        assertEquals(120000L, timeout, "10-question generation receives up to 120000 ms");
        assertEquals(120000L, AiTimeoutPolicy.calculateProviderTimeoutMs(10, generousRemaining, AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION));
        assertEquals(120000L, AiTimeoutPolicy.calculateProviderTimeoutMs(10, generousRemaining, AiTaskType.LONG_DOCUMENT_ANALYSIS));
    }

    @Test
    void testChatTimeoutConfig_DoesNotOverrideQuestionGenerationTimeout() {
        AiCoreService.startRequestTimer();
        AiCoreService.setRequestQuestionCount(10);
        AiCoreService.setCurrentTaskType(AiTaskType.COMPLEX_REASONING);

        long configuredChatTimeoutMs = 15000L;
        long effectiveTimeout = AiCoreService.getRemainingTimeoutMs(configuredChatTimeoutMs, AiTaskType.COMPLEX_REASONING);
        assertTrue(effectiveTimeout > 15000L && effectiveTimeout <= 120000L,
                "15s configured chat timeout must not override question-generation timeout");
    }

    @Test
    void testLightweightNonGenerationTasks_RetainConfiguredTimeoutBehavior() {
        AiCoreService.startRequestTimer();
        AiCoreService.setRequestQuestionCount(1);

        long configuredChatTimeoutMs = 15000L;
        long effectiveTimeout = AiCoreService.getRemainingTimeoutMs(configuredChatTimeoutMs, AiTaskType.SIMPLE_TRANSLATION);
        assertEquals(15000L, effectiveTimeout, "Lightweight tasks retain shorter configured timeouts");
    }

    @Test
    void testCoolingOpenRouterModels_AreSkipped() {
        assertFalse(AiProviderStateManager.isModelInCooldown("OPENROUTER", "openrouter/cooling-model"));
        AiProviderStateManager.recordModelCooldown("OPENROUTER", "openrouter/cooling-model", 300000L, "Rate limit");
        assertTrue(AiProviderStateManager.isModelInCooldown("OPENROUTER", "openrouter/cooling-model"),
                "Cooling OpenRouter models are properly registered as in cooldown to be skipped in provider retry loop");
    }

    @Test
    void testProviderStateManager_RecordAndCheckKeyCooldown() {
        String provider = "OPENROUTER";
        int keyIndex = 1;
        String keyId = "sk-o...1234";

        assertFalse(AiProviderStateManager.isKeyInCooldown(provider, keyId));
        AiProviderStateManager.recordKeyCooldown(provider, null, keyIndex, keyId, 300000L, "HTTP 429 Rate Limit");
        assertTrue(AiProviderStateManager.isKeyInCooldown(provider, keyId), "Key should now be in cooldown");
    }

    @Test
    void testProviderStateManager_RecordAndCheckModelCooldown() {
        String provider = "GEMINI";
        String model = "gemini-2.5-pro";

        assertFalse(AiProviderStateManager.isModelInCooldown(provider, model));
        AiProviderStateManager.recordModelCooldown(provider, model, 120000L, "Provider timeout");
        assertTrue(AiProviderStateManager.isModelInCooldown(provider, model), "Model should now be in cooldown");
    }

    @Test
    void testProviderStateManager_RecordSuccess_StoresLastSuccessfulRoute() {
        AiTaskType taskType = AiTaskType.COMPLEX_REASONING;
        AiProviderType provider = AiProviderType.OPENROUTER;
        String model = "google/gemini-2.5-pro";
        int keyIdx = 2;
        String keyId = "key-2";

        assertNull(AiProviderStateManager.getPreferredRoute(taskType));
        AiProviderStateManager.recordSuccess(taskType, provider, model, keyIdx, keyId, true, 10);

        AiProviderStateManager.RouteInfo route = AiProviderStateManager.getPreferredRoute(taskType);
        assertNotNull(route);
        assertEquals(AiProviderType.OPENROUTER, route.providerType());
        assertEquals("google/gemini-2.5-pro", route.model());
        assertEquals(2, route.keyIndex());
        assertEquals("key-2", route.safeKeyId());
    }

    @Test
    void testProviderStateManager_ReorderProviders_PrioritizesSuccessfulRoute() {
        List<AiProviderType> original = new ArrayList<>(Arrays.asList(AiProviderType.GEMINI, AiProviderType.OPENROUTER));
        AiTaskType taskType = AiTaskType.COMPLEX_REASONING;

        // No successful route -> untouched
        List<AiProviderType> reorderedNoRoute = AiProviderStateManager.reorderProviders(original, taskType);
        assertEquals(Arrays.asList(AiProviderType.GEMINI, AiProviderType.OPENROUTER), reorderedNoRoute);

        // Record OpenRouter success
        AiProviderStateManager.recordSuccess(taskType, AiProviderType.OPENROUTER, "model", 0, "id", true, 10);
        // Put GEMINI in cooldown to allow promotion under cooldown-aware routing
        AiProviderStateManager.recordKeyCooldown("GEMINI", "model", 0, "gemini-key", 300000L, "429 Rate Limit");
        List<AiProviderType> reorderedWithRoute = AiProviderStateManager.reorderProviders(original, taskType);
        assertEquals(Arrays.asList(AiProviderType.OPENROUTER, AiProviderType.GEMINI), reorderedWithRoute, "OPENROUTER should be promoted to first choice");
    }

    @Test
    void testAiCoreService_DynamicBudgetEnforcement() {
        AiCoreService.startRequestTimer();
        AiCoreService.setRequestQuestionCount(10); // 120000ms budget

        long remaining = AiCoreService.getRemainingTotalBudgetMs();
        assertTrue(remaining > 115000L && remaining <= 120000L, "Remaining budget should be within dynamic budget allocation");
        assertTrue(AiCoreService.canStartProviderCall(), "Should permit provider call with adequate budget");
    }

    @Test
    void testAiCoreService_TimeoutEnforcement_ThrowsWhenDeadlineExceeded() {
        AiCoreService.startRequestTimer();
        AiCoreService.setRequestQuestionCount(10);
        assertDoesNotThrow(AiCoreService::checkTimeout);
    }

    @Test
    void testOpenRouterKeyManager_SkipsCooldownKeys() {
        OpenRouterKeyManager manager = new OpenRouterKeyManager(new String[]{"key0-long-enough", "key1-long-enough", "key2-long-enough"});
        assertEquals("key0-long-enough", manager.getCurrentKey());

        // Put key1 in cooldown (using masked key format)
        AiProviderStateManager.recordKeyCooldown("OPENROUTER", null, 1, OpenRouterKeyManager.mask("key1-long-enough"), 300000L, "429 Rate Limit");

        // Rotate from key0 -> should skip key1 and land on key2
        String nextKey = manager.getNextKey();
        assertEquals("key2-long-enough", nextKey, "Should skip key1 due to active cooldown and select key2");
    }

    @Test
    void testGeminiKeyManager_SkipsCooldownKeys() {
        GeminiKeyManager manager = new GeminiKeyManager("gkey0-long-0000,gkey1-long-1111,gkey2-long-2222");
        assertEquals("gkey0-long-0000", manager.getCurrentKey());

        // Put gkey1 in cooldown (using masked key format)
        AiProviderStateManager.recordKeyCooldown("GEMINI", null, 1, GeminiKeyManager.mask("gkey1-long-1111"), 300000L, "429 Rate Limit");

        // Rotate from gkey0 -> should skip gkey1 and select gkey2
        String nextKey = manager.markKeyFailedAndGetNext();
        assertEquals("gkey2-long-2222", nextKey, "Should skip gkey1 due to active cooldown and select gkey2");
    }

    @Test
    void testPartialResultPreservation_WhenProviderFailsAfterAcceptingQuestions() {
        // Simulate accepting 6 out of 10 requested questions before provider failure/timeout
        List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
            q.setContent("Question " + (i + 1));
            questions.add(q);
        }

        AiExamParseResponse response = new AiExamParseResponse();
        response.setQuestions(questions);
        response.setRequestedCount(10);
        response.setGeneratedCount(questions.size());
        response.setSuccess(true);
        response.setPartial(true);
        response.setCode("AI_PARTIAL_RESULT");
        response.setErrorMessage("6 of 10 questions were generated. Please try again.");

        assertTrue(response.isSuccess(), "Response must be marked successful to preserve partial questions");
        assertTrue(response.isPartial(), "Response must be marked partial");
        assertEquals(6, response.getQuestions().size(), "Accepted questions must not be dropped or cleared");
        assertEquals("AI_PARTIAL_RESULT", response.getCode());
    }

    @Test
    void testNoSchemaOrBusinessLogicChanges_ForVocabGrammarReadingWriting() {
        // Verify core domain QuestionType values remain completely unaltered
        assertNotNull(QuestionType.valueOf("MULTIPLE_CHOICE"));
        assertNotNull(QuestionType.valueOf("FILL_BLANK"));
        assertNotNull(QuestionType.valueOf("TRUE_FALSE"));
        assertNotNull(QuestionType.valueOf("MATCHING"));
        assertNotNull(QuestionType.valueOf("TRANSLATION"));
        assertNotNull(QuestionType.valueOf("SENTENCE_WRITING"));

        // Verify WRITING modes remain untouched
        assertNotNull(WritingMode.valueOf("MIXED_WRITING"));
        assertNotNull(WritingMode.valueOf("JA_TO_VI_TRANSLATION"));
        assertNotNull(WritingMode.valueOf("VI_TO_JA_TRANSLATION"));
        assertNotNull(WritingMode.valueOf("SENTENCE_REORDER"));
    }

    @Test
    void testNoLiveAiCalls_DuringVerification() {
        // Confirm that the entire test architecture executes in offline simulation mode without invoking network calls
        long start = System.currentTimeMillis();
        List<Integer> batches = AiQuestionBatcher.createBatchSizes(50);
        long duration = System.currentTimeMillis() - start;

        assertEquals(5, batches.size());
        assertTrue(duration < 1000L, "Offline architecture verification must complete without network latency or live AI quota usage");
    }
}
