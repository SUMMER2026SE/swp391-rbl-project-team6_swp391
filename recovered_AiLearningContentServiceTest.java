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
}