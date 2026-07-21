package com.midori.ai.util;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.entity.Difficulty;
import com.midori.entity.QuestionType;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Regression tests for the strict question-count + type + difficulty-distribution
 * pipeline used by GENERATE_FROM_CONTENT mode.
 *
 * <p>These tests exercise the units in isolation:
 * <ul>
 *   <li>{@link DifficultyDistribution} — percentage validation + largest-remainder
 *       allocation.</li>
 *   <li>{@link QuestionTypeValidator} — strict type contracts and repair.</li>
 *   <li>{@link AiExistingQuestionParser} — sanitizer with type + distribution
 *       enforcement.</li>
 * </ul>
 *
 * <p>The pipeline is intentionally written so that each layer is independently
 * testable; the AI provider and the controller are exercised by separate tests
 * in {@code AiPdfPreviewControllerTest}.
 */
public class AiGenerationStrictPipelineTest {

    // ============================================================
    // DifficultyDistribution tests
    // ============================================================

    @Test
    void percentages_sumTo100_required() {
        // Valid percentages are accepted.
        DifficultyDistribution.validatePercentages(30, 50, 20);
        DifficultyDistribution.validatePercentages(0, 0, 100);
        DifficultyDistribution.validatePercentages(100, 0, 0);

        // Anything not summing to 100 must throw.
        IllegalArgumentException bad = assertThrows(IllegalArgumentException.class,
                () -> DifficultyDistribution.validatePercentages(30, 50, 10));
        assertTrue(bad.getMessage().contains("100"));

        // Out-of-range must throw.
        assertThrows(IllegalArgumentException.class,
                () -> DifficultyDistribution.validatePercentages(-1, 50, 51));
        assertThrows(IllegalArgumentException.class,
                () -> DifficultyDistribution.validatePercentages(101, 0, 0));
    }

    @Test
    void allocate_tenQuestions_matchesRequest() {
        Map<Difficulty, Integer> out =
                DifficultyDistribution.allocate(10, 30, 50, 20);
        assertEquals(3, out.get(Difficulty.EASY));
        assertEquals(5, out.get(Difficulty.MEDIUM));
        assertEquals(2, out.get(Difficulty.HARD));
        // Sum must equal exactly the requested total.
        assertEquals(10, sum(out));
    }

    @Test
    void allocate_sevenQuestions_largestRemainderMedWins() {
        Map<Difficulty, Integer> out =
                DifficultyDistribution.allocate(7, 30, 50, 20);
        // Raw 2.1 / 3.5 / 1.4 → floors 2/3/1, remainder 1, largest remainder
        // is MEDIUM (0.5) → medium becomes 4.
        assertEquals(2, out.get(Difficulty.EASY));
        assertEquals(4, out.get(Difficulty.MEDIUM));
        assertEquals(1, out.get(Difficulty.HARD));
        assertEquals(7, sum(out));
    }

    @Test
    void allocate_singleBucketFullSumsExactlyToTotal() {
        // 100% in one bucket, N total questions → that bucket gets N.
        assertEquals(10, sum(DifficultyDistribution.allocate(10, 0, 0, 100)));
        assertEquals(10, sum(DifficultyDistribution.allocate(10, 0, 100, 0)));
        assertEquals(10, sum(DifficultyDistribution.allocate(10, 100, 0, 0)));
    }

