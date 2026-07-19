package com.midori.ai.prompt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression tests that lock in the "expanded Japanese-language assistant"
 * scope of the AI Sensei chat system prompt. After this change, AI Sensei
 * must:
 *
 * <ul>
 *   <li>handle every legitimate Japanese-language task from vocabulary
 *       lookup to JLPT preparation when no material is selected;</li>
 *   <li>still treat the selected material as the primary source when a
 *       material IS selected;</li>
 *   <li>forbid all forms of fabricated facts (grammar rules, readings,
 *       conjugations, JLPT classifications, etymologies);</li>
 *   <li>preserve the naturalness, register, anti-oversimplification, and
 *       internal-accuracy-check guarantees;</li>
 *   <li>adapt its response format to the task instead of forcing one
 *       template onto every request.</li>
 * </ul>
 *
 * <p>These tests focus on the chat prompt only. Quiz-generation prompts
 * are covered by {@link AiPromptBuilderJapaneseTest} and the grammar
 * accuracy guarantees by
 * {@link AiPromptBuilderChatGrammarAccuracyTest}. Nothing in this file
 * touches quiz, frontend, or service behavior.
 */
class AiPromptBuilderJapaneseAssistantScopeTest {

    private static final String CHAT_PROMPT = AiPromptBuilder.getChatSystemPrompt();
    private static final String CHAT_PROMPT_WITH_MATERIAL = AiPromptBuilder.buildChatSystemPromptWithMaterial(
            "Lesson N5 - Copula", "GRAMMAR", "N5",
            "Copula です / だ examples");

    @Nested
    @DisplayName("Dual-context behavior (selected material vs. no material)")
    class DualContext {

        @Test
        @DisplayName("Prompt explicitly distinguishes selected-material vs. no-material contexts")
        void distinguishesBothContexts() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(CHAT_PROMPT.contains("SELECTED MATERIAL EXISTS")
                            || lower.contains("selected material exists"),
                    "Chat prompt must explicitly describe the SELECTED-MATERIAL-EXISTS context");
            assertTrue(CHAT_PROMPT.contains("NO MATERIAL IS SELECTED")
                            || lower.contains("no material is selected"),
                    "Chat prompt must explicitly describe the NO-MATERIAL-SELECTED context");
        }

