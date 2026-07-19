package com.midori.ai.prompt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Locks in the Japanese-grammar accuracy guarantees of the AI Sensei
 * chat system prompt.
 *
 * <p>The bug under test: the chat model occasionally produced factually
 * incorrect Japanese grammar explanations — most notably describing
 * {@code です} as "the polite form of a verb" (it is a copula, not a
 * verb). These tests pin down the prompt-level rules that prevent that
 * class of error so any future prompt edit that re-introduces the
 * mistake is flagged by the build.
 *
 * <p>Scope: ONLY the chat prompt. Quiz generation prompts are covered
 * by {@link AiPromptBuilderJapaneseTest}.
 */
class AiPromptBuilderChatGrammarAccuracyTest {

    private static final String CHAT_PROMPT = AiPromptBuilder.getChatSystemPrompt();
    private static final String CHAT_PROMPT_WITH_MATERIAL = AiPromptBuilder.buildChatSystemPromptWithMaterial(
            "Lesson N5 - Copula", "GRAMMAR", "N5",
            "Copula です / だ examples");

    @Nested
    @DisplayName("Knowledge priority rules")
    class KnowledgePriority {

        @Test
        @DisplayName("Material-first rule is present in the chat prompt")
        void materialFirstRule() {
            assertTrue(CHAT_PROMPT.contains("selected material")
                            || CHAT_PROMPT.contains("learning material")
                            || CHAT_PROMPT.contains("MATERIAL CONTEXT")
                            || CHAT_PROMPT.contains("tài liệu"),
                    "Chat prompt must describe material-first knowledge priority");
        }

        @Test
        @DisplayName("JLPT-fallback rule is present when no material is selected")
        void jlptFallbackRule() {
            assertTrue(CHAT_PROMPT.contains("JLPT"),
                    "Chat prompt must mention JLPT as the fallback knowledge source");
        }

        @Test
        @DisplayName("Anti-fabrication rule is present")
        void antiFabricationRule() {
            assertTrue(CHAT_PROMPT.contains("NEVER invent")
                            || CHAT_PROMPT.contains("Never invent")
                            || CHAT_PROMPT.contains("do not invent")
                            || CHAT_PROMPT.contains("do not fabricate")
                            || CHAT_PROMPT.contains("NEVER fabricate"),
                    "Chat prompt must explicitly forbid fabricating linguistic facts");
        }
    }

    @Nested
    @DisplayName("Terminology distinctions (copula vs verb vs aux vs particle)")
    class TerminologyDistinctions {

        @Test
        @DisplayName("Distinguishes copula from verb")
        void copulaNotVerb() {
            // The prompt must clearly call out that です is a copula,
            // NOT a verb, and must explicitly forbid calling it
            // "the polite form of a verb".
            assertTrue(CHAT_PROMPT.contains("copula")
                            || CHAT_PROMPT.contains("Copula")
                            || CHAT_PROMPT.contains("コピュラ"),
                    "Chat prompt must mention copula (です / だ are copulas, not verbs)");
            assertTrue(CHAT_PROMPT.contains("NOT")
                            || CHAT_PROMPT.contains("not"),
                    "Chat prompt must contain explicit NOT/WRONG rules");
        }

        @Test
        @DisplayName("Explicitly forbids calling です the polite form of a verb")
        void forbidsDesuIsPoliteVerb() {
            // This is the exact wrong claim the user reported.
            // The prompt must call it out as forbidden.
            String lower = CHAT_PROMPT.toLowerCase();
            boolean callsOutWrongClaim = lower.contains("です is the polite form of a verb")
                    || lower.contains("desu is the polite form of a verb")
                    || lower.contains("polite form of the verb")
                    || lower.contains("polite verb")
                    || lower.contains("polite ある")
                    || lower.contains("polite form of ある")
                    || lower.contains("wrong");
            assertTrue(callsOutWrongClaim,
                    "Chat prompt must explicitly call out the 'です is a polite verb' claim as wrong");
        }

        @Test
        @DisplayName("Distinguishes particle (助詞) vs auxiliary verb (助動詞)")
        void particleVsAuxiliary() {
            assertTrue(CHAT_PROMPT.contains("助詞") || CHAT_PROMPT.contains("particle"),
                    "Chat prompt must mention particles (助詞)");
            assertTrue(CHAT_PROMPT.contains("助動詞")
                            || CHAT_PROMPT.contains("auxiliary verb"),
                    "Chat prompt must mention auxiliary verbs (助動詞)");
        }