    @Test
    void allocate_countOutOfRangeThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> DifficultyDistribution.allocate(0, 30, 50, 20));
        assertThrows(IllegalArgumentException.class,
                () -> DifficultyDistribution.allocate(101, 30, 50, 20));
        assertThrows(IllegalArgumentException.class,
                () -> DifficultyDistribution.allocate(-5, 30, 50, 20));
    }

    @Test
    void formatForPrompt_isStable() {
        Map<Difficulty, Integer> map = new HashMap<>();
        map.put(Difficulty.EASY, 3);
        map.put(Difficulty.MEDIUM, 5);
        map.put(Difficulty.HARD, 2);
        String s = DifficultyDistribution.formatForPrompt(map);
        assertEquals("EASY=3, MEDIUM=5, HARD=2", s);
    }

    @Test
    void normalize_acceptsAliasCasings() {
        assertEquals(Difficulty.EASY, DifficultyDistribution.normalize("easy"));
        assertEquals(Difficulty.EASY, DifficultyDistribution.normalize("EASY"));
        assertEquals(Difficulty.EASY, DifficultyDistribution.normalize("  Easy "));
        assertEquals(Difficulty.MEDIUM, DifficultyDistribution.normalize("MEDIUM"));
        assertEquals(Difficulty.HARD, DifficultyDistribution.normalize("hard"));
        assertNull(DifficultyDistribution.normalize("unknown"));
        assertNull(DifficultyDistribution.normalize(null));
    }

    // ============================================================
    // QuestionTypeValidator tests
    // ============================================================

    @Test
    void validateMultipleChoice_acceptsValidStructure() {
        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        answers.add(answer("A", true));
        answers.add(answer("B", false));
        answers.add(answer("C", false));
        answers.add(answer("D", false));
        assertTrue(QuestionTypeValidator.validateMultipleChoice(answers));

        // Duplicate options → invalid.
        List<AiExamParseResponse.AiAnswerDto> dup = new ArrayList<>();
        dup.add(answer("A", true));
        dup.add(answer("a", false));
        assertFalse(QuestionTypeValidator.validateMultipleChoice(dup));

        // Zero or two correct → invalid.
        List<AiExamParseResponse.AiAnswerDto> zeroCorrect = new ArrayList<>();
        zeroCorrect.add(answer("A", false));
        zeroCorrect.add(answer("B", false));
        assertFalse(QuestionTypeValidator.validateMultipleChoice(zeroCorrect));
    }

    @Test
    void validateFillBlank_requiresBlankMarker() {
        assertFalse(QuestionTypeValidator.validateFillBlank(
                "What is '猫' in English?",
                List.of(answer("cat", true))));
        assertTrue(QuestionTypeValidator.validateFillBlank(
                "Translate 'cat': ___",
                List.of(answer("猫", true))));
        assertTrue(QuestionTypeValidator.validateFillBlank(
                "Fill in (blank)",
                List.of(answer("答え", true))));
    }

    @Test
    void validateShortAnswer_requiresContent() {
        assertFalse(QuestionTypeValidator.validateShortAnswer("", List.of(answer("ok", true))));
        assertTrue(QuestionTypeValidator.validateShortAnswer("Explain は vs が.", List.of(answer("ok", true))));
        assertTrue(QuestionTypeValidator.validateShortAnswer("Explain は vs が.", null));
        // Short answer with 2 answer slots → invalid.
        assertFalse(QuestionTypeValidator.validateShortAnswer("Explain は vs が.",
                List.of(answer("ok", true), answer("ok2", false))));
    }

    @Test
    void validateTrueFalse_requiresTrueFalseLabels() {
        List<AiExamParseResponse.AiAnswerDto> tf = new ArrayList<>();
        tf.add(answer("True", true));
        tf.add(answer("False", false));
        assertTrue(QuestionTypeValidator.validateTrueFalse(tf));

        // Wrong labels → invalid.
        List<AiExamParseResponse.AiAnswerDto> wrong = new ArrayList<>();
        wrong.add(answer("Đúng", true));
        wrong.add(answer("Sai", false));
        // Vietnamese Đúng/Sai are accepted by the validator.
        assertTrue(QuestionTypeValidator.validateTrueFalse(wrong));

        // Truly invalid labels → invalid.
        List<AiExamParseResponse.AiAnswerDto> wrong2 = new ArrayList<>();
        wrong2.add(answer("Y", true));
        wrong2.add(answer("N", false));
        assertFalse(QuestionTypeValidator.validateTrueFalse(wrong2));
    }

    @Test
    void normalize_acceptsTypeAliases() {
        assertEquals(QuestionType.MULTIPLE_CHOICE, QuestionTypeValidator.normalize("MCQ"));
        assertEquals(QuestionType.TRUE_FALSE, QuestionTypeValidator.normalize("true_false"));
        assertEquals(QuestionType.TRUE_FALSE, QuestionTypeValidator.normalize("True/False"));
        assertEquals(QuestionType.FILL_BLANK, QuestionTypeValidator.normalize("Fill in the blank"));
        assertEquals(QuestionType.SHORT_ANSWER, QuestionTypeValidator.normalize("short_answer"));
        assertEquals(QuestionType.SHORT_ANSWER, QuestionTypeValidator.normalize("ESSAY"));
        assertNull(QuestionTypeValidator.normalize("unknown"));
    }

    // ============================================================
    // Sanitizer tests (type + distribution)
    // ============================================================

    private List<AiExamParseResponse.AiQuestionDto> buildMultipleChoiceRaw(
            int count, String difficulty) {
        List<AiExamParseResponse.AiQuestionDto> out = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
            q.setType("MULTIPLE_CHOICE");
            q.setContent("Question " + i);
            q.setDifficulty(difficulty);
            q.setCategory("Vocabulary");
            q.setAnswers(List.of(
                    answer("A" + i, true),
                    answer("B" + i, false),
                    answer("C" + i, false),
                    answer("D" + i, false)));
            out.add(q);
        }
        return out;
    }

    @Test
    void sanitizer_exactCountRequested_respectsPerBucketCap() {
        // AI returned 12 questions, all in MEDIUM, requested 10 with
        // EASY=3 / MEDIUM=5 / HARD=2. The sanitizer keeps exactly the
        // MEDIUM cap (5) and drops the overflow; the SERVICE layer is
        // responsible for retrying to reach the EASY/HARD buckets.
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 3);
        distribution.put(Difficulty.MEDIUM, 5);
        distribution.put(Difficulty.HARD, 2);

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        buildMultipleChoiceRaw(12, "Medium"),
                        List.of("VOCABULARY"),
                        null,
                        QuestionType.MULTIPLE_CHOICE,
                        distribution);

        // The sanitizer can only keep the MEDIUM bucket cap because no EASY
        // or HARD questions were provided.
        assertEquals(5, result.finalCount);
        for (var q : result.questions) {
            assertEquals("Medium", q.getDifficulty());
        }
        assertTrue(result.droppedByReason.getOrDefault("excess_difficulty", 0) >= 7);
    }

    @Test
    void sanitizer_keepsExactTotalWhenDistributionMatches() {
        // When the raw input already has the right shape, the sanitizer keeps
        // exactly the requested total (no drops, no extras).
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 3);
        distribution.put(Difficulty.MEDIUM, 5);
        distribution.put(Difficulty.HARD, 2);

        List<AiExamParseResponse.AiQuestionDto> balanced = new ArrayList<>();
        for (int i = 0; i < 3; i++) balanced.add(buildMultipleChoiceRaw(1, "Easy").get(0));
        for (int i = 0; i < 5; i++) balanced.add(buildMultipleChoiceRaw(1, "Medium").get(0));
        for (int i = 0; i < 2; i++) balanced.add(buildMultipleChoiceRaw(1, "Hard").get(0));

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        balanced,
                        List.of("VOCABULARY"),
                        null,
                        QuestionType.MULTIPLE_CHOICE,
                        distribution);

        assertEquals(10, result.finalCount);
        int easy = 0, medium = 0, hard = 0;
        for (var q : result.questions) {
            switch (q.getDifficulty()) {
                case "Easy": easy++; break;
                case "Medium": medium++; break;
                case "Hard": hard++; break;
                default: break;
            }
        }
        assertEquals(3, easy);
        assertEquals(5, medium);
        assertEquals(2, hard);
    }

    @Test
    void sanitizer_rejectsWrongQuestionType() {
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 1);
        distribution.put(Difficulty.MEDIUM, 1);
        distribution.put(Difficulty.HARD, 0);

        // Mix of MCQ + FILL_BLANK + MCQ while expecting MULTIPLE_CHOICE.
        var mcqEasy = buildMultipleChoiceRaw(1, "Easy").get(0);
        mcqEasy.setContent("Easy MCQ");
        var mcqMedium = buildMultipleChoiceRaw(1, "Medium").get(0);
        mcqMedium.setContent("Medium MCQ");

        var fill = new AiExamParseResponse.AiQuestionDto();
        fill.setType("FILL_BLANK");
        fill.setContent("Translate ___");
        fill.setDifficulty("Easy");
        fill.setCategory("Vocabulary");
        fill.setAnswers(List.of(answer("答え", true)));

        List<AiExamParseResponse.AiQuestionDto> mixed = new ArrayList<>();
        mixed.add(mcqEasy);
        mixed.add(fill);
        mixed.add(mcqMedium);

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        mixed,
                        List.of("VOCABULARY"),
                        null,
                        QuestionType.MULTIPLE_CHOICE,
                        distribution);

        // The FILL_BLANK question must be dropped with wrong_question_type.
        assertEquals(2, result.finalCount);
        assertTrue(result.droppedByReason.getOrDefault("wrong_question_type", 0) >= 1);
        for (var q : result.questions) {
            assertEquals("MULTIPLE_CHOICE", q.getType());
        }
    }

    @Test
    void sanitizer_repairsAndDropsInvalidFillBlank() {
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 1);
        distribution.put(Difficulty.MEDIUM, 1);
        distribution.put(Difficulty.HARD, 0);

        // Fill-blank without marker.
        var fillBad = new AiExamParseResponse.AiQuestionDto();
        fillBad.setType("FILL_BLANK");
        fillBad.setContent("Translate 'cat' into Japanese.");
        fillBad.setDifficulty("Easy");
        fillBad.setCategory("Vocabulary");
        fillBad.setAnswers(List.of(answer("猫", true)));

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        List.of(fillBad),
                        List.of("VOCABULARY"),
                        null,
                        QuestionType.FILL_BLANK,
                        distribution);

        // Repair layer appends the blank marker, so the question survives.
        assertEquals(1, result.finalCount);
        assertTrue(result.questions.get(0).getContent().contains("___"));
    }

    @Test
    void sanitizer_repairsMissingDifficultyIntoLowestFreeBucket() {
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 1);
        distribution.put(Difficulty.MEDIUM, 1);
        distribution.put(Difficulty.HARD, 0);

        var q = buildMultipleChoiceRaw(1, "Unknown").get(0);
        // Override difficulty to something invalid.
        q.setDifficulty("Unknown");

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        List.of(q),
                        List.of("VOCABULARY"),
                        null,
                        QuestionType.MULTIPLE_CHOICE,
                        distribution);

        assertEquals(1, result.finalCount);
        // Repaired into Easy (first bucket with capacity).
        assertEquals("Easy", result.questions.get(0).getDifficulty());
    }

    @Test
    void sanitizer_dropDuplicatesKeepsUniqueOnly() {
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 1);
        distribution.put(Difficulty.MEDIUM, 1);
        distribution.put(Difficulty.HARD, 0);

        // Two identical MCQ questions.
        var q1 = buildMultipleChoiceRaw(1, "Easy").get(0);
        var q2 = buildMultipleChoiceRaw(1, "Easy").get(0);
        var q3 = buildMultipleChoiceRaw(1, "Medium").get(0);
        q3.setContent("Question 99");

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        List.of(q1, q2, q3),
                        List.of("VOCABULARY"),
                        null,
                        QuestionType.MULTIPLE_CHOICE,
                        distribution);

        // Duplicate is dropped, leaving exactly 2.
        assertEquals(2, result.finalCount);
    }

    @Test
    void sanitizer_japaneseUtf8Survives() {
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 1);
        distribution.put(Difficulty.MEDIUM, 0);
        distribution.put(Difficulty.HARD, 0);

        var q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent("図書館の読み方は？");
        q.setDifficulty("Easy");
        q.setCategory("Vocabulary");
        q.setAnswers(List.of(
                answer("としょかん", true),
                answer("としょたん", false),
                answer("とうしょかん", false),
                answer("とうしょたん", false)));

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        List.of(q),
                        List.of("VOCABULARY"),
                        null,
                        QuestionType.MULTIPLE_CHOICE,
                        distribution);

        assertEquals(1, result.finalCount);
        assertEquals("図書館の読み方は？", result.questions.get(0).getContent());
        assertEquals("としょかん", result.questions.get(0).getAnswers().get(0).getContent());
    }

    @Test
    void sanitizer_shortAnswerPasses() {
        Map<Difficulty, Integer> distribution = new HashMap<>();
        distribution.put(Difficulty.EASY, 1);
        distribution.put(Difficulty.MEDIUM, 0);
        distribution.put(Difficulty.HARD, 0);

        var q = new AiExamParseResponse.AiQuestionDto();
        q.setType("SHORT_ANSWER");
        q.setContent("Explain the difference between は and が.");
        q.setDifficulty("Easy");
        q.setCategory("Grammar");
        q.setAnswers(List.of(answer("は marks topic; が marks subject.", true)));

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                        List.of(q),
                        List.of("GRAMMAR"),
                        null,
                        QuestionType.SHORT_ANSWER,
                        distribution);

        assertEquals(1, result.finalCount);
        assertEquals("SHORT_ANSWER", result.questions.get(0).getType());
    }

    // ============================================================
    // Helpers
    // ============================================================

    private AiExamParseResponse.AiAnswerDto answer(String content, boolean isCorrect) {
        AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
        a.setContent(content);
        a.setIsCorrect(isCorrect);
        return a;
    }

    private int sum(Map<Difficulty, Integer> m) {
        int s = 0;
        for (Integer v : m.values()) if (v != null) s += v;
        return s;
    }
}
