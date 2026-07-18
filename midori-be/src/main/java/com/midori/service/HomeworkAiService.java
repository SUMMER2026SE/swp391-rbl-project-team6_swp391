package com.midori.service;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.dto.homeworkdto.AiHomeworkGenerateRequest;
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
public class HomeworkAiService {

    private final QuestionBankLessonRepository questionBankLessonRepository;
    private final AiLearningContentService aiLearningContentService;

    /**
     * Generate a question preview from lesson content using AI.
     * Fetches lesson metadata, delegates content building to AiLearningContentService,
     * then sanitizes and returns the preview.
     *
     * @param request the generation request with level, lesson, skills, difficulty, count
     * @return AiExamParseResponse containing sanitized questions ready for preview
     */
    @Transactional(readOnly = true)
    public AiExamParseResponse generateHomeworkQuestions(AiHomeworkGenerateRequest request) {
        log.info("[HomeworkAi] Generating {} questions for lesson {} at level {} with skills {}",
                request.getQuestionCount(), request.getLessonId(), request.getLevel(), request.getSkills());

        QuestionBankLesson lesson = questionBankLessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "QuestionBankLesson", "id", request.getLessonId()));

        if (!lesson.getLevel().equalsIgnoreCase(request.getLevel())) {
            log.warn("[HomeworkAi] Lesson level {} does not match request level {}",
                    lesson.getLevel(), request.getLevel());
        }

        String materialTitle = lesson.getLessonName() + " (Lesson " + lesson.getLessonNumber() + ")";

        String learningContent = aiLearningContentService.buildLearningContent(
                request.getLevel(),
                lesson.getLessonNumber(),
                request.getSkills()
        );

        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[HomeworkAi] No content found for lesson {} at level {}",
                    request.getLessonId(), request.getLevel());
            return AiExamParseResponse.empty();
        }

        log.info("[HomeworkAi] Built content of {} chars from lesson", learningContent.length());

        return aiLearningContentService.generateQuestions(
                materialTitle,
                learningContent,
                request.getQuestionCount(),
                request.getDifficulty(),
                request.getSkills()
        );
    }
}
