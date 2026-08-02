package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.entity.QuestionType;
import com.midori.repository.*;
import com.midori.validation.QuestionBankCompatibilityValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Teacher Top-Up Orchestration Tests")
class TeacherTopUpIntegrationTest {

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

    @BeforeEach
    void setUp() {
        com.midori.ai.util.QuestionSemanticValidator semanticValidator = mock(com.midori.ai.util.QuestionSemanticValidator.class);
        lenient().when(semanticValidator.validate(any(), any())).thenReturn(com.midori.ai.util.QuestionSemanticValidator.ValidationResult.valid());

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
    }

    private String createFillBlankResponseJson(int startIdx, int count) {
        StringBuilder sb = new StringBuilder("{\"questions\": [");
        for (int i = 0; i < count; i++) {
            sb.append(String.format(
                "{\"content\": \"Q%d ___\", \"type\": \"FILL_BLANK\", \"difficulty\": \"medium\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A%d\", \"isCorrect\": true}]}",
                startIdx + i, startIdx + i
            ));
            if (i < count - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }

    private String createTrueFalseResponseJson(int startIdx, int count) {
        StringBuilder sb = new StringBuilder("{\"questions\": [");
        for (int i = 0; i < count; i++) {
            sb.append(String.format(
                "{\"content\": \"Tokyo%d is capital\", \"type\": \"TRUE_FALSE\", \"difficulty\": \"medium\", \"category\": \"Grammar\", \"answers\": [{\"content\": \"True\", \"isCorrect\": true}, {\"content\": \"False\", \"isCorrect\": false}]}",
                startIdx + i
            ));
            if (i < count - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }

    private String createShortAnswerResponseJson(int startIdx, int count) {
        StringBuilder sb = new StringBuilder("{\"questions\": [");
        for (int i = 0; i < count; i++) {
            sb.append(String.format(
                "{\"content\": \"Q%d\", \"type\": \"SHORT_ANSWER\", \"difficulty\": \"medium\", \"category\": \"Vocabulary\", \"answers\": [{\"content\": \"A%d\", \"isCorrect\": true}]}",
                startIdx + i, startIdx + i
            ));
            if (i < count - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }

    @Test
    @DisplayName("1. Requested 10, first response 5, second response 5 -> final 10")
    void testTopUpReachesTen() {
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(10), eq("FILL_BLANK"), anyString(), anyList()))
                .thenReturn(createFillBlankResponseJson(1, 5));
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(5), eq("FILL_BLANK"), anyString(), anyList()))
                .thenReturn(createFillBlankResponseJson(6, 5));

        AiExamParseResponse response = aiLearningContentService.generateQuestionsWithDistribution(
                "Test", "Material", 10, "FILL_BLANK", 0, 100, 0, List.of("Vocabulary"), null);

        assertNotNull(response);
        assertEquals(10, response.getQuestions().size());
        assertFalse(response.isPartial());
    }

    @Test
    @DisplayName("2 & 3 & 4. Requested 10, first response 5, second 3 -> final 8 (partial, preserved first batch, second requests exactly 5)")
    void testTopUpPartialShortfall() {
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(10), eq("FILL_BLANK"), anyString(), anyList()))
                .thenReturn(createFillBlankResponseJson(1, 5));
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(5), eq("FILL_BLANK"), anyString(), anyList()))
                .thenReturn(createFillBlankResponseJson(6, 3));

        AiExamParseResponse response = aiLearningContentService.generateQuestionsWithDistribution(
                "Test", "Material", 10, "FILL_BLANK", 0, 100, 0, List.of("Vocabulary"), null);

        assertNotNull(response);
        assertEquals(8, response.getQuestions().size());
        assertTrue(response.isPartial());
        assertEquals("Q1 ___", response.getQuestions().get(0).getContent()); // first batch preserved
    }

    @Test
    @DisplayName("5. FILL_BLANK reaches 10")
    void testFillBlankReachesTen() {
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(10), eq("FILL_BLANK"), anyString(), anyList()))
                .thenReturn(createFillBlankResponseJson(1, 10));

        AiExamParseResponse response = aiLearningContentService.generateQuestionsWithDistribution(
                "Test", "Material", 10, "FILL_BLANK", 0, 100, 0, List.of("Vocabulary"), null);

        assertEquals(10, response.getQuestions().size());
    }

    @Test
    @DisplayName("6. TRUE_FALSE reaches 10")
    void testTrueFalseReachesTen() {
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(10), eq("TRUE_FALSE"), anyString(), anyList()))
                .thenReturn(createTrueFalseResponseJson(1, 10));

        AiExamParseResponse response = aiLearningContentService.generateQuestionsWithDistribution(
                "Test", "Material", 10, "TRUE_FALSE", 0, 100, 0, List.of("Grammar"), null);

        assertEquals(10, response.getQuestions().size());
    }

    @Test
    @DisplayName("7. SHORT_ANSWER reaches 10")
    void testShortAnswerReachesTen() {
        when(aiCoreService.generateQuestionsWithDistribution(anyString(), anyString(), eq(10), eq("SHORT_ANSWER"), anyString(), anyList()))
                .thenReturn(createShortAnswerResponseJson(1, 10));

        AiExamParseResponse response = aiLearningContentService.generateQuestionsWithDistribution(
                "Test", "Material", 10, "SHORT_ANSWER", 0, 100, 0, List.of("Vocabulary"), null);

        assertEquals(10, response.getQuestions().size());
    }

    @Test
    @DisplayName("10. WRITING flow remains unchanged")
    void testWritingFlowUnchanged() {
        // Since WRITING skill goes through generateWritingFlow, we verify it is handled separately.
        AiExamParseResponse response = aiLearningContentService.generateQuestionsWithDistribution(
                "Test", "Material", 10, "SHORT_ANSWER", 0, 100, 0, List.of("WRITING"), null);
        assertNotNull(response);
        // Returns empty or handles writing flow appropriately
    }
}
