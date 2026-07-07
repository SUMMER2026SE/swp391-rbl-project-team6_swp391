package com.midori.service.impl;

import com.midori.dto.reading.ReadingDetailResponse;
import com.midori.dto.reading.ReadingLessonRequest;
import com.midori.dto.reading.ReadingLessonResponse;
import com.midori.dto.reading.ReadingLessonWithQuestionsRequest;
import com.midori.dto.reading.ReadingQuestionRequest;
import com.midori.dto.reading.ReadingQuestionResponse;
import com.midori.entity.Difficulty;
import com.midori.entity.ReadingLesson;
import com.midori.entity.ReadingQuestion;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ReadingLessonRepository;
import com.midori.repository.ReadingQuestionRepository;
import com.midori.service.ReadingLessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReadingLessonServiceImpl implements ReadingLessonService {

    private final ReadingLessonRepository readingLessonRepository;
    private final ReadingQuestionRepository readingQuestionRepository;

    @Override
    public ReadingLessonResponse createReadingLesson(ReadingLessonRequest request) {
        log.info("Creating reading lesson: {} for level {}", request.getTitle(), request.getJlptLevel());

        if (readingLessonRepository.existsByLessonNumberAndJlptLevel(
                request.getLessonNumber(), request.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Reading lesson with number %d already exists for level %s",
                            request.getLessonNumber(), request.getJlptLevel()));
        }

        ReadingLesson lesson = ReadingLesson.builder()
                .jlptLevel(trimToNull(request.getJlptLevel()))
                .lessonNumber(request.getLessonNumber())
                .title(trimToNull(request.getTitle()))
                .description(trimToNull(request.getDescription()))
                .passage(trimToNull(request.getPassage()))
                .vietnameseTranslation(trimToNull(request.getVietnameseTranslation()))
                .estimatedMinutes(request.getEstimatedMinutes())
                .difficulty(parseDifficulty(request.getDifficulty()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        lesson = readingLessonRepository.save(lesson);
        log.info("Created reading lesson with id: {}", lesson.getId());

        return toResponse(lesson);
    }

    @Override
    public ReadingDetailResponse createReadingLessonWithQuestions(ReadingLessonWithQuestionsRequest request) {
        log.info("Creating reading lesson with questions: {}", request.getLesson().getTitle());

        ReadingLessonRequest lessonRequest = request.getLesson();

        if (readingLessonRepository.existsByLessonNumberAndJlptLevel(
                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Reading lesson with number %d already exists for level %s",
                            lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
        }

        ReadingLesson lesson = ReadingLesson.builder()
                .jlptLevel(trimToNull(lessonRequest.getJlptLevel()))
                .lessonNumber(lessonRequest.getLessonNumber())
                .title(trimToNull(lessonRequest.getTitle()))
                .description(trimToNull(lessonRequest.getDescription()))
                .passage(trimToNull(lessonRequest.getPassage()))
                .vietnameseTranslation(trimToNull(lessonRequest.getVietnameseTranslation()))
                .estimatedMinutes(lessonRequest.getEstimatedMinutes())
                .difficulty(parseDifficulty(lessonRequest.getDifficulty()))
                .isActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true)
                .build();

        lesson = readingLessonRepository.save(lesson);
        log.info("Created reading lesson with id: {}", lesson.getId());

        List<ReadingQuestionResponse> questionResponses = new ArrayList<>();

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            for (ReadingQuestionRequest qReq : request.getQuestions()) {
                if (readingQuestionRepository.existsByReadingLessonIdAndQuestionOrder(lesson.getId(), qReq.getQuestionOrder())) {
                    throw new BadRequestException(
                            String.format("Question with order %d already exists for this reading lesson",
                                    qReq.getQuestionOrder()));
                }

                ReadingQuestion question = ReadingQuestion.builder()
                        .readingLesson(lesson)
                        .questionOrder(qReq.getQuestionOrder())
                        .question(trimToNull(qReq.getQuestion()))
                        .optionA(trimToNull(qReq.getOptionA()))
                        .optionB(trimToNull(qReq.getOptionB()))
                        .optionC(trimToNull(qReq.getOptionC()))
                        .optionD(trimToNull(qReq.getOptionD()))
                        .correctAnswer(qReq.getCorrectAnswer().toUpperCase().trim())
                        .explanation(trimToNull(qReq.getExplanation()))
                        .build();

                question = readingQuestionRepository.save(question);
                questionResponses.add(toQuestionResponse(question));
            }
            log.info("Created {} questions for reading lesson: {}", questionResponses.size(), lesson.getId());
        }

        return toDetailResponse(lesson, questionResponses);
    }

    @Override
    public ReadingDetailResponse updateReadingLessonWithQuestions(UUID lessonId, ReadingLessonWithQuestionsRequest request) {
        log.info("Updating reading lesson with questions: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        ReadingLessonRequest lessonRequest = request.getLesson();

        if (!lesson.getJlptLevel().equals(lessonRequest.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(lessonRequest.getLessonNumber())) {
            if (readingLessonRepository.existsByLessonNumberAndJlptLevel(
                    lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Reading lesson with number %d already exists for level %s",
                                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
            }
        }

        lesson.setJlptLevel(trimToNull(lessonRequest.getJlptLevel()));
        lesson.setLessonNumber(lessonRequest.getLessonNumber());
        lesson.setTitle(trimToNull(lessonRequest.getTitle()));
        lesson.setDescription(trimToNull(lessonRequest.getDescription()));
        lesson.setPassage(trimToNull(lessonRequest.getPassage()));
        lesson.setVietnameseTranslation(trimToNull(lessonRequest.getVietnameseTranslation()));
        lesson.setEstimatedMinutes(lessonRequest.getEstimatedMinutes());
        lesson.setDifficulty(parseDifficulty(lessonRequest.getDifficulty()));
        lesson.setIsActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true);

        lesson = readingLessonRepository.save(lesson);

        readingQuestionRepository.deleteByReadingLessonId(lessonId);

        List<ReadingQuestionResponse> questionResponses = new ArrayList<>();

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            for (ReadingQuestionRequest qReq : request.getQuestions()) {
                ReadingQuestion question = ReadingQuestion.builder()
                        .readingLesson(lesson)
                        .questionOrder(qReq.getQuestionOrder())
                        .question(trimToNull(qReq.getQuestion()))
                        .optionA(trimToNull(qReq.getOptionA()))
                        .optionB(trimToNull(qReq.getOptionB()))
                        .optionC(trimToNull(qReq.getOptionC()))
                        .optionD(trimToNull(qReq.getOptionD()))
                        .correctAnswer(qReq.getCorrectAnswer().toUpperCase().trim())
                        .explanation(trimToNull(qReq.getExplanation()))
                        .build();

                question = readingQuestionRepository.save(question);
                questionResponses.add(toQuestionResponse(question));
            }
            log.info("Updated {} questions for reading lesson: {}", questionResponses.size(), lessonId);
        }

        log.info("Updated reading lesson: {}", lessonId);
        return toDetailResponse(lesson, questionResponses);
    }

    @Override
    public ReadingDetailResponse updateReadingLesson(UUID lessonId, ReadingLessonRequest request) {
        log.info("Updating reading lesson: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        if (!lesson.getJlptLevel().equals(request.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(request.getLessonNumber())) {
            if (readingLessonRepository.existsByLessonNumberAndJlptLevel(
                    request.getLessonNumber(), request.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Reading lesson with number %d already exists for level %s",
                                request.getLessonNumber(), request.getJlptLevel()));
            }
        }

        if (request.getJlptLevel() != null) {
            lesson.setJlptLevel(trimToNull(request.getJlptLevel()));
        }
        if (request.getLessonNumber() != null) {
            lesson.setLessonNumber(request.getLessonNumber());
        }
        if (request.getTitle() != null) {
            lesson.setTitle(trimToNull(request.getTitle()));
        }
        if (request.getDescription() != null) {
            lesson.setDescription(trimToNull(request.getDescription()));
        }
        if (request.getPassage() != null) {
            lesson.setPassage(trimToNull(request.getPassage()));
        }
        if (request.getVietnameseTranslation() != null) {
            lesson.setVietnameseTranslation(trimToNull(request.getVietnameseTranslation()));
        }
        if (request.getEstimatedMinutes() != null) {
            lesson.setEstimatedMinutes(request.getEstimatedMinutes());
        }
        if (request.getDifficulty() != null) {
            lesson.setDifficulty(parseDifficulty(request.getDifficulty()));
        }
        if (request.getIsActive() != null) {
            lesson.setIsActive(request.getIsActive());
        }

        lesson = readingLessonRepository.save(lesson);
        log.info("Updated reading lesson: {}", lessonId);

        List<ReadingQuestionResponse> questions = readingQuestionRepository
                .findByReadingLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, questions);
    }

    @Override
    public void deleteReadingLesson(UUID lessonId) {
        log.info("Deleting reading lesson: {}", lessonId);

        if (!readingLessonRepository.existsById(lessonId)) {
            throw new ResourceNotFoundException("ReadingLesson", "id", lessonId);
        }

        readingLessonRepository.deleteById(lessonId);
        log.info("Deleted reading lesson: {}", lessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReadingLessonResponse getReadingLesson(UUID lessonId) {
        log.debug("Fetching reading lesson: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        return toResponse(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public ReadingDetailResponse getReadingLessonDetail(UUID lessonId) {
        log.debug("Fetching reading lesson detail: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        List<ReadingQuestionResponse> questions = readingQuestionRepository
                .findByReadingLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, questions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadingLessonResponse> getAllReadingLessons() {
        log.debug("Fetching all reading lessons");

        return readingLessonRepository.findAllByOrderByLessonNumberAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadingLessonResponse> getReadingLessonsByLevel(String jlptLevel) {
        log.debug("Fetching reading lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return readingLessonRepository.findAllByJlptLevelOrdered(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadingLessonResponse> getActiveReadingLessons() {
        log.debug("Fetching active reading lessons");

        return readingLessonRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadingLessonResponse> getActiveReadingLessonsByLevel(String jlptLevel) {
        log.debug("Fetching active reading lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return readingLessonRepository.findByJlptLevelAndIsActiveTrue(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReadingLessonResponse publishLesson(UUID lessonId) {
        log.info("Publishing reading lesson: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        lesson.setIsActive(true);
        lesson = readingLessonRepository.save(lesson);
        log.info("Published reading lesson: {}", lessonId);

        return toResponse(lesson);
    }

    @Override
    public ReadingLessonResponse unpublishLesson(UUID lessonId) {
        log.info("Unpublishing reading lesson: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        lesson.setIsActive(false);
        lesson = readingLessonRepository.save(lesson);
        log.info("Unpublished reading lesson: {}", lessonId);

        return toResponse(lesson);
    }

    private ReadingLessonResponse toResponse(ReadingLesson lesson) {
        return ReadingLessonResponse.builder()
                .id(lesson.getId())
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .passage(lesson.getPassage())
                .vietnameseTranslation(lesson.getVietnameseTranslation())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private ReadingDetailResponse toDetailResponse(ReadingLesson lesson, List<ReadingQuestionResponse> questions) {
        return ReadingDetailResponse.builder()
                .id(lesson.getId())
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .passage(lesson.getPassage())
                .vietnameseTranslation(lesson.getVietnameseTranslation())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .questions(questions)
                .build();
    }

    private ReadingQuestionResponse toQuestionResponse(ReadingQuestion question) {
        return ReadingQuestionResponse.builder()
                .id(question.getId())
                .readingLessonId(question.getReadingLesson().getId())
                .questionOrder(question.getQuestionOrder())
                .question(question.getQuestion())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .correctAnswer(question.getCorrectAnswer())
                .explanation(question.getExplanation())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }

    private Difficulty parseDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return null;
        }
        try {
            return Difficulty.valueOf(difficulty.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Difficulty must be EASY, MEDIUM, or HARD");
        }
    }

    private void validateLevel(String level) {
        if (level == null || level.isBlank()) {
            return;
        }
        try {
            String normalized = level.toUpperCase().trim();
            if (!normalized.matches("^N[1-5]$")) {
                throw new BadRequestException("Level must be N5, N4, N3, N2, or N1");
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Level must be N5, N4, N3, N2, or N1");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