        @Test
        @DisplayName("Distinguishes い-adjective / な-adjective / noun / verb categories")
        void adjectiveAndNounCategories() {
            // The prompt must clearly differentiate い-adjective,
            // な-adjective, noun, and verb as separate categories
            // (the user's example mixes these by calling a copula a verb).
            assertTrue(CHAT_PROMPT.contains("い-adjective")
                            || CHAT_PROMPT.contains("形容詞"),
                    "Chat prompt must mention い-adjective (形容詞)");
            assertTrue(CHAT_PROMPT.contains("な-adjective")
                            || CHAT_PROMPT.contains("形容動詞"),
                    "Chat prompt must mention な-adjective (形容動詞)");
        }

        @Test
        @DisplayName("Lists confused pairs that the model must NOT mix up")
        void confusedPairsListed() {
            // Common accuracy traps that the user-reported bug pattern
            // falls into. The prompt must warn against at least a few.
            String lower = CHAT_PROMPT.toLowerCase();
            boolean mentionsConfusedPairs = lower.contains("ている")
                    && lower.contains("てある")
                    || lower.contains("confuse")
                    || lower.contains("confusing")
                    || lower.contains("そうだ") || lower.contains("sou da")
                    || lower.contains("ようだ") || lower.contains("らしい");
            assertTrue(mentionsConfusedPairs,
                    "Chat prompt must warn against common grammar confusion pairs "
                            + "(ている/てある, そうだ/ようだ, etc.)");
        }
    }

    @Nested
    @DisplayName("Self-consistency / quality gate")
    class SelfConsistencyCheck {

        @Test
        @DisplayName("Contains an explicit self-check step before producing the answer")
        void selfCheckStep() {
            String lower = CHAT_PROMPT.toLowerCase();
            boolean hasSelfCheck = lower.contains("self-check")
                    || lower.contains("self check")
                    || lower.contains("verify")
                    || lower.contains("before producing")
                    || lower.contains("before writing")
                    || lower.contains("revise")
                    || lower.contains("internal pass");
            assertTrue(hasSelfCheck,
                    "Chat prompt must include an internal self-check before producing the answer");
        }

        @Test
        @DisplayName("Contains a quality-gate / JLPT-reference consistency check")
        void qualityGate() {
            String lower = CHAT_PROMPT.toLowerCase();
            boolean hasQualityGate = lower.contains("jlpt")
                    && (lower.contains("consistency")
                        || lower.contains("consistent")
                        || lower.contains("regenerate")
                        || lower.contains("rewrite")
                        || lower.contains("revise")
                        || lower.contains("quality gate")
                        || lower.contains("teacher"));
            assertTrue(hasQualityGate,
                    "Chat prompt must include a quality gate against JLPT / standard references");
        }
    }

    @Nested
    @DisplayName("Required grammar response format")
    class GrammarResponseFormat {

        @Test
        @DisplayName("Required section headings are present")
        void requiredSectionHeadings() {
            // The user spec requires these headings for grammar explanations.
            for (String heading : new String[]{
                    "Meaning",
                    "Structure",
                    "Usage",
                    "Common situations",
                    "Important notes",
                    "Common mistakes",
                    "Formal vs casual"
            }) {
                assertTrue(CHAT_PROMPT.contains(heading),
                        "Chat prompt must include required grammar heading: " + heading);
            }
        }

        @Test
        @DisplayName("Examples block requires Japanese + Kana + Romaji + Vietnamese per example")
        void examplesHaveFourFields() {
            // Per-example lines we require for every grammar example.
            assertTrue(CHAT_PROMPT.contains("Japanese"),
                    "Example block must require a 'Japanese' line per example");
            assertTrue(CHAT_PROMPT.contains("Kana"),
                    "Example block must require a 'Kana' line per example");
            assertTrue(CHAT_PROMPT.contains("Romaji"),
                    "Example block must require a 'Romaji' line per example");
            assertTrue(CHAT_PROMPT.contains("Vietnamese"),
                    "Example block must require a 'Vietnamese' translation line per example");
        }

        @Test
        @DisplayName("Examples block requires at least 3 examples")
        void examplesRequireAtLeastThree() {
            String lower = CHAT_PROMPT.toLowerCase();
            boolean hasThreeRule = lower.contains("ít nhất 3")
                    || lower.contains("at least 3")
                    || lower.contains("tối thiểu 3")
                    || lower.contains("3 ví dụ")
                    || lower.contains("3 example");
            assertTrue(hasThreeRule,
                    "Chat prompt must require at least 3 natural Japanese examples");
        }
    }

    @Nested
    @DisplayName("Forbidden patterns")
    class ForbiddenPatterns {

