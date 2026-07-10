package com.midori.service.impl;

import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningLessonRequest;
import com.midori.dto.listening.ListeningLessonResponse;
import com.midori.dto.listening.ListeningLessonWithQuestionsRequest;
import com.midori.dto.listening.ListeningQuestionRequest;
import com.midori.dto.listening.ListeningQuestionResponse;
import com.midori.entity.Difficulty;
import com.midori.entity.ListeningLesson;
import com.midori.entity.ListeningQuestion;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.ListeningQuestionRepository;
import com.midori.service.ListeningLessonService;
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
public class ListeningLessonServiceImpl implements ListeningLessonService {

    private final ListeningLessonRepository listeningLessonRepository;
    private final ListeningQuestionRepository listeningQuestionRepository;

    @Override
    public ListeningLessonResponse createListeningLesson(ListeningLessonRequest request) {
        log.info("Creating listening lesson: {} for level {}", request.getTitle(), request.getJlptLevel());

        if (listeningLessonRepository.existsByLessonNumberAndJlptLevel(
                request.getLessonNumber(), request.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Listening lesson with number %d already exists for level %s",
                            request.getLessonNumber(), request.getJlptLevel()));
        }

        ListeningLesson lesson = ListeningLesson.builder()
                .jlptLevel(trimToNull(request.getJlptLevel()))
                .lessonNumber(request.getLessonNumber())
                .title(trimToNull(request.getTitle()))
                .description(trimToNull(request.getDescription()))
                .audioUrl(trimToNull(request.getAudioUrl()))
                .transcript(trimToNull(request.getTranscript()))
                .estimatedMinutes(request.getEstimatedMinutes())
                .difficulty(parseDifficulty(request.getDifficulty()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        lesson = listeningLessonRepository.save(lesson);
        log.info("Created listening lesson with id: {}", lesson.getId());

        return toResponse(lesson);
    }

    @Override
    public ListeningDetailResponse createListeningLessonWithQuestions(ListeningLessonWithQuestionsRequest request) {
        log.info("Creating listening lesson with questions: {}", request.getLesson().getTitle());

        ListeningLessonRequest lessonRequest = request.getLesson();

        if (listeningLessonRepository.existsByLessonNumberAndJlptLevel(
                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Listening lesson with number %d already exists for level %s",
                            lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
        }

        ListeningLesson lesson = ListeningLesson.builder()
                .jlptLevel(trimToNull(lessonRequest.getJlptLevel()))
                .lessonNumber(lessonRequest.getLessonNumber())
                .title(trimToNull(lessonRequest.getTitle()))
                .description(trimToNull(lessonRequest.getDescription()))
                .audioUrl(trimToNull(lessonRequest.getAudioUrl()))
                .transcript(trimToNull(lessonRequest.getTranscript()))
                .estimatedMinutes(lessonRequest.getEstimatedMinutes())
                .difficulty(parseDifficulty(lessonRequest.getDifficulty()))
                .isActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true)
                .build();

        lesson = listeningLessonRepository.save(lesson);
        log.info("Created listening lesson with id: {}", lesson.getId());

        List<ListeningQuestionResponse> questionResponses = new ArrayList<>();

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            for (ListeningQuestionRequest qReq : request.getQuestions()) {
                if (listeningQuestionRepository.existsByListeningLessonIdAndQuestionOrder(lesson.getId(), qReq.getQuestionOrder())) {
                    throw new BadRequestException(
                            String.format("Question with order %d already exists for this listening lesson",
                                    qReq.getQuestionOrder()));
                }

                ListeningQuestion question = ListeningQuestion.builder()
                        .listeningLesson(lesson)
                        .questionOrder(qReq.getQuestionOrder())
                        .questionType(qReq.getQuestionType())
                        .question(trimToNull(qReq.getQuestion()))
                        .optionA(trimToNull(qReq.getOptionA()))
                        .optionB(trimToNull(qReq.getOptionB()))
                        .optionC(trimToNull(qReq.getOptionC()))
                        .optionD(trimToNull(qReq.getOptionD()))
                        .correctAnswer(qReq.getCorrectAnswer().toUpperCase().trim())
                        .explanation(trimToNull(qReq.getExplanation()))
                        .audioUrl(trimToNull(qReq.getAudioUrl()))
                        .build();

                question = listeningQuestionRepository.save(question);
                questionResponses.add(toQuestionResponse(question));
            }
            log.info("Created {} questions for listening lesson: {}", questionResponses.size(), lesson.getId());
        }

        return toDetailResponse(lesson, questionResponses);
    }

    @Override
    public ListeningDetailResponse updateListeningLessonWithQuestions(UUID lessonId, ListeningLessonWithQuestionsRequest request) {
        log.info("Updating listening lesson with questions: {}", lessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));

        ListeningLessonRequest lessonRequest = request.getLesson();

