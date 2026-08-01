package com.midori.service;

import com.midori.service.AiLearningContentService;
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
 * Teacher-specific AI exam generation.
 * Delegates to the shared AiLearningContentService for content building and question generation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherExamAiService {

    private final QuestionBankLessonRepository questionBankLessonRepository;
    private final AiLearningContentService aiLearningContentService;

    /**
     * Generate a question preview from lesson content using AI.
     * Fetches lesson metadata, delegates content building to AiLearningContentService,
     * then sanitizes and returns the preview.
     *
     * @param request the generation request with level, lesson, skills, difficulty, count,
     *                and optionally writingMode / questionFormat
     * @return AiExamParseResponse containing sanitized questions ready for preview
     */
    @Transactional(readOnly = true)
    public AiExamParseResponse generateExamQuestions(AiExamGenerateRequest request) {
        log.info("[TeacherExamAi] Generating {} questions for lesson {} at level {} with skills {}",
                request.getQuestionCount(), request.getLessonId(), request.getLevel(), request.getSkills());

        // 1. Fetch the lesson metadata
        QuestionBankLesson lesson = questionBankLessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "QuestionBankLesson", "id", request.getLessonId()));

        if (!lesson.getLevel().equalsIgnoreCase(request.getLevel())) {
            log.warn("[TeacherExamAi] Lesson level {} does not match request level {}",
                    lesson.getLevel(), request.getLevel());
        }

        String materialTitle = lesson.getLessonName() + " (Lesson " + lesson.getLessonNumber() + ")";

        // 2. Build learning content using the shared service
        String learningContent = aiLearningContentService.buildLearningContent(
                request.getLevel(),
                lesson.getLessonNumber(),
                request.getSkills()
        );

        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[TeacherExamAi] No content found for lesson {} at level {}",
                    request.getLessonId(), request.getLevel());
            return AiExamParseResponse.empty();
        }

        log.info("[TeacherExamAi] Built content of {} chars from lesson", learningContent.length());

        // 3. Delegate AI generation and sanitization to the shared service.
        //    When WRITING is the only skill, pass writingMode; otherwise pass questionFormat.
        boolean isWritingOnly = request.getSkills().size() == 1
                && request.getSkills().stream()
                        .anyMatch(s -> "WRITING".equalsIgnoreCase(s));

        if (isWritingOnly) {
            // Use the writing flow with the specified mode (defaults to MIXED_WRITING if null)
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
            // Use the standard flow with the specified question format.
            // Falls back to MULTIPLE_CHOICE if questionFormat is null (backward-compatible default).
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