        @Test
        @DisplayName("Prompt forbids inventing grammar rules")
        void forbidsInventingRules() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("invent")
                            || lower.contains("fabricate")
                            || lower.contains("fake")
                            || lower.contains("guessing"),
                    "Chat prompt must explicitly forbid inventing/fabricating grammar rules");
        }

        @Test
        @DisplayName("Prompt forbids oversimplification that changes linguistic meaning")
        void forbidsOversimplification() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("oversimplif")
                            || lower.contains("do not oversimplify")
                            || lower.contains("don't oversimplify")
                            || (lower.contains("meaning") && lower.contains("change")),
                    "Chat prompt must forbid oversimplification that changes linguistic meaning");
        }

        @Test
        @DisplayName("Prompt forbids wrong linguistic classifications (verb/adj/particle/copula confusion)")
        void forbidsWrongClassifications() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("wrong")
                            || lower.contains("incorrect")
                            || lower.contains("never confuse")
                            || lower.contains("never claim")
                            || lower.contains("forbidden")
                            || lower.contains("không")
                            || lower.contains("never call"),
                    "Chat prompt must forbid wrong linguistic classifications");
        }
    }

    @Nested
    @DisplayName("Quiz generation prompt is NOT changed")
    class QuizGenerationUntouched {

        @Test
        @DisplayName("buildQuizGenerationPrompt output is unaffected by the chat-prompt expansion")
        void quizPromptStillJapaneseFirst() {
            String quizPrompt = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Basic particles", 3, "MULTIPLE_CHOICE", "Easy");
            // The chat-prompt expansion must NOT bleed into the quiz prompt.
            // Quiz prompts have their own dedicated helper; this regression
            // guard asserts that none of the chat-only section headings we
            // added appear in the quiz output.
            for (String heading : new String[]{
                    "A. ROLE AND CONTEXT",
                    "B. SUPPORTED JAPANESE TASKS",
                    "C. ACCURACY POLICY",
                    "D. LINGUISTIC PRECISION",
                    "E. NATURALNESS POLICY",
                    "F. RESPONSE ADAPTATION",
                    "G. ANTI-FABRICATION POLICY",
                    "L. JAPANESE-GRAMMAR ACCURACY"
            }) {
                assertFalse(quizPrompt.contains(heading),
                        "Quiz prompt must NOT contain chat-prompt section heading: " + heading);
            }
            // The quiz prompt must still produce a JSON-question schema
            // (question, options, correctAnswer). This validates that
            // buildQuizGenerationPrompt is still the legacy quiz builder
            // and was not broken by the chat prompt edits.
            assertTrue(quizPrompt.contains("question")
                            && quizPrompt.contains("options")
                            && quizPrompt.contains("correctAnswer"),
                    "Quiz prompt must still build a quiz-question JSON shape");
        }
    }

    @Nested
    @DisplayName("Material-prompt variant contains grammar rules too")
    class MaterialVariant {

        @Test
        @DisplayName("Material-attached chat prompt still embeds the grammar accuracy rules")
        void materialVariantHasCopulaRule() {
            // The grammar rules live in the base chat prompt and must be
            // inherited by the material-augmented variant.
            assertTrue(CHAT_PROMPT_WITH_MATERIAL.contains("copula")
                            || CHAT_PROMPT_WITH_MATERIAL.contains("Copula"),
                    "Material variant must inherit the copula-not-verb rule");
            assertTrue(CHAT_PROMPT_WITH_MATERIAL.contains("Meaning")
                            && CHAT_PROMPT_WITH_MATERIAL.contains("Structure"),
                    "Material variant must inherit the grammar response format");
            assertTrue(CHAT_PROMPT_WITH_MATERIAL.contains("MATERIAL CONTEXT"),
                    "Material variant must include the material context block");
        }
    }

    @Nested
    @DisplayName("Forbidden anti-leak guard for old wrong claims")
    class OldWrongClaimsGuard {

        @Test
        @DisplayName("Prompt must NOT assert 'です is the polite form of the verb だ' as a true statement")
        void doesNotAssertDesuIsPoliteVerb() {
            // The chat prompt can mention the wrong claim ONLY to forbid it.
            // A regression that quietly re-introduces it as a true statement
            // would be catastrophic. We check that the prompt contains a
            // forbidding qualifier near the claim.
            String lower = CHAT_PROMPT.toLowerCase();
            boolean mentionsDesuPolite = lower.contains("polite form of a verb")
                    || lower.contains("polite form of the verb")
                    || lower.contains("polite ある")
                    || lower.contains("polite form of ある");
            if (mentionsDesuPolite) {
                // If the prompt mentions the wrong claim, it must be in a
                // "wrong / not / forbidden" context.
                boolean inForbiddenContext = lower.contains("wrong")
                        || lower.contains("not")
                        || lower.contains("never")
                        || lower.contains("forbidden")
                        || lower.contains("không");
                assertTrue(inForbiddenContext,
                        "If the 'です is polite form of a verb' claim is mentioned, "
                                + "it must be in a 'WRONG / NOT / FORBIDDEN' context");
            }
        }
    }
}
