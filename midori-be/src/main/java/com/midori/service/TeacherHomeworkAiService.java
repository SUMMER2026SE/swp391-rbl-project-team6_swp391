package com.midori.service;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.dto.request.AiExamGenerateRequest;
import com.midori.entity.QuestionBankLesson;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.QuestionBankLessonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Teacher-specific AI homework generation.
 * Delegates to the shared AiLearningContentService for content building and question generation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherHomeworkAiService {

    private final QuestionBankLessonRepository questionBankLessonRepository;
    private final AiLearningContentService aiLearningContentService;

    /**
     * Generate a question preview from lesson content using AI for homework.
     * Fetches lesson metadata, delegates content building to AiLearningContentService,
     * then sanitizes and returns the preview.
     *
     * @param request the generation request with level, lesson, skills, difficulty, count,
     *                and optionally writingMode / questionFormat
     * @return AiExamParseResponse containing sanitized questions ready for preview
     */
    @Transactional(readOnly = true)
    public AiExamParseResponse generateHomeworkQuestions(AiExamGenerateRequest request) {
        log.info("[TeacherHomeworkAi] Generating {} questions for lesson {} at level {} with skills {}",
                request.getQuestionCount(), request.getLessonId(), request.getLevel(), request.getSkills());

        QuestionBankLesson lesson = questionBankLessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "QuestionBankLesson", "id", request.getLessonId()));

        if (!lesson.getLevel().equalsIgnoreCase(request.getLevel())) {
            log.warn("[TeacherHomeworkAi] Lesson level {} does not match request level {}",
                    lesson.getLevel(), request.getLevel());
        }

        String materialTitle = lesson.getLessonName() + " (Lesson " + lesson.getLessonNumber() + ")";

        String learningContent = aiLearningContentService.buildLearningContent(
                request.getLevel(),
                lesson.getLessonNumber(),
                request.getSkills()
        );

        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[TeacherHomeworkAi] No content found for lesson {} at level {}",
                    request.getLessonId(), request.getLevel());
            return AiExamParseResponse.empty();
        }

        log.info("[TeacherHomeworkAi] Built content of {} chars from lesson", learningContent.length());

        // When WRITING is the only skill, use the writing flow with the specified mode;
        // otherwise use the standard flow with the specified question format
        // (falls back to MULTIPLE_CHOICE if null for backward compatibility).
        boolean isWritingOnly = request.getSkills().size() == 1
                && request.getSkills().stream()
                        .anyMatch(s -> "WRITING".equalsIgnoreCase(s));

        if (isWritingOnly) {
            return aiLearningContentService.generateQuestions(
                    materialTitle,
                    learningContent,
                    request.getQuestionCount(),
                    request.getDifficulty(),
                    request.getSkills(),
                    null,     // sourcePassage
                    request.getWritingMode()
            );
        } else {
            String questionFormat = request.getQuestionFormat();
            return aiLearningContentService.generateQuestions(
                    materialTitle,
                    learningContent,
                    request.getQuestionCount(),
                    request.getDifficulty(),
                    request.getSkills(),
                    null,     // sourcePassage
                    questionFormat
            );
        }
    }
}
