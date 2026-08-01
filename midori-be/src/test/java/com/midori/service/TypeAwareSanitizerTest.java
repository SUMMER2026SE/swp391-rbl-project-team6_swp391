package com.midori.service;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.entity.QuestionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies that the type-aware sanitizer correctly accepts / rejects questions
 * according to their declared structural rules, NOT the legacy MCQ ≥2-options rule.
 *
 * Tests required by the Teacher AI PDF bug fix:
 *  1. FILL_BLANK with one answer is accepted.
 *  2. SHORT_ANSWER with one reference answer is accepted.
 *  3. TRUE_FALSE is accepted with canonical structure.
 *  4. MULTIPLE_CHOICE still requires valid options (at least 2).
 *  5. expectedType is propagated into sanitization (wrong type is dropped).
 *  6. questionCount=10 is preserved (no systematic 5-cap).
 *  7. First pass accepts 5, top-up sanitizer also accepts 5.
 *  8. Accepted questions from pass 1 are not double-dropped.
 */
@DisplayName("Type-aware sanitizer — Teacher AI PDF fix")
class TypeAwareSanitizerTest {

    private static AiExamParseResponse.AiQuestionDto singleAnswerQuestion(
            String type, String content, String answer) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType(type);
        q.setContent(content);
        q.setDifficulty("MEDIUM");
        q.setCategory("Vocabulary");
        AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
        a.setContent(answer);
        a.setIsCorrect(true);
        q.setAnswers(List.of(a));
        return q;
    }

    private static AiExamParseResponse.AiQuestionDto mcqQuestion(String content, int correctIdx) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent(content);
        q.setDifficulty("MEDIUM");
        q.setCategory("Vocabulary");
        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
            a.setContent("Option " + i);
            a.setIsCorrect(i == correctIdx);
            answers.add(a);
        }
        q.setAnswers(answers);
        return q;
    }

    private static AiExamParseResponse.AiQuestionDto trueFalseQuestion(String content, boolean isTrue) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("TRUE_FALSE");
        q.setContent(content);
        q.setDifficulty("MEDIUM");
        q.setCategory("Grammar");
        AiExamParseResponse.AiAnswerDto trueAns = new AiExamParseResponse.AiAnswerDto();
        trueAns.setContent("True");
        trueAns.setIsCorrect(isTrue);
        AiExamParseResponse.AiAnswerDto falseAns = new AiExamParseResponse.AiAnswerDto();
        falseAns.setContent("False");
        falseAns.setIsCorrect(!isTrue);
        q.setAnswers(List.of(trueAns, falseAns));
        return q;
    }

    private static final List<String> VOCAB_SKILLS = List.of("VOCABULARY");

    @Nested
    @DisplayName("1. FILL_BLANK — accepts with one answer")
    class FillBlankAccepted {

        @Test
        void fillBlankWithOneAnswer_isAccepted() {
            AiExamParseResponse.AiQuestionDto q =
                    singleAnswerQuestion("FILL_BLANK", "日本語を___勉強しています。", "毎日");
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            List.of(q), VOCAB_SKILLS, null, QuestionType.FILL_BLANK, null);
            assertEquals(1, result.questions.size(),
                    "FILL_BLANK with single answer must NOT be dropped with too_few_options");
            assertEquals(0, result.droppedByReason.getOrDefault("too_few_options", 0));
        }
    }

    @Nested
    @DisplayName("2. SHORT_ANSWER — accepts with one reference answer")
    class ShortAnswerAccepted {

        @Test
        void shortAnswerWithOneAnswer_isAccepted() {
            AiExamParseResponse.AiQuestionDto q =
                    singleAnswerQuestion("SHORT_ANSWER", "What does 本 mean?", "book");
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            List.of(q), VOCAB_SKILLS, null, QuestionType.SHORT_ANSWER, null);
            assertEquals(1, result.questions.size(),
                    "SHORT_ANSWER with single reference answer must be accepted");
            assertEquals(0, result.droppedByReason.getOrDefault("too_few_options", 0));
        }
    }

    @Nested
    @DisplayName("3. TRUE_FALSE — accepted with canonical structure")
    class TrueFalseAccepted {

        @Test
        void trueFalseWithTwoOptions_isAccepted() {
            AiExamParseResponse.AiQuestionDto q =
                    trueFalseQuestion("日本語は世界で最も難しい言語です。", false);
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            List.of(q), List.of("GRAMMAR"), null, QuestionType.TRUE_FALSE, null);
            assertEquals(1, result.questions.size(),
                    "TRUE_FALSE with standard two-option structure must be accepted");
        }
    }

    @Nested
    @DisplayName("4. MULTIPLE_CHOICE — still requires valid options")
    class MultipleChoiceValidation {

        @Test
        void mcqWithValidOptions_isAccepted() {
            AiExamParseResponse.AiQuestionDto q = mcqQuestion("日本語で「本」は何ですか？", 0);
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            List.of(q), VOCAB_SKILLS, null, QuestionType.MULTIPLE_CHOICE, null);
            assertEquals(1, result.questions.size(), "MCQ with 4 options must be accepted");
        }

        @Test
        void mcqWithOneOption_isDropped() {
            AiExamParseResponse.AiQuestionDto q =
                    singleAnswerQuestion("MULTIPLE_CHOICE", "日本語で「本」は何ですか？", "book");
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            List.of(q), VOCAB_SKILLS, null, QuestionType.MULTIPLE_CHOICE, null);
            assertEquals(0, result.questions.size(),
                    "MCQ with only 1 option must be dropped");
        }
    }

    @Nested
    @DisplayName("5. expectedType propagation — wrong type is dropped")
    class ExpectedTypePropagation {

        @Test
        void mcqReturnedWhenFillBlankExpected_isDropped() {
            AiExamParseResponse.AiQuestionDto q = mcqQuestion("日本語で「本」は何ですか？", 0);
            // q.type = MULTIPLE_CHOICE but expectedType = FILL_BLANK
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            List.of(q), VOCAB_SKILLS, null, QuestionType.FILL_BLANK, null);
            assertEquals(0, result.questions.size(),
                    "MCQ returned when FILL_BLANK expected must be dropped");
            assertTrue(result.droppedByReason.getOrDefault("wrong_question_type", 0) > 0,
                    "Drop reason must be wrong_question_type");
        }

        @Test
        void fillBlankReturnedWhenFillBlankExpected_isAccepted() {
            AiExamParseResponse.AiQuestionDto q =
                    singleAnswerQuestion("FILL_BLANK", "___は日本の首都です。", "東京");
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            List.of(q), VOCAB_SKILLS, null, QuestionType.FILL_BLANK, null);
            assertEquals(1, result.questions.size(), "Matching type must be accepted");
        }
    }

    @Nested
    @DisplayName("6. questionCount=10 is preserved — no systematic 5-cap")
    class QuestionCountPreservation {

        @Test
        void tenFillBlankQuestions_allAccepted() {
            List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                questions.add(singleAnswerQuestion(
                        "FILL_BLANK", "Question " + i + " ___の答えは何ですか。", "ans" + i));
            }
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            questions, VOCAB_SKILLS, null, QuestionType.FILL_BLANK, null);
            assertEquals(10, result.questions.size(),
                    "All 10 FILL_BLANK questions must be accepted — no systematic 5-cap");
        }

        @Test
        void tenShortAnswerQuestions_allAccepted() {
            List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                questions.add(singleAnswerQuestion(
                        "SHORT_ANSWER", "Meaning of 語" + i + "?", "ans" + i));
            }
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            questions, VOCAB_SKILLS, null, QuestionType.SHORT_ANSWER, null);
            assertEquals(10, result.questions.size(),
                    "All 10 SHORT_ANSWER questions must be accepted");
        }
    }

    @Nested
    @DisplayName("7 & 8. Top-up — sanitizer independently accepts each pass")
    class TopUpBehavior {

        @Test
        void firstPassOf5_allAccepted() {
            List<AiExamParseResponse.AiQuestionDto> pass1 = new ArrayList<>();
            for (int i = 0; i < 5; i++) {
                pass1.add(singleAnswerQuestion("FILL_BLANK", "Pass1 q" + i + " ___", "a" + i));
            }
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            pass1, VOCAB_SKILLS, null, QuestionType.FILL_BLANK, null);
            assertEquals(5, result.questions.size(),
                    "First pass of 5 FILL_BLANK questions must all be accepted");
        }

        @Test
        void secondPassOf5_allAccepted() {
            List<AiExamParseResponse.AiQuestionDto> pass2 = new ArrayList<>();
            for (int i = 5; i < 10; i++) {
                pass2.add(singleAnswerQuestion("FILL_BLANK", "Pass2 q" + i + " ___", "a" + i));
            }
            AiExistingQuestionParser.GenerateSanitizeResult result =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            pass2, VOCAB_SKILLS, null, QuestionType.FILL_BLANK, null);
            assertEquals(5, result.questions.size(),
                    "Second pass of 5 FILL_BLANK questions must all be accepted");
        }
    }
}
