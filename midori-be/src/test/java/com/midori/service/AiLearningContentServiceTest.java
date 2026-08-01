package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.controller.AiPdfPreviewController;
import com.midori.dto.response.AiPdfPreviewResponse;
import com.midori.repository.*;
import com.midori.validation.QuestionBankCompatibilityValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AiLearningContentServiceTest {

    @Mock
    private AiCoreService aiCoreService;

    @Mock
    private VocabularyLessonRepository vocabularyLessonRepository;
    @Mock
    private GrammarLessonRepository grammarLessonRepository;
    @Mock
    private ReadingLessonRepository readingLessonRepository;
    @Mock
    private ListeningLessonRepository listeningLessonRepository;
    @Mock
    private VocabularyItemRepository vocabularyItemRepository;
    @Mock
    private GrammarContentRepository grammarContentRepository;
    @Mock
    private GrammarExampleRepository grammarExampleRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    private AiLearningContentService aiLearningContentService;

    private AiPdfPreviewController aiPdfPreviewController;

    @Mock
    private PdfTextExtractor pdfTextExtractor;

    private QuestionBankCompatibilityValidator compatibilityValidator;

    @BeforeEach
    void setUp() {
        com.midori.ai.util.QuestionSemanticValidator semanticValidator = org.mockito.Mockito.mock(com.midori.ai.util.QuestionSemanticValidator.class);
        // By default, let's make validation pass so existing tests still work
        org.mockito.Mockito.lenient().when(semanticValidator.validate(org.mockito.Mockito.any(), org.mockito.Mockito.any()))
                .thenReturn(com.midori.ai.util.QuestionSemanticValidator.ValidationResult.valid());

        aiLearningContentService = new AiLearningContentService(
                vocabularyLessonRepository,
                grammarLessonRepository,
                readingLessonRepository,
                listeningLessonRepository,
                vocabularyItemRepository,
                grammarContentRepository,
                grammarExampleRepository,
                aiCoreService,
                objectMapper,
                semanticValidator
        );

        compatibilityValidator = new QuestionBankCompatibilityValidator();
        aiPdfPreviewController = new AiPdfPreviewController(pdfTextExtractor, aiCoreService, aiLearningContentService, compatibilityValidator);
    }

    @Test
    void testBalancedRandomizationAppliesToGeneratedQuestions() {
        // Given an AI response with multiple questions
        String rawJson = "{\n" +
                "  \"title\": \"Test\",\n" +
                "  \"description\": \"Test\",\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"content\": \"Q1\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"A\", \"isCorrect\": true},\n" +
                "        {\"content\": \"B\", \"isCorrect\": false},\n" +
                "        {\"content\": \"C\", \"isCorrect\": false},\n" +
                "        {\"content\": \"D\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"content\": \"Q2\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"A\", \"isCorrect\": true},\n" +
                "        {\"content\": \"B\", \"isCorrect\": false},\n" +
                "        {\"content\": \"C\", \"isCorrect\": false},\n" +
                "        {\"content\": \"D\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"content\": \"Q3\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"A\", \"isCorrect\": true},\n" +
                "        {\"content\": \"B\", \"isCorrect\": false},\n" +
                "        {\"content\": \"C\", \"isCorrect\": false},\n" +
                "        {\"content\": \"D\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"content\": \"Q4\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"A\", \"isCorrect\": true},\n" +
                "        {\"content\": \"B\", \"isCorrect\": false},\n" +
                "        {\"content\": \"C\", \"isCorrect\": false},\n" +
                "        {\"content\": \"D\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        when(aiCoreService.generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString(), anyList()))
                .thenReturn(rawJson);

        // When
        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some learning content...", 4, "MEDIUM", Arrays.asList("Vocabulary"));

        // Then
        assertNotNull(response);
        assertEquals(4, response.getQuestions().size());

        // Verify balanced randomization by checking if the correct answers are distributed
        int[] correctIndicesCount = new int[4];
        for (AiExamParseResponse.AiQuestionDto q : response.getQuestions()) {
            int correctIdx = -1;
            for (int i = 0; i < q.getAnswers().size(); i++) {
                if (Boolean.TRUE.equals(q.getAnswers().get(i).getIsCorrect())) {
                    correctIdx = i;
                    break;
                }
            }
            assertTrue(correctIdx >= 0 && correctIdx < 4, "Should have exactly one correct answer");
            correctIndicesCount[correctIdx]++;
        }

        // Since we have 4 questions, each index 0, 1, 2, 3 should ideally be used exactly once.
        for (int i = 0; i < 4; i++) {
            assertEquals(1, correctIndicesCount[i], "Correct answers should be perfectly balanced across 0,1,2,3 for 4 questions");
        }
    }

    @Test
    void testGenerateQuestions_automaticSupplementationSuccess() {
        // Mocking: 10 requested. First attempt returns 6 questions. Second attempt returns 4 questions.
        String firstRawJson = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q1\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A1\", \"isCorrect\": true}, {\"content\": \"B1\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q2\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A2\", \"isCorrect\": true}, {\"content\": \"B2\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q3\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A3\", \"isCorrect\": true}, {\"content\": \"B3\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q4\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A4\", \"isCorrect\": true}, {\"content\": \"B4\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q5\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A5\", \"isCorrect\": true}, {\"content\": \"B5\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q6\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A6\", \"isCorrect\": true}, {\"content\": \"B6\", \"isCorrect\": false}]}\n" +
                "  ]\n" +
                "}";
        String secondRawJson = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q7\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A7\", \"isCorrect\": true}, {\"content\": \"B7\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q8\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A8\", \"isCorrect\": true}, {\"content\": \"B8\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q9\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A9\", \"isCorrect\": true}, {\"content\": \"B9\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q10\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A10\", \"isCorrect\": true}, {\"content\": \"B10\", \"isCorrect\": false}]}\n" +
                "  ]\n" +
                "}";

        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(firstRawJson);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(4), anyString(), anyString(), anyList()))
                .thenReturn(secondRawJson);

        // When
        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));

        // Then
        assertNotNull(response);
        assertNull(response.getErrorMessage());
        assertEquals(10, response.getQuestions().size());

        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList());
        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(4), anyString(), anyString(), anyList());
    }

    @Test
    void testGenerateQuestions_automaticSupplementationPartialExhausted() {
        // Mocking: 10 requested.
        // First attempt (asks 10) -> returns 3
        // Second attempt (asks 7) -> returns 2
        // Third attempt (asks 5) -> returns 1
        String firstRaw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q1\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A1\", \"isCorrect\": true}, {\"content\": \"B1\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q2\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A2\", \"isCorrect\": true}, {\"content\": \"B2\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q3\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A3\", \"isCorrect\": true}, {\"content\": \"B3\", \"isCorrect\": false}]}\n" +
                "  ]\n" +
                "}";
        String secondRaw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q4\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A4\", \"isCorrect\": true}, {\"content\": \"B4\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q5\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A5\", \"isCorrect\": true}, {\"content\": \"B5\", \"isCorrect\": false}]}\n" +
                "  ]\n" +
                "}";
        String thirdRaw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q6\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A6\", \"isCorrect\": true}, {\"content\": \"B6\", \"isCorrect\": false}]}\n" +
                "  ]\n" +
                "}";

        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(firstRaw);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(7), anyString(), anyString(), anyList()))
                .thenReturn(secondRaw);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(5), anyString(), anyString(), anyList()))
                .thenReturn(thirdRaw);

        // When
        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));

        // Then
        assertNotNull(response);
        // Expect partial-result warning message matching the current contract
        assertEquals("6 of 10 questions were generated. Please try again.", response.getErrorMessage());
        assertEquals(6, response.getQuestions().size());

        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList());
        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(7), anyString(), anyString(), anyList());
        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(5), anyString(), anyString(), anyList());
    }

    @Test
    void testGenerateQuestions_realisticMultiAttemptRejectionReachesRequestedCount() {
        // Attempt 1: Asks 10. AI returns 10 raw, but 6 have invalid/empty options so only 4 survive.
        String attempt1Raw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q1\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A1\", \"isCorrect\": true}, {\"content\": \"B1\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q2\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A2\", \"isCorrect\": true}, {\"content\": \"B2\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q3\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A3\", \"isCorrect\": true}, {\"content\": \"B3\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q4\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A4\", \"isCorrect\": true}, {\"content\": \"B4\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q_invalid1\", \"category\": \"Vocabulary\", \"answers\": []}\n" +
                "    ,{\"content\": \"Q_invalid2\", \"category\": \"Vocabulary\", \"answers\": []}\n" +
                "    ,{\"content\": \"Q_invalid3\", \"category\": \"Vocabulary\", \"answers\": []}\n" +
                "    ,{\"content\": \"Q_invalid4\", \"category\": \"Vocabulary\", \"answers\": []}\n" +
                "    ,{\"content\": \"Q_invalid5\", \"category\": \"Vocabulary\", \"answers\": []}\n" +
                "    ,{\"content\": \"Q_invalid6\", \"category\": \"Vocabulary\", \"answers\": []}\n" +
                "  ]\n" +
                "}";

        // Attempt 2: Asks missing 6. AI returns 6, 4 are duplicates of Q1-Q4, so only 2 new unique (Q5, Q6) survive.
        String attempt2Raw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q1\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A1\", \"isCorrect\": true}, {\"content\": \"B1\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q2\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A2\", \"isCorrect\": true}, {\"content\": \"B2\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q5\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A5\", \"isCorrect\": true}, {\"content\": \"B5\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q6\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A6\", \"isCorrect\": true}, {\"content\": \"B6\", \"isCorrect\": false}]}\n" +
                "  ]\n" +
                "}";

        // Attempt 3: Asks missing 4. AI returns 4 new unique (Q7, Q8, Q9, Q10).
        String attempt3Raw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q7\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A7\", \"isCorrect\": true}, {\"content\": \"B7\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q8\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A8\", \"isCorrect\": true}, {\"content\": \"B8\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q9\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A9\", \"isCorrect\": true}, {\"content\": \"B9\", \"isCorrect\": false}]}\n" +
                "    ,{\"content\": \"Q10\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A10\", \"isCorrect\": true}, {\"content\": \"B10\", \"isCorrect\": false}]}\n" +
                "  ]\n" +
                "}";

        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(attempt1Raw);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(6), anyString(), anyString(), anyList()))
                .thenReturn(attempt2Raw);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(4), anyString(), anyString(), anyList()))
                .thenReturn(attempt3Raw);

        // When
        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));

        // Then
        assertNotNull(response);
        assertEquals(10, response.getQuestions().size());

        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList());
        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(6), anyString(), anyString(), anyList());
        verify(aiCoreService).generateQuestions(anyString(), anyString(), eq(4), anyString(), anyString(), anyList());
    }

    // ============================================================
    // LANGUAGE VALIDATION TESTS
    // ============================================================

    @Test
    void testSanitize_vietnameseQuestionText_dropped() {
        // Given: AI returns a question with Vietnamese prose in question text
        String rawJson = "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"content\": \"Dưới đây là câu hỏi về từ vựng. 「図書館」の nghĩa là gì?\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"Thư viện\", \"isCorrect\": true},\n" +
                "        {\"content\": \"Trường học\", \"isCorrect\": false},\n" +
                "        {\"content\": \"Cửa hàng\", \"isCorrect\": false},\n" +
                "        {\"content\": \"Bệnh viện\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        // When
        AiExamParseResponse parsed = AiExistingQuestionParser.parseAndNormalize(rawJson, objectMapper);
        AiExistingQuestionParser.GenerateSanitizeResult result = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                parsed.getQuestions(), Arrays.asList("Vocabulary"), null);

        // Then: question with Vietnamese prose is dropped
        assertEquals(0, result.questions.size());
        assertEquals(Integer.valueOf(1), result.droppedByReason.get("vietnamese_prose_in_question"));
    }

    @Test
    void testSanitize_vietnameseProseInOptions_dropped() {
        // Given: AI returns a question with Vietnamese prose in options
        // (full sentences with diacritics that trigger the fast-path detection)
        String rawJson = "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"content\": \"「食べる」の意味は?\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"Đáp án đúng là: Ăn / Uống\", \"isCorrect\": true},\n" +
                "        {\"content\": \"Giải thích: Ngủ\", \"isCorrect\": false},\n" +
                "        {\"content\": \"Đáp án sai: Đi\", \"isCorrect\": false},\n" +
                "        {\"content\": \"Nói\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        // When
        AiExamParseResponse parsed = AiExistingQuestionParser.parseAndNormalize(rawJson, objectMapper);
        AiExistingQuestionParser.GenerateSanitizeResult result = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                parsed.getQuestions(), Arrays.asList("Vocabulary"), null);

        // Then: question with Vietnamese prose in options is dropped
        assertEquals(0, result.questions.size());
        assertEquals(Integer.valueOf(1), result.droppedByReason.get("vietnamese_prose_in_options"));
    }

    @Test
    void testSanitize_japaneseQuestionText_kept() {
        // Given: AI returns a valid Japanese question
        String rawJson = "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"content\": \"「図書館」の意味は?\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"Thư viện\", \"isCorrect\": true},\n" +
                "        {\"content\": \"Trường học\", \"isCorrect\": false},\n" +
                "        {\"content\": \"Cửa hàng\", \"isCorrect\": false},\n" +
                "        {\"content\": \"Bệnh viện\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        // When
        AiExamParseResponse parsed = AiExistingQuestionParser.parseAndNormalize(rawJson, objectMapper);
        AiExistingQuestionParser.GenerateSanitizeResult result = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                parsed.getQuestions(), Arrays.asList("Vocabulary"), null);

        // Then: valid Japanese question is kept
        assertEquals(1, result.questions.size());
    }

    @Test
    void testSanitize_mixedValidAndInvalid_keepsValid() {
        // Given: AI returns a mix of one Vietnamese (invalid) and one Japanese (valid) question
        String rawJson = "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"content\": \"Dưới đây là câu hỏi về ngữ pháp. Đáp án là gì?\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"A\", \"isCorrect\": true},\n" +
                "        {\"content\": \"B\", \"isCorrect\": false},\n" +
                "        {\"content\": \"C\", \"isCorrect\": false},\n" +
                "        {\"content\": \"D\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Grammar\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"content\": \"「がくせい」の読み方は?\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"がくせい\", \"isCorrect\": true},\n" +
                "        {\"content\": \"がくしょう\", \"isCorrect\": false},\n" +
                "        {\"content\": \"がくせえ\", \"isCorrect\": false},\n" +
                "        {\"content\": \"がくせ\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Vocabulary\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        // When
        AiExamParseResponse parsed = AiExistingQuestionParser.parseAndNormalize(rawJson, objectMapper);
        AiExamParseResponse sanitize = AiExistingQuestionParser.sanitize(parsed);
        AiExistingQuestionParser.GenerateSanitizeResult result = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                sanitize.getQuestions(), Arrays.asList("Vocabulary", "Grammar"), null);

        // Then: Vietnamese question dropped, Japanese question kept
        assertEquals(1, result.questions.size());
        assertEquals("「がくせい」の読み方は?", result.questions.get(0).getContent());
        assertEquals(Integer.valueOf(1), result.droppedByReason.get("vietnamese_prose_in_question"));
    }

    @Test
    void testSanitize_translationFormatAllowsVietnamese() {
        // Given: TRANSLATION format question with Vietnamese sourceText (allowed by language contract)
        // Provide dummy options to avoid too_few_options rejection
        String rawJson = "{\n" +
                "  \"questions\": [\n" +
                "    {\n" +
                "      \"type\": \"TRANSLATION\",\n" +
                "      \"content\": \"Dịch câu sau sang tiếng Nhật\",\n" +
                "      \"answers\": [\n" +
                "        {\"content\": \"A\", \"isCorrect\": false},\n" +
                "        {\"content\": \"B\", \"isCorrect\": false},\n" +
                "        {\"content\": \"C\", \"isCorrect\": false},\n" +
                "        {\"content\": \"D\", \"isCorrect\": false}\n" +
                "      ],\n" +
                "      \"category\": \"Writing\",\n" +
                "      \"translationMetadata\": {\n" +
                "        \"direction\": \"VI_TO_JA\",\n" +
                "        \"sourceText\": \"Tôi đi học\",\n" +
                "        \"referenceAnswer\": \"私は学校に行きます。\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        // When
        AiExamParseResponse parsed = AiExistingQuestionParser.parseAndNormalize(rawJson, objectMapper);
        AiExistingQuestionParser.GenerateSanitizeResult result = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                parsed.getQuestions(), Arrays.asList("Writing"), null);

        // Then: TRANSLATION format is NOT dropped by Vietnamese prose check
        // because TRANSLATION bypasses the Vietnamese prose guard
        assertEquals(1, result.questions.size());
    }

    @Test
    void testContainsVietnameseProse_rejectsDướiĐâyLà() {
        assertTrue(AiExistingQuestionParser.containsVietnameseProse("Dưới đây là câu hỏi."));
        assertTrue(AiExistingQuestionParser.containsVietnameseProse("Dưới đây là các câu hỏi về ngữ pháp."));
    }

    @Test
    void testContainsVietnameseProse_rejectsCâuHỏi() {
        assertTrue(AiExistingQuestionParser.containsVietnameseProse("Câu hỏi 1: Nghĩa của từ là gì?"));
    }

    @Test
    void testContainsVietnameseProse_rejectsĐápÁn() {
        assertTrue(AiExistingQuestionParser.containsVietnameseProse("Đáp án đúng là: ..."));
    }

    @Test
    void testContainsVietnameseProse_rejectsGiảiThích() {
        assertTrue(AiExistingQuestionParser.containsVietnameseProse("Giải thích: Vì sao đáp án này đúng."));
    }

    @Test
    void testContainsVietnameseProse_acceptsJapaneseOnly() {
        assertFalse(AiExistingQuestionParser.containsVietnameseProse("「図書館」の意味は?"));
        assertFalse(AiExistingQuestionParser.containsVietnameseProse("学校はどこですか。"));
    }

    @Test
    void testContainsVietnameseProse_acceptsEnglish() {
        assertFalse(AiExistingQuestionParser.containsVietnameseProse("What is the meaning of this word?"));
    }

    @Test
    void testNewRetry_Attempt1_5Accepted_Attempt2_5Accepted_Result_10_10() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q2\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A2\",\"isCorrect\":true},{\"content\":\"B2\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q3\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A3\",\"isCorrect\":true},{\"content\":\"B3\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q4\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A4\",\"isCorrect\":true},{\"content\":\"B4\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q5\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A5\",\"isCorrect\":true},{\"content\":\"B5\",\"isCorrect\":false}]}" +
                "]}";
        String raw2 = "{\"questions\":[" +
                "{\"content\":\"Q6\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A6\",\"isCorrect\":true},{\"content\":\"B6\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q7\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A7\",\"isCorrect\":true},{\"content\":\"B7\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q8\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A8\",\"isCorrect\":true},{\"content\":\"B8\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q9\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A9\",\"isCorrect\":true},{\"content\":\"B9\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q10\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A10\",\"isCorrect\":true},{\"content\":\"B10\",\"isCorrect\":false}]}" +
                "]}";
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(5), anyString(), anyString(), anyList()))
                .thenReturn(raw2);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));
        assertNotNull(response);
        assertEquals(10, response.getQuestions().size());
        assertEquals(10, response.getGeneratedCount());
        assertFalse(response.isPartial());
    }

    @Test
    void testNewRetry_Attempt1_5Accepted_Attempt2_4Accepted_Result_9_10() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q2\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A2\",\"isCorrect\":true},{\"content\":\"B2\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q3\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A3\",\"isCorrect\":true},{\"content\":\"B3\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q4\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A4\",\"isCorrect\":true},{\"content\":\"B4\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q5\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A5\",\"isCorrect\":true},{\"content\":\"B5\",\"isCorrect\":false}]}" +
                "]}";
        String raw2 = "{\"questions\":[" +
                "{\"content\":\"Q6\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A6\",\"isCorrect\":true},{\"content\":\"B6\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q7\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A7\",\"isCorrect\":true},{\"content\":\"B7\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q8\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A8\",\"isCorrect\":true},{\"content\":\"B8\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q9\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A9\",\"isCorrect\":true},{\"content\":\"B9\",\"isCorrect\":false}]}" +
                "]}";
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(5), anyString(), anyString(), anyList()))
                .thenReturn(raw2);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));
        assertNotNull(response);
        assertEquals(9, response.getQuestions().size());
        assertTrue(response.isPartial());
    }

    @Test
    void testNewRetry_Attempt1_5Accepted_Attempt2_0Accepted_RetryMUSTContinue() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q2\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A2\",\"isCorrect\":true},{\"content\":\"B2\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q3\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A3\",\"isCorrect\":true},{\"content\":\"B3\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q4\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A4\",\"isCorrect\":true},{\"content\":\"B4\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q5\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A5\",\"isCorrect\":true},{\"content\":\"B5\",\"isCorrect\":false}]}" +
                "]}";
        String raw2 = "{\"questions\":[]}"; // 0 accepted
        String raw3 = "{\"questions\":[" +
                "{\"content\":\"Q6\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A6\",\"isCorrect\":true},{\"content\":\"B6\",\"isCorrect\":false}]}" +
                "]}";
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(5), anyString(), anyString(), anyList()))
                .thenReturn(raw2, raw3);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));
        assertNotNull(response);
        assertEquals(6, response.getQuestions().size());
        verify(aiCoreService, times(4)).generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString(), anyList());
    }

    @Test
    void testNewRetry_Attempt1_0Accepted_AllOffSkill_ImmediateTermination() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Grammar\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}" +
                "]}";
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));
        assertNotNull(response);
        assertEquals(0, response.getQuestions().size());
        verify(aiCoreService, times(1)).generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString(), anyList());
    }

    @Test
    void testNewRetry_Attempt1_0Accepted_AllMissingReadingPassage_ImmediateTermination() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Reading\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}" +
                "]}";
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Reading"), null);
        assertNotNull(response);
        assertEquals(0, response.getQuestions().size());
        verify(aiCoreService, times(1)).generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString(), anyList());
    }

    @Test
    void testNewRetry_Attempt1QuestionsPreservedAfterAttempt2() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}" +
                "]}";
        String raw2 = "{\"questions\":[" +
                "{\"content\":\"Q2\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A2\",\"isCorrect\":true},{\"content\":\"B2\",\"isCorrect\":false}]}" +
                "]}";
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(9), anyString(), anyString(), anyList()))
                .thenReturn(raw2);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));
        assertNotNull(response);
        assertEquals(2, response.getQuestions().size());
        assertEquals("Q1", response.getQuestions().get(0).getContent());
        assertEquals("Q2", response.getQuestions().get(1).getContent());
    }

    @Test
    void testNewRetry_RetryReturnsDuplicates_SystemKeepsPrevious_Continues() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}" +
                "]}";
        String raw2 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}" +
                "]}";
        String raw3 = "{\"questions\":[" +
                "{\"content\":\"Q2\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A2\",\"isCorrect\":true},{\"content\":\"B2\",\"isCorrect\":false}]}" +
                "]}";
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(9), anyString(), anyString(), anyList()))
                .thenReturn(raw2, raw3);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));
        assertNotNull(response);
        assertEquals(2, response.getQuestions().size());
        assertEquals("Q1", response.getQuestions().get(0).getContent());
        assertEquals("Q2", response.getQuestions().get(1).getContent());
        verify(aiCoreService, times(4)).generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString(), anyList());
    }

    @Test
    void testNewRetry_Attempt1_5Accepted_Attempt2_DuplicateOnly_Attempt3_5New_Final10() {
        String raw1 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q2\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A2\",\"isCorrect\":true},{\"content\":\"B2\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q3\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A3\",\"isCorrect\":true},{\"content\":\"B3\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q4\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A4\",\"isCorrect\":true},{\"content\":\"B4\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q5\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A5\",\"isCorrect\":true},{\"content\":\"B5\",\"isCorrect\":false}]}" +
                "]}";
        String raw2 = "{\"questions\":[" +
                "{\"content\":\"Q1\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A1\",\"isCorrect\":true},{\"content\":\"B1\",\"isCorrect\":false}]}" +
                "]}";
        String raw3 = "{\"questions\":[" +
                "{\"content\":\"Q6\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A6\",\"isCorrect\":true},{\"content\":\"B6\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q7\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A7\",\"isCorrect\":true},{\"content\":\"B7\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q8\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A8\",\"isCorrect\":true},{\"content\":\"B8\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q9\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A9\",\"isCorrect\":true},{\"content\":\"B9\",\"isCorrect\":false}]}," +
                "{\"content\":\"Q10\",\"category\":\"Vocabulary\",\"answers\":[{\"content\":\"A10\",\"isCorrect\":true},{\"content\":\"B10\",\"isCorrect\":false}]}" +
                "]}";

        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(10), anyString(), anyString(), anyList()))
                .thenReturn(raw1);
        when(aiCoreService.generateQuestions(anyString(), anyString(), eq(5), anyString(), anyString(), anyList()))
                .thenReturn(raw2, raw3);

        AiExamParseResponse response = aiLearningContentService.generateQuestions(
                "Test Material", "Some content", 10, "MEDIUM", Arrays.asList("Vocabulary"));
        assertNotNull(response);
        assertEquals(10, response.getQuestions().size());
        assertEquals(10, response.getGeneratedCount());
        verify(aiCoreService, times(3)).generateQuestions(anyString(), anyString(), anyInt(), anyString(), anyString(), anyList());
    }

    @Test
    void testNewRetry_FingerprintDifferentiatesByFormatMetadata() {
        com.midori.ai.dto.AiExamParseResponse.AiQuestionDto q1 = new com.midori.ai.dto.AiExamParseResponse.AiQuestionDto();
        q1.setType("TRANSLATION");
        q1.setContent("Translate this");
        com.midori.ai.dto.AiExamParseResponse.TranslationMetadataDto m1 = new com.midori.ai.dto.AiExamParseResponse.TranslationMetadataDto();
        m1.setSourceText("Text A");
        q1.setTranslationMetadata(m1);

        com.midori.ai.dto.AiExamParseResponse.AiQuestionDto q2 = new com.midori.ai.dto.AiExamParseResponse.AiQuestionDto();
        q2.setType("TRANSLATION");
        q2.setContent("Translate this");
        com.midori.ai.dto.AiExamParseResponse.TranslationMetadataDto m2 = new com.midori.ai.dto.AiExamParseResponse.TranslationMetadataDto();
        m2.setSourceText("Text B");
        q2.setTranslationMetadata(m2);

        com.midori.ai.dto.AiExamParseResponse.AiQuestionDto q3 = new com.midori.ai.dto.AiExamParseResponse.AiQuestionDto();
        q3.setType("SENTENCE_WRITING");
        q3.setContent("Write a sentence");
        com.midori.ai.dto.AiExamParseResponse.SentenceWritingMetadataDto m3 = new com.midori.ai.dto.AiExamParseResponse.SentenceWritingMetadataDto();
        m3.setPrompt("Prompt A");
        q3.setSentenceWritingMetadata(m3);

        com.midori.ai.dto.AiExamParseResponse.AiQuestionDto q4 = new com.midori.ai.dto.AiExamParseResponse.AiQuestionDto();
        q4.setType("SENTENCE_WRITING");
        q4.setContent("Write a sentence");
        com.midori.ai.dto.AiExamParseResponse.SentenceWritingMetadataDto m4 = new com.midori.ai.dto.AiExamParseResponse.SentenceWritingMetadataDto();
        m4.setPrompt("Prompt B");
        q4.setSentenceWritingMetadata(m4);

        String fp1 = AiLearningContentService.fingerprint(q1);
        String fp2 = AiLearningContentService.fingerprint(q2);
        String fp3 = AiLearningContentService.fingerprint(q3);
        String fp4 = AiLearningContentService.fingerprint(q4);

        assertNotEquals(fp1, fp2);
        assertNotEquals(fp3, fp4);
    }

    @Test
    void testNewRetry_FillBlankAndTrueFalseReachRequestedCount() {
        String fillBlankRaw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Q1 ___\", \"type\": \"FILL_BLANK\", \"difficulty\": \"medium\", \"answers\": [{\"content\": \"A1\", \"isCorrect\": true}]},\n" +
                "    {\"content\": \"Q2 ___\", \"type\": \"FILL_BLANK\", \"difficulty\": \"medium\", \"answers\": [{\"content\": \"A2\", \"isCorrect\": true}]},\n" +
                "    {\"content\": \"Q3 ___\", \"type\": \"FILL_BLANK\", \"difficulty\": \"medium\", \"answers\": [{\"content\": \"A3\", \"isCorrect\": true}]}\n" +
                "  ]\n" +
                "}";
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(3), eq("FILL_BLANK"), anyString(), anyList()))
                .thenReturn(fillBlankRaw);

        AiExamParseResponse fillResponse = aiLearningContentService.generateQuestionsWithDistribution(
                "Test Material", "Some content", 3, "FILL_BLANK", 0, 100, 0, Arrays.asList("Vocabulary"), null);
        assertNotNull(fillResponse);
        assertEquals(3, fillResponse.getQuestions().size());

        String trueFalseRaw = "{\n" +
                "  \"questions\": [\n" +
                "    {\"content\": \"Tokyo is capital\", \"type\": \"TRUE_FALSE\", \"difficulty\": \"medium\", \"answers\": [{\"content\": \"True\", \"isCorrect\": true}, {\"content\": \"False\", \"isCorrect\": false}]},\n" +
                "    {\"content\": \"Osaka is capital\", \"type\": \"TRUE_FALSE\", \"difficulty\": \"medium\", \"answers\": [{\"content\": \"True\", \"isCorrect\": false}, {\"content\": \"False\", \"isCorrect\": true}]}\n" +
                "  ]\n" +
                "}";
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(2), eq("TRUE_FALSE"), anyString(), anyList()))
                .thenReturn(trueFalseRaw);

        AiExamParseResponse tfResponse = aiLearningContentService.generateQuestionsWithDistribution(
                "Test Material", "Some content", 2, "TRUE_FALSE", 0, 100, 0, Arrays.asList("Vocabulary"), null);
        assertNotNull(tfResponse);
        assertEquals(2, tfResponse.getQuestions().size());
    }
}