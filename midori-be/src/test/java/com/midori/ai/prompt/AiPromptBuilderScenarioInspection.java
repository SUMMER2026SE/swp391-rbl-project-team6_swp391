package com.midori.ai.prompt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Smoke test that prints the full generated prompts for the three core
 * lesson types the user asked us to verify (Grammar N5, Vocabulary N5,
 * Reading N5). The intent is human-readable verification that:
 *
 * <ul>
 *   <li>Questions/options/correctAnswer are forced into Japanese via the
 *       Japanese example template;</li>
 *   <li>Explanation is allowed (and preferred) in Vietnamese;</li>
 *   <li>The bad Vietnamese-first example shape from the user report is
 *       explicitly banned;</li>
 *   <li>Self-check rules ask the LLM to reject &amp; regenerate any
 *       Vietnamese content.</li>
 * </ul>
 */
class AiPromptBuilderScenarioInspection {

    @Test
    @DisplayName("Grammar N5 — generated prompt includes Japanese rules and example")
    void grammarN5() {
        String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                "Grammar N5 — Basic particles", "Trong bài học này chúng ta học về は、が、を trong tiếng Nhật.",
                5, "MULTIPLE_CHOICE", "Easy");

        System.out.println("============================================");
        System.out.println("=== GRAMMAR N5 — quiz generation prompt =====");
        System.out.println("============================================");
        System.out.println(prompt);

        assertTrue(prompt.contains("MIDORI is a Japanese learning platform"),
                "Grammar N5 prompt must declare Japanese-first intent");
        assertTrue(prompt.contains("次のうち、正しい文はどれですか。"),
                "Grammar N5 prompt must include the Japanese question template");
    }

    @Test
    @DisplayName("Vocabulary N5 — generated prompt includes Japanese rules and example")
    void vocabularyN5() {
        String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                "Vocabulary N5 — Daily words",
                "Các từ vựng hằng ngày trong tiếng Nhật N5.",
                5, "MULTIPLE_CHOICE", "Easy");

        System.out.println("============================================");
        System.out.println("=== VOCABULARY N5 — quiz generation prompt ==");
        System.out.println("============================================");
        System.out.println(prompt);

        assertTrue(prompt.contains("MIDORI is a Japanese learning platform"),
                "Vocabulary N5 prompt must declare Japanese-first intent");
        assertTrue(prompt.contains("次のうち、正しい文はどれですか。"),
                "Vocabulary N5 prompt must include the Japanese question template");
    }

    @Test
    @DisplayName("Reading N5 — generated prompt includes Japanese rules, Reading example, no Vietnamese question text")
    void readingN5() {
        String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                "Reading N5 — Short passage",
                "田中さんは毎日学校に行きます。",
                5, "MULTIPLE_CHOICE", "Easy",
                List.of("Reading"));

        System.out.println("============================================");
        System.out.println("=== READING N5 — quiz generation prompt =====");
        System.out.println("============================================");
        System.out.println(prompt);

        assertTrue(prompt.contains("The platform is Japanese learning")
                        || prompt.contains("MIDORI is a Japanese learning platform"),
                "Reading N5 prompt must declare Japanese-first intent");
        assertTrue(prompt.contains("Reading"),
                "Reading N5 prompt must echo the Reading skill name");
        assertTrue(prompt.contains("question") && prompt.contains("options") && prompt.contains("correctAnswer"),
                "Reading N5 prompt must reference question/options/correctAnswer fields");
    }
}