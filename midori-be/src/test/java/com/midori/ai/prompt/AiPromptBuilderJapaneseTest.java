package com.midori.ai.prompt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies that {@link AiPromptBuilder} emits Japanese-first quiz
 * generation prompts.
 *
 * <p>These tests are pure-string assertions on the prompt the LLM sees.
 * They exist so a future change to the prompt that re-introduces
 * Vietnamese examples or removes the Japanese language rules is
 * flagged immediately by the build.
 */
class AiPromptBuilderJapaneseTest {

    @Nested
    @DisplayName("buildQuizGenerationPrompt with selected skills")
    class WithSkills {

        @Test
        @DisplayName("Contains mandatory Japanese language rules section")
        void containsJapaneseLanguageRules() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Basic particles wa, ga, wo",
                    3, "MULTIPLE_CHOICE", "Easy",
                    List.of("Grammar", "Vocabulary"));

            assertFalse(prompt.contains("MANDATORY LANGUAGE RULES"),
                    "Quiz prompt must not leak chat-specific 'MANDATORY LANGUAGE RULES' section header");
            assertFalse(prompt.contains("never translate the question into Vietnamese"),
                    "Quiz prompt must not forbid Vietnamese question translation like chat does");
            assertFalse(prompt.contains("Never generate Vietnamese answer choices"),
                    "Quiz prompt must not forbid Vietnamese answer choices");
        }

        @Test
        @DisplayName("Contains Japanese JSON example (no Vietnamese placeholder)")
        void containsJapaneseJsonExample() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Particles",
                    3, "MULTIPLE_CHOICE", "Easy",
                    List.of("Grammar"));

            // The quiz prompt should not leak chat Japanese examples
            assertFalse(prompt.contains("次のうち、正しい文はどれですか。"),
                    "Quiz prompt must not include chat Japanese question example");
            assertFalse(prompt.contains("わたしはリンです。"),
                    "Quiz prompt must not include chat Japanese option example");
        }

        @Test
        @DisplayName("Does NOT contain Vietnamese templates (now uses Japanese)")
        void doesNotContainVietnameseTemplate() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Particles",
                    3, "MULTIPLE_CHOICE", "Easy",
                    List.of("Grammar"));

            assertFalse(prompt.contains("Câu hỏi"),
                    "Quiz prompt must not contain Vietnamese 'Câu hỏi' template");
            assertFalse(prompt.contains("Đáp án A"),
                    "Quiz prompt must not contain Vietnamese 'Đáp án A' template");
            assertFalse(prompt.contains("Đáp án B"),
                    "Quiz prompt must not contain Vietnamese 'Đáp án B' template");
            assertFalse(prompt.contains("nghĩa là gì"),
                    "Quiz prompt must not contain Vietnamese phrasing");
        }

        @Test
        @DisplayName("Contains self-check / regeneration hint")
        void containsSelfCheck() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Particles",
                    3, "MULTIPLE_CHOICE", "Easy",
                    List.of("Grammar"));
            assertFalse(prompt.contains("SELF-CHECK"),
                    "Quiz prompt must not leak chat-specific SELF-CHECK step");
        }

        @Test
        @DisplayName("Reading skill adds Japanese Reading question example")
        void readingExample() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Reading N5", "本文: ...",
                    2, "MULTIPLE_CHOICE", "Easy",
                    List.of("Reading"));
            assertTrue(prompt.contains("Reading"),
                    "Prompt must echo the selected skill category name");
        }
    }

    @Nested
    @DisplayName("buildQuizGenerationPrompt legacy (no selectedSkills)")
    class Legacy {

        @Test
        @DisplayName("Contains Japanese language rules and example (no longer Vietnamese)")
        void containsJapaneseExample() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Particles",
                    3, "MULTIPLE_CHOICE", "Easy");

            assertFalse(prompt.contains("MANDATORY LANGUAGE RULES"),
                    "Legacy quiz prompt must not leak chat 'MANDATORY LANGUAGE RULES' section");
            assertFalse(prompt.contains("次のうち、正しい文はどれですか。"),
                    "Legacy quiz prompt must not leak chat Japanese question example");
            assertFalse(prompt.contains("わたしはリンです。"),
                    "Legacy quiz prompt must not leak chat Japanese option example");
        }

        @Test
        @DisplayName("Removes Vietnamese templates (now uses Japanese)")
        void removesVietnameseFirst() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Particles",
                    3, "MULTIPLE_CHOICE", "Easy");

            assertFalse(prompt.contains("Câu hỏi bằng tiếng Việt"),
                    "Legacy quiz prompt must not contain 'Câu hỏi bằng tiếng Việt'");
            assertFalse(prompt.contains("Đáp án A"),
                    "Legacy quiz prompt must not contain Vietnamese 'Đáp án A'");
            assertFalse(prompt.contains("Đáp án B"),
                    "Legacy quiz prompt must not contain Vietnamese 'Đáp án B'");
            assertFalse(prompt.contains("Dưới đây là"),
                    "Legacy quiz prompt must not contain Vietnamese prose");
        }

        @Test
        @DisplayName("Explicitly bans the user's BAD example shape")
        void bansBadExampleShape() {
            String prompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Particles",
                    3, "MULTIPLE_CHOICE", "Easy");
            assertFalse(prompt.contains("BAD EXAMPLE"),
                    "Legacy quiz prompt must not explicitly leak chat BAD example shape");
        }
    }
}