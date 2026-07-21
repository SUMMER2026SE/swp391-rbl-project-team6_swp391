package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.controller.AiPdfPreviewController;
import com.midori.dto.response.AiPdfPreviewResponse;
import com.midori.repository.*;
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

    @BeforeEach
    void setUp() {
        aiLearningContentService = new AiLearningContentService(
                vocabularyLessonRepository,
                grammarLessonRepository,
                readingLessonRepository,
                listeningLessonRepository,
                vocabularyItemRepository,
                grammarContentRepository,
                grammarExampleRepository,
                aiCoreService,
                objectMapper
        );

        aiPdfPreviewController = new AiPdfPreviewController(pdfTextExtractor, aiCoreService, aiLearningContentService);
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
        // Should NOT have error message since we generated 6 valid questions (non-fatal warning is controller concern)
        assertNull(response.getErrorMessage());
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
}