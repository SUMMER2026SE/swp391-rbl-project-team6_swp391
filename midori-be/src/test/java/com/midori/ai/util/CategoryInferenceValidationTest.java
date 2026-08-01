package com.midori.ai.util;

import com.midori.ai.dto.AiExamParseResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CategoryInferenceValidationTest {

    private AiExamParseResponse.AiQuestionDto createMCQQuestion(String content, String category) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent(content);
        q.setDifficulty("Medium");
        q.setCategory(category);
        
        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        AiExamParseResponse.AiAnswerDto a1 = new AiExamParseResponse.AiAnswerDto();
        a1.setContent("選択肢A");
        a1.setIsCorrect(true);
        answers.add(a1);
        
        AiExamParseResponse.AiAnswerDto a2 = new AiExamParseResponse.AiAnswerDto();
        a2.setContent("選択肢B");
        a2.setIsCorrect(false);
        answers.add(a2);
        
        q.setAnswers(answers);
        return q;
    }

    @Test
    void testGrammarQuestionWithAiCategoryGrammarIsAccepted() {
        List<AiExamParseResponse.AiQuestionDto> questions = List.of(
                createMCQQuestion("昨日、đỏ___行きましたか。", "Grammar")
        );
        
        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(questions, List.of("Grammar"), null);
                
        assertEquals(1, result.finalCount);
        assertEquals("Grammar", result.questions.get(0).getCategory());
        assertEquals(0, result.droppedByReason.get("off_skill"));
    }

    @Test
    void testJapaneseParticleQuestionWithoutGrammarKeywordsIsAcceptedWhenRequestedSkillIsGrammar() {
        // AI Category is missing (null)
        List<AiExamParseResponse.AiQuestionDto> questions = List.of(
                createMCQQuestion("昨日、đỏ___行きましたか。", null)
        );
        
        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(questions, List.of("Grammar"), null);
                
        assertEquals(1, result.finalCount);
        // Fallback should match the single requested skill "Grammar"
        assertEquals("Grammar", result.questions.get(0).getCategory());
        assertEquals(0, result.droppedByReason.get("off_skill"));
    }

    @Test
    void testVocabularyQuestionWithCategoryVocabularyIsAccepted() {
        List<AiExamParseResponse.AiQuestionDto> questions = List.of(
                createMCQQuestion("What is the meaning of '学校'?", "Vocabulary")
        );
        
        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(questions, List.of("Vocabulary"), null);
                
        assertEquals(1, result.finalCount);
        assertEquals("Vocabulary", result.questions.get(0).getCategory());
        assertEquals(0, result.droppedByReason.get("off_skill"));
    }

    @Test
    void testGrammarRequestWithExplicitAiCategoryVocabularyIsRejected() {
        List<AiExamParseResponse.AiQuestionDto> questions = List.of(
                createMCQQuestion("昨日、đỏ___行きましたか。", "Vocabulary")
        );
        
        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(questions, List.of("Grammar"), null);
                
        assertEquals(0, result.finalCount);
        assertEquals(1, result.droppedByReason.get("off_skill"));
    }

    @Test
    void testMissingCategoryFallsBackToSemanticInference() {
        // Content clearly contains Grammar keywords ("particle") but category is missing
        List<AiExamParseResponse.AiQuestionDto> questions = List.of(
                createMCQQuestion("What is the correct particle?", null)
        );
        
        // Even with multiple requested skills, semantic inference succeeds
        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(questions, List.of("Vocabulary", "Grammar"), null);
                
        assertEquals(1, result.finalCount);
        assertEquals("Grammar", result.questions.get(0).getCategory());
    }

    @Test
    void testInconclusiveInferenceWithSingleRequestedSkillFallsBackToThatSkill() {
        List<AiExamParseResponse.AiQuestionDto> questions = List.of(
                createMCQQuestion("これはテストの文です。日本語を含みます。", null)
        );
        
        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(questions, List.of("Listening"), null);
                
        assertEquals(1, result.finalCount);
        assertEquals("Listening", result.questions.get(0).getCategory());
    }

    @Test
    void testMultipleRequestedSkillsDoNotUseUnsafeArbitraryFallback() {
        List<AiExamParseResponse.AiQuestionDto> questions = List.of(
                createMCQQuestion("これはテストの文です。日本語を含みます。", null)
        );
        
        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(questions, List.of("Vocabulary", "Grammar"), null);
                
        assertEquals(0, result.finalCount);
        assertEquals(1, result.droppedByReason.get("off_skill"));
        assertEquals("unknown", questions.get(0).getCategory());
    }

    @ParameterizedTest
    @CsvSource({
        "vocabulary, Vocabulary",
        "VOCABULARY, Vocabulary",
        "WORD, Vocabulary",
        "words, Vocabulary",
        "lexical, Vocabulary",
        "grammar, Grammar",
        "GRAMMAR, Grammar",
        "PARTICLE, Grammar",
        "conjugation, Grammar",
        "reading, Reading",
        "reading comprehension, Reading",
        "comprehension, Reading",
        "writing, Writing",
        "sentence writing, Sentence Writing",
        "sentence_writing, Sentence Writing",
        "kanji, Kanji",
        "character, Kanji",
        "listening, Listening",
        "audio comprehension, Listening",
        "translation, Translation",
        "translate, Translation",
        "error correction, Error Correction",
        "error_correction, Error Correction",
        "correction, Error Correction"
    })
    void testCategoryNormalizationVariants(String raw, String expected) {
        assertEquals(expected, AiExistingQuestionParser.normalizeCategory(raw));
    }

    @ParameterizedTest
    @CsvSource({
        "Vocabulary, Vocabulary, true",
        "Translation, Vocabulary, true",
        "Grammar, Grammar, true",
        "Error Correction, Grammar, true",
        "Translation, Grammar, true",
        "Sentence Writing, Grammar, true",
        "Reading, Reading, true",
        "Writing, Writing, true",
        "Translation, Writing, true",
        "Sentence Writing, Writing, true",
        "Error Correction, Writing, true",
        "Vocabulary, Grammar, false",
        "Grammar, Vocabulary, false",
        "Reading, Writing, false"
    })
    void testIsCompatible(String category, String skill, boolean expected) {
        assertEquals(expected, AiExistingQuestionParser.isCompatible(category, skill));
    }
}
