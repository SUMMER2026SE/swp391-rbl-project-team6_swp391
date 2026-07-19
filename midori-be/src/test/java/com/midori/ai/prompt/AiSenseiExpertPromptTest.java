package com.midori.ai.prompt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Concept-level regression coverage for the professional AI Sensei chat prompt.
 * Assertions deliberately accept equivalent wording while requiring every part
 * of the expert contract to remain represented.
 */
class AiSenseiExpertPromptTest {

    private static final String PROMPT = AiPromptBuilder.getChatSystemPrompt();
    private static final String PROMPT_WITH_MATERIAL = AiPromptBuilder.buildChatSystemPromptWithMaterial(
            "N3 grammar", "GRAMMAR", "N3", "Japanese grammar lesson content");

    @Nested
    @DisplayName("Professional role and technical standard")
    class ProfessionalRoleAndAccuracy {

        @Test
        @DisplayName("Combines all professional Japanese-language roles")
        void combinesProfessionalRoles() {
            assertConcept(PROMPT, "professional Japanese instruction",
                    "professional japanese-language instructor", "professional japanese language teacher");
            assertConcept(PROMPT, "JLPT teacher", "jlpt teacher", "jlpt instructor");
            assertConcept(PROMPT, "Japanese linguistics expertise",
                    "japanese linguistics expert", "japanese linguistic expert");
            assertConcept(PROMPT, "Japanese-Vietnamese translation",
                    "japanese-vietnamese translator", "japanese–vietnamese translator");
            assertConcept(PROMPT, "Japanese writing assistance",
                    "japanese writing assistant", "japanese writing assistance");
            assertConcept(PROMPT, "Japanese proofreading assistance",
                    "japanese proofreading", "proofreading and correction assistant");
            assertConcept(PROMPT, "experienced-teacher standard",
                    "experienced japanese teacher", "experienced language teacher");
        }

        @Test
        @DisplayName("Requires a complete technical accuracy pass")
        void requiresCompleteTechnicalAccuracyPass() {
            String accuracy = section(PROMPT, "accuracy & anti-fabrication", "authoritative sources");
            assertEachConcept(accuracy,
                    concept("terminology", "terminology"),
                    concept("grammatical category", "grammatical category", "part of speech"),
                    concept("conjugation or inflection", "conjugation", "inflection"),
                    concept("syntax", "syntax"),
                    concept("semantics", "semantics"),
                    concept("pragmatics", "pragmatics", "pragmatic"),
                    concept("register", "register"),
                    concept("naturalness", "naturalness", "natural"));
            assertConcept(accuracy, "failed-check rewrite", "rewrite", "revise", "regenerate");
        }
    }

    @Nested
    @DisplayName("Mainstream authority and analysis discipline")
    class AuthorityAndAnalysis {

        @Test
        @DisplayName("Uses mainstream modern Japanese references without inventing a framework")
        void followsAuthoritativeConsensus() {
            String authority = section(PROMPT, "authoritative sources", "no false simplifications");
            assertConcept(authority, "mainstream consensus", "mainstream modern japanese grammar", "mainstream consensus");
            assertEachConcept(authority,
                    concept("Dictionary of Japanese Grammar series",
                            "dictionary of basic / intermediate / advanced japanese grammar",
                            "dictionary of japanese grammar"),
                    concept("Genki", "genki"),
                    concept("Minna no Nihongo", "minna no nihongo"),
                    concept("Shin Kanzen Master", "shin kanzen master"),
                    concept("TRY!", "try!"),
                    concept("Bunpro", "bunpro"),
                    concept("Japanese educational grammar", "学校文法", "japanese educational grammar"));
            assertConcept(authority, "no invented grammar framework",
                    "do not invent an alternative grammar system",
                    "do not invent alternative grammar",
                    "never invent a grammar framework");
        }

        @Test
        @DisplayName("Acknowledges accepted framework differences without false relativism")
        void handlesAcceptedAnalysesResponsibly() {
            String analyses = section(PROMPT, "when experts disagree", "internal quality check");
            assertConcept(analyses, "multiple accepted analyses",
                    "multiple accepted analyses", "different grammar frameworks");
            assertConcept(analyses, "mainstream interpretation first",
                    "mainstream pedagogical interpretation first", "mainstream interpretation first");
            assertEachConcept(analyses,
                    concept("copula or auxiliary analysis", "copula versus auxiliary", "copula vs auxiliary"),
                    concept("topic or subject analysis", "topic versus subject", "topic vs subject"),
                    concept("modality", "modality"),
                    concept("sentence-final expressions", "sentence-final expressions", "sentence final expressions"));
            assertConcept(analyses, "no absolute controversial analysis",
                    "never present a controversial analysis as absolute",
                    "not the only possible interpretation");
            assertConcept(analyses, "no manufactured disagreement",
                    "do not manufacture disagreement", "do not invent disagreement");
        }
    }

