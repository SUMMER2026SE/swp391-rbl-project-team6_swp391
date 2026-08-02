package com.midori.ai.prompt;

import com.midori.ai.AiProviderType;
import com.midori.ai.AiTaskType;
import com.midori.ai.core.AiProviderStateManager;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AiPromptPerformanceOptimizationTest {

    @Test
    void testConciseExplanationRuleIsPresentInPrompts() {
        // Test distribution prompt
        String distributionPrompt = AiPromptBuilder.buildQuizGenerationPromptWithDistribution(
                "Title", "Content", 10, "TRUE_FALSE", "EASY=3,MEDIUM=5,HARD=2", List.of("GRAMMAR")
        );
        assertTrue(distributionPrompt.contains("Each explanation must be extremely concise and strictly exactly one sentence"));

        // Test skills prompt
        String skillsPrompt = AiPromptBuilder.buildQuizGenerationPrompt(
                "Title", "Content", 10, "TRUE_FALSE", "Medium", List.of("GRAMMAR")
        );
        assertTrue(skillsPrompt.contains("Each explanation must be extremely concise and strictly exactly one sentence"));
    }

    @Test
    void testReorderProvidersPrefersHealthyDefaultFirstProvider() {
        AiProviderStateManager.reset();

        List<AiProviderType> defaultOrder = List.of(AiProviderType.GEMINI, AiProviderType.OPENROUTER);
        
        // 1. Success on OpenRouter (due to earlier Gemini failure) registers OpenRouter as preferred route
        AiProviderStateManager.recordSuccess(
                AiTaskType.COMPLEX_REASONING, AiProviderType.OPENROUTER, "google/gemma-4-26b-a4b-it:free", 1, "key1", true, 10
        );

        // 2. Since Gemini has NO active cooldowns (it is healthy), reorderProviders should try GEMINI first!
        List<AiProviderType> order = AiProviderStateManager.reorderProviders(defaultOrder, AiTaskType.COMPLEX_REASONING);
        assertEquals(AiProviderType.GEMINI, order.get(0), "Gemini should be tried first since it is healthy with no cooldowns");

        // 3. Now simulate Gemini getting a cooldown (cooldown active)
        AiProviderStateManager.recordKeyCooldown("GEMINI", "gemini-flash-latest", 0, "gemini-key-0", 100000L, "429");

        // 4. Since Gemini has active cooldowns, OpenRouter (preferred) should be promoted!
        List<AiProviderType> orderWithCooldown = AiProviderStateManager.reorderProviders(defaultOrder, AiTaskType.COMPLEX_REASONING);
        assertEquals(AiProviderType.OPENROUTER, orderWithCooldown.get(0), "OpenRouter should be promoted since Gemini has active cooldowns");
    }
}