        if (!lesson.getJlptLevel().equals(lessonRequest.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(lessonRequest.getLessonNumber())) {
            if (listeningLessonRepository.existsByLessonNumberAndJlptLevel(
                    lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Listening lesson with number %d already exists for level %s",
                                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
            }
        }

        lesson.setJlptLevel(trimToNull(lessonRequest.getJlptLevel()));
        lesson.setLessonNumber(lessonRequest.getLessonNumber());
        lesson.setTitle(trimToNull(lessonRequest.getTitle()));
        lesson.setDescription(trimToNull(lessonRequest.getDescription()));
        lesson.setAudioUrl(trimToNull(lessonRequest.getAudioUrl()));
        lesson.setTranscript(trimToNull(lessonRequest.getTranscript()));
        lesson.setEstimatedMinutes(lessonRequest.getEstimatedMinutes());
        lesson.setDifficulty(parseDifficulty(lessonRequest.getDifficulty()));
        lesson.setIsActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true);

        lesson = listeningLessonRepository.save(lesson);

        listeningQuestionRepository.deleteByListeningLessonId(lessonId);

        List<ListeningQuestionResponse> questionResponses = new ArrayList<>();

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            for (ListeningQuestionRequest qReq : request.getQuestions()) {
                ListeningQuestion question = ListeningQuestion.builder()
                        .listeningLesson(lesson)
                        .questionOrder(qReq.getQuestionOrder())
                        .questionType(qReq.getQuestionType())
                        .question(trimToNull(qReq.getQuestion()))
                        .optionA(trimToNull(qReq.getOptionA()))
                        .optionB(trimToNull(qReq.getOptionB()))
                        .optionC(trimToNull(qReq.getOptionC()))
                        .optionD(trimToNull(qReq.getOptionD()))
                        .correctAnswer(qReq.getCorrectAnswer().toUpperCase().trim())
                        .explanation(trimToNull(qReq.getExplanation()))
                        .audioUrl(trimToNull(qReq.getAudioUrl()))
                        .build();

                question = listeningQuestionRepository.save(question);
                questionResponses.add(toQuestionResponse(question));
            }
            log.info("Updated {} questions for listening lesson: {}", questionResponses.size(), lessonId);
        }

        log.info("Updated listening lesson: {}", lessonId);
        return toDetailResponse(lesson, questionResponses);
    }

    @Override
    public ListeningDetailResponse updateListeningLesson(UUID lessonId, ListeningLessonRequest request) {
        log.info("Updating listening lesson: {}", lessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));

        if (!lesson.getJlptLevel().equals(request.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(request.getLessonNumber())) {
            if (listeningLessonRepository.existsByLessonNumberAndJlptLevel(
                    request.getLessonNumber(), request.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Listening lesson with number %d already exists for level %s",
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
        if (request.getAudioUrl() != null) {
            lesson.setAudioUrl(trimToNull(request.getAudioUrl()));
        }
        if (request.getTranscript() != null) {
            lesson.setTranscript(trimToNull(request.getTranscript()));
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

        lesson = listeningLessonRepository.save(lesson);
        log.info("Updated listening lesson: {}", lessonId);

        List<ListeningQuestionResponse> questions = listeningQuestionRepository
                .findByListeningLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, questions);
    }

    @Override
    public void deleteListeningLesson(UUID lessonId) {
        log.info("Deleting listening lesson: {}", lessonId);

        if (!listeningLessonRepository.existsById(lessonId)) {
            throw new ResourceNotFoundException("ListeningLesson", "id", lessonId);
        }

        listeningLessonRepository.deleteById(lessonId);
        log.info("Deleted listening lesson: {}", lessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public ListeningLessonResponse getListeningLesson(UUID lessonId) {
        log.debug("Fetching listening lesson: {}", lessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));

        return toResponse(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public ListeningDetailResponse getListeningLessonDetail(UUID lessonId) {
        log.debug("Fetching listening lesson detail: {}", lessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));

        List<ListeningQuestionResponse> questions = listeningQuestionRepository
                .findByListeningLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, questions);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getAllListeningLessons() {
        log.debug("Fetching all listening lessons");

        return listeningLessonRepository.findAllByOrderByLessonNumberAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getListeningLessonsByLevel(String jlptLevel) {
        log.debug("Fetching listening lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return listeningLessonRepository.findAllByJlptLevelOrdered(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getActiveListeningLessons() {
        log.debug("Fetching active listening lessons");

        return listeningLessonRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getActiveListeningLessonsByLevel(String jlptLevel) {
        log.debug("Fetching active listening lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return listeningLessonRepository.findByJlptLevelAndIsActiveTrue(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ListeningLessonResponse publishLesson(UUID lessonId) {
        log.info("Publishing listening lesson: {}", lessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));

        lesson.setIsActive(true);
        lesson = listeningLessonRepository.save(lesson);
        log.info("Published listening lesson: {}", lessonId);

        return toResponse(lesson);
    }

    @Override
    public ListeningLessonResponse unpublishLesson(UUID lessonId) {
        log.info("Unpublishing listening lesson: {}", lessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));

        lesson.setIsActive(false);
        lesson = listeningLessonRepository.save(lesson);
        log.info("Unpublished listening lesson: {}", lessonId);

        return toResponse(lesson);
    }

    private ListeningLessonResponse toResponse(ListeningLesson lesson) {
        return ListeningLessonResponse.builder()
                .id(lesson.getId())
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .audioUrl(lesson.getAudioUrl())
                .transcript(lesson.getTranscript())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private ListeningDetailResponse toDetailResponse(ListeningLesson lesson, List<ListeningQuestionResponse> questions) {
        return ListeningDetailResponse.builder()
                .id(lesson.getId())
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .audioUrl(lesson.getAudioUrl())
                .transcript(lesson.getTranscript())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .questions(questions)
                .build();
    }

    private ListeningQuestionResponse toQuestionResponse(ListeningQuestion question) {
        return ListeningQuestionResponse.builder()
                .id(question.getId())
                .listeningLessonId(question.getListeningLesson().getId())
                .questionOrder(question.getQuestionOrder())
                .questionType(question.getQuestionType() != null ? question.getQuestionType().name() : null)
                .question(question.getQuestion())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .correctAnswer(question.getCorrectAnswer())
                .explanation(question.getExplanation())
                .audioUrl(question.getAudioUrl())
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