        @Test
        @DisplayName("No-material context covers the full assistant scope, not only grammar")
        void noMaterialIsFullScope() {
            // Must enumerate the full task list inside the no-material context.
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("grammar")
                            && lower.contains("vocab")
                            && lower.contains("kanji")
                            && (lower.contains("translat") || lower.contains("dịch")),
                    "No-material scope must enumerate grammar, vocabulary, kanji, and translation");
            assertTrue(lower.contains("jlpt"),
                    "No-material scope must mention JLPT support");
        }

        @Test
        @DisplayName("Prompt does NOT refuse when no material is selected")
        void noMaterialRefusesNotAllowed() {
            // Forbidden imperative forms. Use literal imperative form
            // rather than the prompt's positive rule "Do NOT require the
            // user to select" which contains the same substring.
            String lower = CHAT_PROMPT.toLowerCase();
            assertFalse(lower.contains("user must select a material")
                            || lower.contains("cannot answer without a material")
                            || lower.contains("please select a material to answer")
                            || lower.contains("please select a material first")
                            || lower.contains("hãy chọn tài li\u1ec7u \u0111\u1ec3")
                            || lower.contains("must select a material before")
                            || lower.contains("please choose a material to begin"),
                    "Chat prompt must NOT force the user to select a material before answering");
        }

        @Test
        @DisplayName("Prompt forbids unnecessary 'no material selected' announcements")
        void noMaterialDoesNotAnnounceUnnecessarily() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("do not unnecessarily announce"),
                    "Chat prompt must forbid unnecessary announcements that no material was selected");
        }

        @Test
        @DisplayName("Material-context rules still exist for the selected-material flow")
        void materialContextRulesStillPresent() {
            // The material-context block must still be in place so the
            // buildChatSystemPromptWithMaterial(...) variant continues to
            // inherit the dual-context behavior.
            assertTrue(CHAT_PROMPT.contains("A. ROLE AND CONTEXT"),
                    "Chat prompt must still contain the A. ROLE AND CONTEXT section");
            assertTrue(CHAT_PROMPT_WITH_MATERIAL.contains("CURRENT MATERIAL CONTEXT"),
                    "Material-variant prompt must still emit the CURRENT MATERIAL CONTEXT block");
        }
    }

    @Nested
    @DisplayName("Supported Japanese-task coverage (the 12 categories)")
    class TaskCoverage {

        @Test
        @DisplayName("Grammar explanations are listed in the supported tasks")
        void grammarListed() {
            assertTrue(CHAT_PROMPT.contains("Grammar explanations"),
                    "Chat prompt must enumerate grammar explanations as a supported task");
        }

        @Test
        @DisplayName("Vocabulary lookup and nuance are listed")
        void vocabularyListed() {
            assertTrue(CHAT_PROMPT.contains("Vocabulary"),
                    "Chat prompt must enumerate vocabulary as a supported task");
        }

        @Test
        @DisplayName("Sentence creation is listed with JLPT level and register matching")
        void sentenceCreationListed() {
            assertTrue(CHAT_PROMPT.contains("Sentence creation"),
                    "Chat prompt must enumerate sentence creation as a supported task");
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("jlpt"),
                    "Sentence-creation section must reference JLPT-level matching");
        }

        @Test
        @DisplayName("Sentence correction is listed with the correct/understandable-but-unnatural distinction")
        void sentenceCorrectionListed() {
            assertTrue(CHAT_PROMPT.contains("Sentence correction"),
                    "Chat prompt must enumerate sentence correction as a supported task");
            assertTrue(CHAT_PROMPT.contains("understandable-but-unnatural")
                            || CHAT_PROMPT.contains("correct, incorrect, or understandable"),
                    "Chat prompt must distinguish correct / incorrect / understandable-but-unnatural");
        }

        @Test
        @DisplayName("Translation support covers VI<->JA and EN->JA")
        void translationListed() {
            assertTrue(CHAT_PROMPT.contains("Translation"),
                    "Chat prompt must enumerate translation as a supported task");
            assertTrue(CHAT_PROMPT.contains("Vietnamese ↔ Japanese")
                            || CHAT_PROMPT.contains("Vietnamese ↔ Japanese"),
                    "Chat prompt must support Vietnamese ↔ Japanese translation");
            assertTrue(CHAT_PROMPT.contains("English → Japanese"),
                    "Chat prompt must support English → Japanese translation");
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("spoken vs written")
                            || lower.contains("spoken vs. written"),
                    "Translation section must preserve spoken vs written style");
        }

        @Test
        @DisplayName("Kanji support covers onyomi, kunyomi, common vocabulary, similar-looking kanji")
        void kanjiListed() {
            assertTrue(CHAT_PROMPT.contains("Kanji"),
                    "Chat prompt must enumerate kanji as a supported task");
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("onyomi") || lower.contains("on'yomi"),
                    "Kanji section must list onyomi");
            assertTrue(lower.contains("kunyomi") || lower.contains("kun'yomi"),
                    "Kanji section must list kunyomi");
        }

        @Test
        @DisplayName("Reading/pronunciation support covers pitch-accent, long vowels, small っ, rendaku")
        void readingListed() {
            assertTrue(CHAT_PROMPT.contains("Reading and pronunciation"),
                    "Chat prompt must enumerate reading/pronunciation as a supported task");
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("pitch-accent") || lower.contains("pitch accent"),
                    "Reading section must mention pitch-accent (with caution)");
            assertTrue(lower.contains("\u3087") || CHAT_PROMPT.contains("\u3063") || lower.contains("small \u3063")
                            || lower.contains("small tsu") || lower.contains("small っ"),
                    "Reading section must mention small \u3063");
            assertTrue(lower.contains("rendaku") || lower.contains("連濁"),
                    "Reading section must mention rendaku");
        }

        @Test
        @DisplayName("Verb/adjective conjugation covers all major Japanese forms")
        void conjugationListed() {
            assertTrue(CHAT_PROMPT.contains("Verb and adjective forms"),
                    "Chat prompt must enumerate verb/adjective forms as a supported task");
            String lower = CHAT_PROMPT.toLowerCase();
            for (String form : new String[]{
                    "potential", "passive", "causative", "conditional", "volitional",
                    "imperative", "prohibition"
            }) {
                assertTrue(lower.contains(form),
                        "Conjugation section must cover: " + form);
            }
        }

        @Test
        @DisplayName("Conversation support covers role-play and textbook-vs-spoken distinction")
        void conversationListed() {
            assertTrue(CHAT_PROMPT.contains("Conversation"),
                    "Chat prompt must enumerate conversation as a supported task");
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("role-play") || lower.contains("roleplay"),
                    "Conversation section must include role-play");
            assertTrue(lower.contains("spoken japanese") || lower.contains("textbook-correct"),
                    "Conversation section must distinguish textbook-correct from natural spoken Japanese");
        }

        @Test
        @DisplayName("Register and politeness support covers keigo")
        void registerAndKeigoListed() {
            assertTrue(CHAT_PROMPT.contains("Register and politeness"),
                    "Chat prompt must enumerate register/politeness as a supported task");
            assertTrue(CHAT_PROMPT.contains("\u656c\u8a9e")
                            || CHAT_PROMPT.contains("respectful language"),
                    "Register section must cover respectful language (尊敬語)");
            assertTrue(CHAT_PROMPT.contains("\u8b19\u8b9b\u8a9e")
                            || CHAT_PROMPT.contains("humble language"),
                    "Register section must cover humble language (謙譲語)");
        }

        @Test
        @DisplayName("Writing assistance is listed (emails, essays, reports, etc.)")
        void writingAssistanceListed() {
            assertTrue(CHAT_PROMPT.contains("Writing assistance"),
                    "Chat prompt must enumerate writing assistance as a supported task");
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("email"),
                    "Writing section must mention emails");
        }

        @Test
        @DisplayName("JLPT support covers N5..N1 and explains why choices are correct/wrong")
        void jlptListed() {
            assertTrue(CHAT_PROMPT.contains("JLPT learning support"),
                    "Chat prompt must enumerate JLPT learning support as a task");
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("n5") && lower.contains("n1"),
                    "JLPT section must list N5 and N1");
            assertTrue(lower.contains("why") || lower.contains("because"),
                    "JLPT section must explain why an answer is correct and why other choices are wrong");
        }
    }

    @Nested
    @DisplayName("Accuracy policy (anti-fabrication rules)")
    class AccuracyPolicy {

        @Test
        @DisplayName("Prompt explicitly forbids inventing grammar rules, readings, meanings, conjugations")
        void forbidsInventing() {
            String lower = CHAT_PROMPT.toLowerCase();
            for (String forbidden : new String[]{
                    "invent a grammar rule, reading, word meaning, conjugation, cultural rule, or jlpt classification",
                    "fabricate an etymology"
            }) {
                assertTrue(lower.contains(forbidden),
                        "Anti-fabrication list must contain: " + forbidden);
            }
        }

        @Test
        @DisplayName("Prompt says accuracy is more important than fluency / confidence / creativity")
        void accuracyBeatsFluency() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("accuracy is more important")
                            || lower.contains("accuracy > fluency")
                            || lower.contains("accuracy is more important than"),
                    "Chat prompt must state that accuracy is more important than fluency / confidence / creativity");
        }

        @Test
        @DisplayName("Prompt instructs to correct false premises and continue")
        void correctsFalsePremises() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("false premise")
                            || lower.contains("premise is wrong")
                            || lower.contains("user's premise is wrong"),
                    "Chat prompt must instruct the assistant to correct a false premise");
        }

        @Test
        @DisplayName("Prompt says 'never present speculation as fact'")
        void noSpeculationAsFact() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("speculation as fact")
                            || lower.contains("present speculation")
                            || lower.contains("speculation"),
                    "Chat prompt must forbid presenting speculation as fact");
        }

        @Test
        @DisplayName("Prompt instructs to ask for context only when it materially affects the answer")
        void onlyAskForContextWhenMaterial() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("materially affects")
                            || lower.contains("ask for context only when"),
                    "Chat prompt must ask for context only when it materially affects the answer");
        }
    }

    @Nested
    @DisplayName("Linguistic-precision guardrails")
    class LinguisticPrecision {

        @Test
        @DisplayName("Prompt forbids simplifying terminology that creates a false rule")
        void forbidsOversimplifyingTerminology() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("simplified terminology")
                            || lower.contains("do not use simplified terminology"),
                    "Chat prompt must forbid using simplified terminology that creates a false rule");
        }

        @Test
        @DisplayName("Prompt explicitly forbids specific false equivalences from the spec")
        void forbidsSpecificFalseEquivalences() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("\u306f") && lower.contains("là"),
                    "Prompt must forbid the false equivalence 'は = là'");
            assertTrue(lower.contains("\u304c") && lower.contains("always marks the grammatical subject"),
                    "Prompt must forbid the false equivalence 'が always marks the grammatical subject'");
            assertTrue(lower.contains("\u3092") && lower.contains("always marks a direct object"),
                    "Prompt must forbid the false equivalence 'を always marks a direct object'");
            assertTrue(lower.contains("\u306b") && lower.contains("always means \"to\""),
                    "Prompt must forbid the false equivalence 'に always means to'");
            assertTrue(lower.contains("desu")
                            && (lower.contains("verb") || lower.contains("động từ")),
                    "Prompt must forbid calling です a verb");
            assertTrue(lower.contains("japanese simply has no future"),
                    "Prompt must forbid 'Japanese simply has no future expression'");
            assertTrue(lower.contains("all な-adjectives are ordinary nouns")
                            || lower.contains("all \u306a-adjectives are ordinary nouns"),
                    "Prompt must forbid 'all な-adjectives are ordinary nouns'");
        }
    }

    @Nested
    @DisplayName("Naturalness checks")
    class NaturalnessChecks {

        @Test
        @DisplayName("Prompt lists the naturalness checklist (grammatical, semantic, register, consistent-with-translation)")
        void naturalnessChecklistPresent() {
            String normalised = CHAT_PROMPT.toLowerCase().replaceAll("\\s+", " ");
            assertTrue(normalised.contains("naturalness policy"),
                    "Chat prompt must contain a NATURALNESS POLICY section");
            for (String item : new String[]{
                    "grammatically valid",
                    "semantically coherent",
                    "appropriate for the stated context",
                    "natural for the intended register",
                    "consistent with its translation"
            }) {
                assertTrue(normalised.contains(item),
                        "Naturalness checklist must contain: " + item);
            }
        }

        @Test
        @DisplayName("Prompt distinguishes grammatically incorrect / unnatural / context-dependent / fully natural")
        void correctionTaxonomy() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("grammatically incorrect")
                            && lower.contains("grammatically possible but unnatural")
                            && lower.contains("natural but context-dependent")
                            && lower.contains("fully natural"),
                    "Naturalness/correction taxonomy must list all four categories");
        }
    }

    @Nested
    @DisplayName("Translation quality gate")
    class TranslationQualityGate {

        @Test
        @DisplayName("Complete translations preserve every source meaning unit")
        void completenessRulesPresent() {
            String lower = CHAT_PROMPT.toLowerCase().replaceAll("\\s+", " ");
            for (String item : new String[]{
                    "preserve all semantic information",
                    "do not translate only the main phrase",
                    "reasons and causes",
                    "time expressions",
                    "conditions",
                    "subjects when required",
                    "objects and complements",
                    "essential actions",
                    "politeness level"
            }) {
                assertTrue(lower.contains(item),
                        "Translation completeness rules must contain: " + item);
            }
        }

        @Test
        @DisplayName("Late-reply apology example retains the omitted reason")
        void completenessExamplePresent() {
            assertTrue(CHAT_PROMPT.contains("Tôi xin lỗi vì đã trả lời muộn."),
                    "Prompt must include the Vietnamese completeness source example");
            assertTrue(CHAT_PROMPT.contains("返信が遅くなり、申し訳ございませんでした。"),
                    "Prompt must preserve the late-reply reason in the complete Japanese translation");
            assertTrue(CHAT_PROMPT.contains("申し訳ございませんでした。"),
                    "Prompt must identify the incomplete apology-only translation");
        }

        @Test
        @DisplayName("Natural translation is contextual rather than word-for-word")
        void naturalTranslationRulesPresent() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("not word by word"),
                    "Prompt must forbid word-for-word translation");
            assertTrue(lower.contains("native speaker") && lower.contains("real-life situation"),
                    "Prompt must require natural language usable by a native speaker");
            assertTrue(lower.contains("naturalness never justifies deleting source meaning"),
                    "Natural phrasing must never permit semantic omission");
        }

        @Test
        @DisplayName("Translation output prioritizes the result and provides useful alternatives")
        void translationOutputRulesPresent() {
            String lower = CHAT_PROMPT.toLowerCase().replaceAll("\\s+", " ");
            assertTrue(lower.contains("produce the translation itself first"),
                    "A translation request must prioritize the translation itself");
            assertTrue(lower.contains("takes precedence over j. vocabulary mode"),
                    "Complete-sentence translation must override vocabulary-card mode");
            assertTrue(lower.contains("most natural translation first")
                            && lower.contains("commonly used alternative")
                            && lower.contains("briefly explain the nuance"),
                    "Prompt must provide and distinguish common natural alternatives");
        }

        @Test
        @DisplayName("Translation self-check regenerates incomplete output")
        void translationSelfCheckPresent() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("internal translation self-check"),
                    "Prompt must contain a dedicated translation self-check");
            assertTrue(lower.contains("map every important meaning unit"),
                    "Self-check must map all source meaning units to the translation");
            assertTrue(lower.contains("could actually be used by a native speaker in real life"),
                    "Self-check must require a practical real-life translation");
            assertTrue(lower.contains("regenerate the translation"),
                    "Incomplete or unnatural translations must be regenerated before responding");
        }
    }

    @Nested
    @DisplayName("Adaptive response format")
    class AdaptiveFormat {

        @Test
        @DisplayName("Prompt says responses must adapt to the task (no single template)")
        void doesNotForceSingleTemplate() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("do not force")
                            || lower.contains("don\u2019t force")
                            || lower.contains("don't force")
                            || lower.contains("adapt the response"),
                    "Chat prompt must say the response should adapt to the task");
            assertTrue(lower.contains("translation request should prioritize the translation")
                            || lower.contains("a translation request should prioritize"),
                    "Chat prompt must tell the assistant a translation request should prioritize the translation");
        }

        @Test
        @DisplayName("Prompt instructs kana + romaji only when helpful, never over-repeat romaji for advanced users")
        void kanaRomajiPolicy() {
            String lower = CHAT_PROMPT.toLowerCase();
            assertTrue(lower.contains("provide kana and romaji when"),
                    "Chat prompt must instruct to provide kana and romaji when helpful");
            assertTrue(lower.contains("do not repeat romaji excessively")
                            || lower.contains("don't repeat romaji excessively"),
                    "Chat prompt must forbid over-repeating romaji for advanced users");
        }
    }

    @Nested
    @DisplayName("Internal accuracy check (before-send quality gate)")
    class InternalAccuracyCheck {

        @Test
        @DisplayName("Prompt requires a final internal accuracy check before sending the answer")
        void internalAccuracyCheckPresent() {
            String lower = CHAT_PROMPT.toLowerCase();
            // The G. section already had a self-check; the new expanded
            // prompt adds an explicit ANTI-FABRICATION POLICY that
            // contains the wording "rewrite the answer before sending".
            assertTrue(lower.contains("rewrite the answer before sending")
                            || lower.contains("revise the answer")
                            || lower.contains("internal pass")
                            || lower.contains("rewrite that section"),
                    "Chat prompt must require the assistant to rewrite the answer before sending if any check fails");
        }

        @Test
        @DisplayName("Anti-fabrication policy mentions the eleven-point verification checklist")
        void antiFabricationChecklist() {
            String lower = CHAT_PROMPT.toLowerCase();
            for (String item : new String[]{
                    "japanese grammar",
                    "vocabulary meaning",
                    "readings",
                    "conjugations",
                    "examples are natural",
                    "translations match the japanese",
                    "register",
                    "no false absolute claim",
                    "no contradiction",
                    "no fact was invented"
            }) {
                assertTrue(lower.contains(item),
                        "Anti-fabrication checklist must contain: " + item);
            }
        }
    }

    @Nested
    @DisplayName("Material-augmented variant inherits the new assistant scope")
    class MaterialVariantInheritance {

        @Test
        @DisplayName("Material variant contains every new high-level assistant scope section")
        void materialVariantHasAllNewSections() {
            // Every new top-level section label (A..G) must survive in
            // buildChatSystemPromptWithMaterial() so the selected-material
            // context keeps the same dual-context behavior as the
            // no-material variant.
            for (String heading : new String[]{
                    "A. ROLE AND CONTEXT",
                    "B. SUPPORTED JAPANESE TASKS",
                    "C. ACCURACY & ANTI-FABRICATION POLICY",
                    "D. LINGUISTIC PRECISION",
                    "E. NATURALNESS POLICY",
                    "F. RESPONSE ADAPTATION"
            }) {
                assertTrue(CHAT_PROMPT_WITH_MATERIAL.contains(heading),
                        "Material variant must inherit chat heading: " + heading);
            }
        }

        @Test
        @DisplayName("Material variant still includes the material rules section")
        void materialVariantStillHasMaterialRules() {
            String prompt = CHAT_PROMPT_WITH_MATERIAL;
            assertTrue(prompt.contains("A. ROLE AND CONTEXT"),
                    "Material variant must still contain ROLE AND CONTEXT rules");
            assertTrue(CHAT_PROMPT_WITH_MATERIAL.contains("CURRENT MATERIAL CONTEXT"),
                    "Material variant must still emit the material context block");
        }
    }

    @Nested
    @DisplayName("Quiz-generation prompt remains unchanged (regression guard)")
    class QuizRegressionGuard {

        @Test
        @DisplayName("Quiz-generation prompt is NOT modified by the chat prompt expansion")
        void quizPromptUntouched() {
            // The chat-prompt expansion below must not bleed into the
            // quiz-generation prompt. Verify that buildQuizGenerationPrompt
            // still (a) contains a reference to question/options/correctAnswer
            // fields (it builds quiz JSON), (b) contains the selected type
            // and difficulty, (c) does NOT contain any of the new chat-only
            // sections we added (e.g. B. SUPPORTED JAPANESE TASKS).
            // We do NOT assert specific strings because the existing quiz
            // prompt contents pre-date this change and are not part of
            // this task's scope.
            String withSkills = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Basic particles", 3, "MULTIPLE_CHOICE", "Easy",
                    java.util.List.of("Grammar", "Vocabulary"));
            assertTrue(withSkills.contains("question")
                            && withSkills.contains("options")
                            && withSkills.contains("correctAnswer"),
                    "Quiz-generation prompt must still build a quiz JSON shape");
            assertTrue(withSkills.contains("MULTIPLE_CHOICE"),
                    "Quiz-generation prompt must still echo the selected question type");

            String legacy = AiPromptBuilder.buildQuizGenerationPrompt(
                    "Grammar N5", "Particles", 3, "MULTIPLE_CHOICE", "Easy");
            assertTrue(legacy.contains("question")
                            && legacy.contains("options")
                            && legacy.contains("correctAnswer"),
                    "Legacy quiz-generation prompt must still build a quiz JSON shape");

            // The chat-only sections (B/C/D/E/F/G) must NOT appear in the
            // quiz-generation prompt.
            for (String heading : new String[]{
                    "B. SUPPORTED JAPANESE TASKS",
                    "C. ACCURACY POLICY",
                    "D. LINGUISTIC PRECISION",
                    "E. NATURALNESS POLICY",
                    "F. RESPONSE ADAPTATION",
                    "G. ANTI-FABRICATION POLICY"
            }) {
                assertFalse(withSkills.contains(heading),
                        "Quiz-generation prompt must NOT contain chat-only heading: " + heading);
                assertFalse(legacy.contains(heading),
                        "Quiz-generation prompt must NOT contain chat-only heading: " + heading);
            }
        }

        @Test
        @DisplayName("Exam parsing prompts are not affected by the chat prompt expansion")
        void examParsingPromptUntouched() {
            String prompt = AiPromptBuilder.buildExamParsingPrompt(
                    "1. 次の文を読んで答えなさい。 A. 答え1 B. 答え2 C. 答え3 D. 答え4", "n5.pdf");
            assertTrue(prompt.contains("EXAM TITLE"),
                    "Exam parsing prompt must still request the exam title");
            assertTrue(prompt.contains("n5.pdf"),
                    "Exam parsing prompt must still embed the filename");
        }
    }
}