    @Nested
    @DisplayName("Precise teaching without myths")
    class PrecisionAndAntiMyths {

        @Test
        @DisplayName("Keeps beginner explanations simple but technically true")
        void rejectsFalseSimplifications() {
            String simplification = section(PROMPT, "no false simplifications", "when experts disagree");
            assertConcept(simplification, "beginner simplification allowed",
                    "simplification for beginners is allowed", "beginner-friendly explanation");
            assertConcept(simplification, "incorrectness forbidden",
                    "incorrectness is not", "must remain technically accurate", "technically true");
            assertConcept(simplification, "no false rule to unlearn",
                    "false rule", "must later unlearn");
            assertEachConcept(simplification,
                    concept("topic-marker analysis of は", "は marks the topic", "topic marker は"),
                    concept("Vietnamese approximation", "context-dependent approximation", "only an approximation"),
                    concept("は is not lexical là", "does not mean \"là\"", "not mean \"là\""));
        }

        @Test
        @DisplayName("Preserves the complete linguistic terminology inventory")
        void distinguishesLinguisticTerminology() {
            String precision = section(PROMPT, "linguistic precision", "naturalness policy");
            for (String term : List.of(
                    "noun", "verb", "copula", "auxiliary", "particle", "adjective",
                    "い-adjective", "な-adjective", "adverb", "conjunction", "interjection",
                    "predicate", "clause", "phrase", "conjugation", "inflection", "stem",
                    "transitive verb", "intransitive verb", "topic", "subject", "object",
                    "complement", "case marker", "focus", "voice", "aspect", "tense",
                    "modality", "politeness", "register")) {
                assertConcept(precision, "linguistic term: " + term, term);
            }
            assertConcept(precision, "no category collapse",
                    "do not collapse different concepts", "preserve the relevant lexical and grammatical distinctions");
        }

        @Test
        @DisplayName("Pairs each common myth with an accurate rule")
        void replacesCommonMythsWithAccurateRules() {
            String myths = section(PROMPT, "anti-myth rules", "naturalness policy");
            assertEachConcept(myths,
                    concept("です is a copula", "です is the polite copula", "です as a copula"),
                    concept("だ is a copula", "だ is the plain copula", "だ as a copula"),
                    concept("は marks topic", "は marks the topic", "は is a topic marker"),
                    concept("は can mark contrast", "can mark contrast", "contrastive は"),
                    concept("が has nominative and context-sensitive roles", "nominative case marker", "depend on construction and context"),
                    concept("を marks a route or point of departure", "route or point of departure", "道を歩く", "家を出る"),
                    concept("に has multiple grammatical functions", "several grammatical functions", "locations of existence"),
                    concept("Japanese nonpast morphology does not bar future time", "nonpast form", "future time through context"),
                    concept("Japanese adjective classes differ", "differ morphosyntactically", "do not inflect or combine identically"),
                    concept("る-ending godan counterexamples exist", "godan counterexamples", "帰る", "走る", "切る", "知る"));
        }
    }

    @Nested
    @DisplayName("Professional output quality")
    class OutputQuality {

        @Test
        @DisplayName("Translation preserves content and communicative effect")
        void enforcesProfessionalTranslationCompleteness() {
            String translation = section(PROMPT, "translation quality gate", "response adaptation");
            assertEachConcept(translation,
                    concept("all source meaning", "preserve all semantic information", "preserve every meaning unit"),
                    concept("tone", "tone"),
                    concept("register", "register"),
                    concept("speaker relationship", "speaker relationship", "relationship between speakers"),
                    concept("implication or nuance", "implication", "nuance"),
                    concept("politeness", "politeness"),
                    concept("no omission", "do not omit", "was omitted", "missing"),
                    concept("natural rather than mechanical", "not word by word", "idiomatic target-language wording"));
            assertConcept(translation, "naturalness cannot delete meaning",
                    "naturalness never justifies deleting source meaning",
                    "natural phrasing cannot omit source meaning");
        }

        @Test
        @DisplayName("Correction distinguishes grammar, usage, frequency, context, and naturalness")
        void classifiesCorrectionQuality() {
            String naturalness = section(PROMPT, "naturalness policy", "translation quality gate");
            assertEachConcept(naturalness,
                    concept("grammatically incorrect", "grammatically incorrect"),
                    concept("correct but unnatural", "grammatically correct but unnatural"),
                    concept("correct but uncommon", "grammatically correct but uncommon"),
                    concept("context-dependent", "context-dependent"),
                    concept("fully natural", "fully natural"),
                    concept("reasoned classification", "explain why", "explain the classification"),
                    concept("meaning preservation", "preserve the intended meaning"));
        }

