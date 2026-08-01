package com.midori.service;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.dto.request.AiExamGenerateRequest;
import com.midori.entity.QuestionBankLesson;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.QuestionBankLessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for TeacherExamAiService:
 * - writingMode is passed to the writing flow when WRITING is the only skill
 * - questionFormat is passed when non-WRITING skills are selected
 * - MULTIPLE_CHOICE is used as default when questionFormat is null (non-writing)
 */
@ExtendWith(MockitoExtension.class)
class TeacherExamAiServiceTest {

    @Mock
    private QuestionBankLessonRepository questionBankLessonRepository;

    @Mock
    private AiLearningContentService aiLearningContentService;

    private TeacherExamAiService service;

    private QuestionBankLesson sampleLesson() {
        QuestionBankLesson lesson = new QuestionBankLesson();
        lesson.setId(1);
        lesson.setLevel("N5");
        lesson.setLessonNumber(1);
        lesson.setLessonName("Greetings");
        return lesson;
    }

    private static final String SAMPLE_CONTENT = "Chapter 1: Greetings\nHello = こんにちは (Konnichiwa)";

    @BeforeEach
    void setUp() {
        service = new TeacherExamAiService(questionBankLessonRepository, aiLearningContentService);
    }

    private AiExamGenerateRequest buildRequest(List<String> skills, String writingMode, String questionFormat) {
        AiExamGenerateRequest req = new AiExamGenerateRequest();
        req.setLevel("N5");
        req.setLessonId(1);
        req.setSkills(skills);
        req.setDifficulty("MEDIUM");
        req.setQuestionCount(10);
        if (writingMode != null) req.setWritingMode(writingMode);
        if (questionFormat != null) req.setQuestionFormat(questionFormat);
        return req;
    }

    @Nested
    @DisplayName("WRITING skill — writingMode routing")
    class WritingSkillRouting {

        @BeforeEach
        void stubLesson() {
            when(questionBankLessonRepository.findById(1)).thenReturn(java.util.Optional.of(sampleLesson()));
            when(aiLearningContentService.buildLearningContent(eq("N5"), eq(1), eq(List.of("WRITING"))))
                    .thenReturn(SAMPLE_CONTENT);
        }

        @Test
        @DisplayName("WRITING-only with null writingMode defaults to MIXED_WRITING in service call")
        void writingOnly_nullWritingMode_passesToService() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), isNull()))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("WRITING"), null, null));

            // verify: the writingMode parameter (8th arg) is null → service defaults to MIXED_WRITING internally
            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), isNull());
        }

        @Test
        @DisplayName("WRITING-only with JA_TO_VI_TRANSLATION writesMode is forwarded")
        void writingOnly_jaToVi_writesModeForwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("JA_TO_VI_TRANSLATION")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("WRITING"), "JA_TO_VI_TRANSLATION", null));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), eq("JA_TO_VI_TRANSLATION"));
        }

        @Test
        @DisplayName("WRITING-only with VI_TO_JA_TRANSLATION writesMode is forwarded")
        void writingOnly_viToJa_writesModeForwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("VI_TO_JA_TRANSLATION")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("WRITING"), "VI_TO_JA_TRANSLATION", null));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), eq("VI_TO_JA_TRANSLATION"));
        }

        @Test
        @DisplayName("WRITING-only with SENTENCE_REORDER writesMode is forwarded")
        void writingOnly_sentenceReorder_writesModeForwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("SENTENCE_REORDER")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("WRITING"), "SENTENCE_REORDER", null));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), eq("SENTENCE_REORDER"));
        }

        @Test
        @DisplayName("WRITING-only ignores questionFormat (it is not applied to writing flow)")
        void writingOnly_questionFormatIgnored() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), anyString()))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("WRITING"), "MIXED_WRITING", "TRUE_FALSE"));

            // questionFormat "TRUE_FALSE" should NOT be passed (writing flow ignores it)
            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), eq("MIXED_WRITING"));
        }
    }

    @Nested
    @DisplayName("Non-WRITING skills — questionFormat routing")
    class NonWritingSkillsRouting {

        @BeforeEach
        void stubLesson() {
            when(questionBankLessonRepository.findById(1)).thenReturn(java.util.Optional.of(sampleLesson()));
            when(aiLearningContentService.buildLearningContent(anyString(), anyInt(), anyList()))
                    .thenReturn(SAMPLE_CONTENT);
        }

        @Test
        @DisplayName("VOCABULARY with null questionFormat defaults to MULTIPLE_CHOICE")
        void vocab_nullQuestionFormat_defaultsToMultipleChoice() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), isNull()))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("VOCABULARY"), null, null));

            // null → service normalizes to MULTIPLE_CHOICE internally
            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("VOCABULARY")), isNull(), isNull());
        }

        @Test
        @DisplayName("GRAMMAR with TRUE_FALSE questionFormat is forwarded")
        void grammar_trueFalse_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("TRUE_FALSE")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("GRAMMAR"), null, "TRUE_FALSE"));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("GRAMMAR")), isNull(), eq("TRUE_FALSE"));
        }

        @Test
        @DisplayName("GRAMMAR with FILL_BLANK questionFormat is forwarded")
        void grammar_fillBlank_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("FILL_BLANK")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("GRAMMAR"), null, "FILL_BLANK"));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("GRAMMAR")), isNull(), eq("FILL_BLANK"));
        }

        @Test
        @DisplayName("READING with SHORT_ANSWER questionFormat is forwarded")
        void reading_shortAnswer_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("SHORT_ANSWER")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("READING"), null, "SHORT_ANSWER"));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("READING")), isNull(), eq("SHORT_ANSWER"));
        }

        @Test
        @DisplayName("Multiple non-WRITING skills — WRITING is NOT forwarded to questionFormat path")
        void multipleNonWriting_writesModeNotForwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("MULTIPLE_CHOICE")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateExamQuestions(buildRequest(List.of("VOCABULARY", "GRAMMAR"), null, "MULTIPLE_CHOICE"));

            // writingMode should NOT be set (not a WRITING-only request)
            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(10), eq("MEDIUM"),
                    eq(List.of("VOCABULARY", "GRAMMAR")), isNull(), eq("MULTIPLE_CHOICE"));
        }
    }

    @Nested
    @DisplayName("Error handling")
    class ErrorHandling {

        @Test
        @DisplayName("Throws ResourceNotFoundException when lesson not found")
        void lessonNotFound_throws() {
            when(questionBankLessonRepository.findById(1)).thenReturn(java.util.Optional.empty());

            AiExamGenerateRequest req = buildRequest(List.of("VOCABULARY"), null, null);

            assertThrows(ResourceNotFoundException.class, () -> service.generateExamQuestions(req));
        }

        @Test
        @DisplayName("Returns empty response when buildLearningContent returns blank")
        void emptyContent_returnsEmpty() {
            when(questionBankLessonRepository.findById(1)).thenReturn(java.util.Optional.of(sampleLesson()));
            when(aiLearningContentService.buildLearningContent(anyString(), anyInt(), anyList())).thenReturn("  ");

            AiExamParseResponse result = service.generateExamQuestions(buildRequest(List.of("VOCABULARY"), null, null));

            assertTrue(result.getQuestions().isEmpty());
            verify(aiLearningContentService, never()).generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), any(), any());
        }
    }
}
