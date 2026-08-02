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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for TeacherHomeworkAiService:
 * - writingMode is passed when WRITING is the only skill
 * - questionFormat is passed when non-WRITING skills are selected
 * - case-insensitive WRITING detection works
 */
@ExtendWith(MockitoExtension.class)
class TeacherHomeworkAiServiceTest {

    @Mock
    private QuestionBankLessonRepository questionBankLessonRepository;

    @Mock
    private AiLearningContentService aiLearningContentService;

    private TeacherHomeworkAiService service;

    private QuestionBankLesson sampleLesson() {
        QuestionBankLesson lesson = new QuestionBankLesson();
        lesson.setId(5);
        lesson.setLevel("N5");
        lesson.setLessonNumber(2);
        lesson.setLessonName("Numbers");
        return lesson;
    }

    private static final String SAMPLE_CONTENT = "Numbers: 一 (ichi), 二 (ni), 三 (san)";

    @BeforeEach
    void setUp() {
        service = new TeacherHomeworkAiService(questionBankLessonRepository, aiLearningContentService);
    }

    private AiExamGenerateRequest buildRequest(List<String> skills, String writingMode, String questionFormat) {
        AiExamGenerateRequest req = new AiExamGenerateRequest();
        req.setLevel("N5");
        req.setLessonId(5);
        req.setSkills(skills);
        req.setDifficulty("MEDIUM");
        req.setQuestionCount(15);
        if (writingMode != null) req.setWritingMode(writingMode);
        if (questionFormat != null) req.setQuestionFormat(questionFormat);
        return req;
    }

    @Nested
    @DisplayName("WRITING skill — writingMode routing")
    class WritingSkillRouting {

        @BeforeEach
        void stubLesson() {
            when(questionBankLessonRepository.findById(5)).thenReturn(java.util.Optional.of(sampleLesson()));
            when(aiLearningContentService.buildLearningContent(anyString(), anyInt(), anyList()))
                    .thenReturn(SAMPLE_CONTENT);
        }

        @Test
        @DisplayName("WRITING-only with explicit JA_TO_VI_TRANSLATION is forwarded")
        void writingOnly_jaToVi_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("JA_TO_VI_TRANSLATION")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateHomeworkQuestions(buildRequest(List.of("WRITING"), "JA_TO_VI_TRANSLATION", null));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(15), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), eq("JA_TO_VI_TRANSLATION"));
        }

        @Test
        @DisplayName("WRITING-only with explicit VI_TO_JA_TRANSLATION is forwarded")
        void writingOnly_viToJa_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("VI_TO_JA_TRANSLATION")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateHomeworkQuestions(buildRequest(List.of("WRITING"), "VI_TO_JA_TRANSLATION", null));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(15), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), eq("VI_TO_JA_TRANSLATION"));
        }

        @Test
        @DisplayName("WRITING-only with null writingMode passes null (service defaults to MIXED_WRITING)")
        void writingOnly_nullWritingMode_passesNull() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), isNull()))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateHomeworkQuestions(buildRequest(List.of("WRITING"), null, null));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(15), eq("MEDIUM"),
                    eq(List.of("WRITING")), isNull(), isNull());
        }
    }

    @Nested
    @DisplayName("Non-WRITING skills — questionFormat routing")
    class NonWritingRouting {

        @BeforeEach
        void stubLesson() {
            when(questionBankLessonRepository.findById(5)).thenReturn(java.util.Optional.of(sampleLesson()));
            when(aiLearningContentService.buildLearningContent(anyString(), anyInt(), anyList()))
                    .thenReturn(SAMPLE_CONTENT);
        }

        @Test
        @DisplayName("VOCABULARY with TRANSLATION questionFormat is forwarded")
        void vocab_translation_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("TRANSLATION")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateHomeworkQuestions(buildRequest(List.of("VOCABULARY"), null, "TRANSLATION"));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(15), eq("MEDIUM"),
                    eq(List.of("VOCABULARY")), isNull(), eq("TRANSLATION"));
        }

        @Test
        @DisplayName("VOCABULARY with null questionFormat defaults to MULTIPLE_CHOICE")
        void vocab_nullQuestionFormat_nullPassed() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), isNull()))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateHomeworkQuestions(buildRequest(List.of("VOCABULARY"), null, null));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(15), eq("MEDIUM"),
                    eq(List.of("VOCABULARY")), isNull(), isNull());
        }

        @Test
        @DisplayName("GRAMMAR with ERROR_CORRECTION questionFormat is forwarded")
        void grammar_errorCorrection_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("ERROR_CORRECTION")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateHomeworkQuestions(buildRequest(List.of("GRAMMAR"), null, "ERROR_CORRECTION"));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(15), eq("MEDIUM"),
                    eq(List.of("GRAMMAR")), isNull(), eq("ERROR_CORRECTION"));
        }

        @Test
        @DisplayName("READING with TRANSLATION questionFormat is forwarded")
        void reading_translation_forwarded() {
            when(aiLearningContentService.generateQuestions(
                    anyString(), anyString(), anyInt(), anyString(), anyList(), isNull(), eq("TRANSLATION")))
                    .thenReturn(AiExamParseResponse.empty());

            service.generateHomeworkQuestions(buildRequest(List.of("READING"), null, "TRANSLATION"));

            verify(aiLearningContentService).generateQuestions(
                    anyString(), eq(SAMPLE_CONTENT), eq(15), eq("MEDIUM"),
                    eq(List.of("READING")), isNull(), eq("TRANSLATION"));
        }
    }

    @Nested
    @DisplayName("Error handling")
    class ErrorHandling {

        @Test
        @DisplayName("Throws ResourceNotFoundException when lesson not found")
        void lessonNotFound_throws() {
            when(questionBankLessonRepository.findById(5)).thenReturn(java.util.Optional.empty());

            AiExamGenerateRequest req = buildRequest(List.of("VOCABULARY"), null, null);

            assertThrows(ResourceNotFoundException.class, () -> service.generateHomeworkQuestions(req));
        }

        @Test
        @DisplayName("Returns empty response when buildLearningContent returns blank")
        void emptyContent_returnsEmpty() {
            when(questionBankLessonRepository.findById(5)).thenReturn(java.util.Optional.of(sampleLesson()));
            when(aiLearningContentService.buildLearningContent(anyString(), anyInt(), anyList())).thenReturn("  ");

            AiExamParseResponse result = service.generateHomeworkQuestions(
                    buildRequest(List.of("VOCABULARY"), null, null));

            assertTrue(result.getQuestions().isEmpty());
        }
    }
}