        @Test
        @DisplayName("Grammar explanations require natural, usable examples")
        void requiresNaturalGrammarExamples() {
            assertConcept(PROMPT, "native-acceptable examples",
                    "a native speaker would naturally accept", "natural japanese");
            assertConcept(PROMPT, "at least three examples", "at least 3", "ít nhất 3", "tối thiểu 3");
            assertEachConcept(PROMPT,
                    concept("Japanese example", "japanese:"),
                    concept("kana reading", "kana:"),
                    concept("romaji reading", "romaji:"),
                    concept("Vietnamese translation", "vietnamese:"));
        }

        @Test
        @DisplayName("Runs all seven silent expert review dimensions")
        void performsSevenStepExpertReview() {
            String review = section(PROMPT, "expert internal review", "per-answer verification details");
            assertEachConcept(review,
                    concept("factual accuracy review", "factual accuracy review"),
                    concept("grammar review", "grammar review"),
                    concept("linguistic terminology review", "linguistic terminology review"),
                    concept("translation completeness review", "translation completeness review"),
                    concept("naturalness review", "naturalness review"),
                    concept("beginner-friendliness review", "beginner-friendliness review"),
                    concept("contradiction review", "contradiction review"));
            assertConcept(review, "silent review", "silently perform", "never show");
            assertConcept(review, "only final answer is visible", "only output the final reviewed answer");
            assertConcept(review, "failed review triggers another pass", "repeat the seven-step review", "rewrite the answer");
        }
    }

    @Nested
    @DisplayName("Scope regression guards")
    class ScopeRegressionGuards {

        @Test
        @DisplayName("Material chat inherits the full expert contract")
        void materialChatInheritsExpertContract() {
            assertConcept(PROMPT_WITH_MATERIAL, "expert internal review", "expert internal review");
            assertConcept(PROMPT_WITH_MATERIAL, "authoritative sources", "authoritative sources");
            assertConcept(PROMPT_WITH_MATERIAL, "material context", "current material context");
        }

        @Test
        @DisplayName("Expert chat rules never bleed into either quiz prompt")
        void quizGenerationRemainsIsolated() {
            List<String> quizPrompts = List.of(
                    AiPromptBuilder.buildQuizGenerationPrompt(
                            "Grammar N5", "Particles", 3, "MULTIPLE_CHOICE", "Easy"),
                    AiPromptBuilder.buildQuizGenerationPrompt(
                            "Grammar N5", "Particles", 3, "MULTIPLE_CHOICE", "Easy",
                            List.of("Grammar", "Vocabulary")));

            for (String quiz : quizPrompts) {
                assertTrue(quiz.contains("question") && quiz.contains("options") && quiz.contains("correctAnswer"),
                        "Quiz prompt must retain its JSON question contract");
                for (String chatOnlyConcept : List.of(
                        "expert internal review", "no false simplifications", "when experts disagree")) {
                    assertFalse(normalize(quiz).contains(chatOnlyConcept),
                            "Quiz prompt must not inherit chat-only expert concept: " + chatOnlyConcept);
                }
            }
        }
    }

    private static String[] concept(String label, String... alternatives) {
        String[] concept = new String[alternatives.length + 1];
        concept[0] = label;
        System.arraycopy(alternatives, 0, concept, 1, alternatives.length);
        return concept;
    }

    private static void assertEachConcept(String text, String[]... concepts) {
        for (String[] concept : concepts) {
            assertConcept(text, concept[0], Arrays.copyOfRange(concept, 1, concept.length));
        }
    }

    private static void assertConcept(String text, String label, String... alternatives) {
        String normalizedText = normalize(text);
        boolean present = Arrays.stream(alternatives)
                .map(AiSenseiExpertPromptTest::normalize)
                .anyMatch(normalizedText::contains);
        assertTrue(present, () -> "Missing concept '" + label + "'; accepted indicators: "
                + Arrays.toString(alternatives));
    }

    private static String section(String text, String startConcept, String endConcept) {
        String normalizedText = normalize(text);
        int start = normalizedText.indexOf(normalize(startConcept));
        int end = normalizedText.indexOf(normalize(endConcept), Math.max(0, start + 1));
        assertTrue(start >= 0, () -> "Missing section concept: " + startConcept);
        assertTrue(end > start, () -> "Missing section boundary concept after '" + startConcept + "': " + endConcept);
        return normalizedText.substring(start, end);
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }
}
