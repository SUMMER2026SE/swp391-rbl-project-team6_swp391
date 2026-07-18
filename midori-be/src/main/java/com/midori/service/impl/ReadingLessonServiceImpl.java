package com.midori.service.impl;

import com.midori.dto.reading.ReadingDetailResponse;
import com.midori.dto.reading.ReadingLessonRequest;
import com.midori.dto.reading.ReadingLessonResponse;
import com.midori.dto.reading.ReadingLessonWithQuestionsRequest;
import com.midori.dto.reading.ReadingPassageRequest;
import com.midori.dto.reading.ReadingPassageResponse;
import com.midori.dto.reading.ReadingQuestionRequest;
import com.midori.dto.reading.ReadingQuestionResponse;
import com.midori.dto.reading.ReadingSubmitRequest;
import com.midori.dto.reading.ReadingSubmitResponse;
import com.midori.entity.Difficulty;
import com.midori.entity.ReadingLesson;
import com.midori.entity.ReadingPassage;
import com.midori.entity.ReadingQuestion;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ReadingLessonRepository;
import com.midori.repository.ReadingPassageRepository;
import com.midori.repository.ReadingQuestionRepository;
import com.midori.service.LearningJourneyLessonService;
import com.midori.service.LessonService;
import com.midori.service.ReadingLessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReadingLessonServiceImpl implements ReadingLessonService {

    private final ReadingLessonRepository readingLessonRepository;
    private final ReadingPassageRepository readingPassageRepository;
    private final ReadingQuestionRepository readingQuestionRepository;
    private final LessonService lessonService;
    private final LearningJourneyLessonService learningJourneyLessonService;

    @Override
    public ReadingLessonResponse createReadingLesson(ReadingLessonRequest request) {
        log.info("Creating reading lesson: {} for level {}", request.getTitle(), request.getJlptLevel());

        if (readingLessonRepository.existsByLessonNumberAndJlptLevel(
                request.getLessonNumber(), request.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Reading lesson with number %d already exists for level %s",
                            request.getLessonNumber(), request.getJlptLevel()));
        }

        var lessonResponse = lessonService.getOrCreateLesson(
                request.getJlptLevel(),
                request.getLessonNumber(),
                request.getTitle(),
                request.getDescription()
        );

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

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
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

        var lessonResponse = lessonService.getOrCreateLesson(
                lessonRequest.getJlptLevel(),
                lessonRequest.getLessonNumber(),
                lessonRequest.getTitle(),
                lessonRequest.getDescription()
        );

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
                .passages(new ArrayList<>())
                .build();

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
        lesson = readingLessonRepository.save(lesson);
        log.info("Created reading lesson with id: {}", lesson.getId());

        List<ReadingPassageResponse> passageResponses = new ArrayList<>();
        List<ReadingQuestionResponse> questionResponses = new ArrayList<>();

        if (request.getPassages() != null && !request.getPassages().isEmpty()) {
            for (ReadingPassageRequest pReq : request.getPassages()) {
                // Create passage
                ReadingPassage passage = ReadingPassage.builder()
                        .readingLesson(lesson)
                        .passageOrder(pReq.getPassageOrder())
                        .passage(trimToNull(pReq.getPassage()))
                        .vietnameseTranslation(trimToNull(pReq.getVietnameseTranslation()))
                        .questions(new ArrayList<>())
                        .build();

                passage = readingPassageRepository.save(passage);
                log.info("Created passage with id: {}", passage.getId());

                List<ReadingQuestionResponse> passageQuestionResponses = new ArrayList<>();

                // Create questions for this passage
                if (pReq.getQuestions() != null && !pReq.getQuestions().isEmpty()) {
                    for (ReadingQuestionRequest qReq : pReq.getQuestions()) {
                        if (readingQuestionRepository.existsByReadingPassageIdAndQuestionOrder(passage.getId(), qReq.getQuestionOrder())) {
                            throw new BadRequestException(
                                    String.format("Question with order %d already exists for this passage",
                                            qReq.getQuestionOrder()));
                        }

                        ReadingQuestion question = ReadingQuestion.builder()
                                .readingLesson(lesson)
                                .readingPassage(passage)
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
                        passageQuestionResponses.add(toQuestionResponse(question));
                        questionResponses.add(toQuestionResponse(question));
                    }
                    log.info("Created {} questions for passage: {}", passageQuestionResponses.size(), passage.getId());
                }

                passageResponses.add(toPassageResponse(passage, passageQuestionResponses));
            }
        }

        return toDetailResponse(lesson, passageResponses, questionResponses);
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

        // Collect passage IDs from request
        List<UUID> requestPassageIds = request.getPassages() != null
                ? request.getPassages().stream()
                    .map(p -> {
                        if (p.getId() != null && !p.getId().startsWith("passage-") && !p.getId().startsWith("temp-")) {
                            return UUID.fromString(p.getId());
                        }
                        return null;
                    })
                    .filter(id -> id != null)
                    .collect(Collectors.toList())
                : new ArrayList<>();

        // Delete passages that are not in the request
        List<ReadingPassage> existingPassages = readingPassageRepository.findByReadingLessonIdOrderByPassageOrderAsc(lessonId);
        for (ReadingPassage existingPassage : existingPassages) {
            boolean stillExists = requestPassageIds.stream()
                    .anyMatch(id -> id.equals(existingPassage.getId()));
            if (!stillExists) {
                readingPassageRepository.delete(existingPassage);
                log.info("Deleted passage: {}", existingPassage.getId());
            }
        }

        List<ReadingPassageResponse> passageResponses = new ArrayList<>();
        List<ReadingQuestionResponse> questionResponses = new ArrayList<>();

        if (request.getPassages() != null && !request.getPassages().isEmpty()) {
            for (ReadingPassageRequest pReq : request.getPassages()) {
                ReadingPassage passage;

                // Determine if this is an existing passage or a new one
                boolean isExistingPassage = pReq.getId() != null
                        && !pReq.getId().startsWith("passage-")
                        && !pReq.getId().startsWith("temp-");

                if (isExistingPassage) {
                    UUID passageUuid = UUID.fromString(pReq.getId());
                    Optional<ReadingPassage> existingPassageOpt = readingPassageRepository.findById(passageUuid);
                    if (existingPassageOpt.isPresent()) {
                        passage = existingPassageOpt.get();
                        passage.setPassageOrder(pReq.getPassageOrder());
                        passage.setPassage(trimToNull(pReq.getPassage()));
                        passage.setVietnameseTranslation(trimToNull(pReq.getVietnameseTranslation()));
                        passage = readingPassageRepository.save(passage);
                        log.info("Updated existing passage: {}", passage.getId());
                    } else {
                        // ID doesn't exist, create new
                        passage = ReadingPassage.builder()
                                .readingLesson(lesson)
                                .passageOrder(pReq.getPassageOrder())
                                .passage(trimToNull(pReq.getPassage()))
                                .vietnameseTranslation(trimToNull(pReq.getVietnameseTranslation()))
                                .questions(new ArrayList<>())
                                .build();
                        passage = readingPassageRepository.save(passage);
                        log.info("Created new passage with provided id: {}", passage.getId());
                    }
                } else {
                    // New passage
                    passage = ReadingPassage.builder()
                            .readingLesson(lesson)
                            .passageOrder(pReq.getPassageOrder())
                            .passage(trimToNull(pReq.getPassage()))
                            .vietnameseTranslation(trimToNull(pReq.getVietnameseTranslation()))
                            .questions(new ArrayList<>())
                            .build();
                    passage = readingPassageRepository.save(passage);
                    log.info("Created new passage: {}", passage.getId());
                }

                // Collect question IDs from this passage
                List<UUID> requestQuestionIds = pReq.getQuestions() != null
                        ? pReq.getQuestions().stream()
                            .map(q -> {
                                if (q.getId() != null && !q.getId().startsWith("q-") && !q.getId().startsWith("temp-")) {
                                    try {
                                        return UUID.fromString(q.getId());
                                    } catch (Exception e) {
                                        return null;
                                    }
                                }
                                return null;
                            })
                            .filter(id -> id != null)
                            .collect(Collectors.toList())
                        : new ArrayList<>();

                // Delete questions that are not in this passage's request
                List<ReadingQuestion> existingQuestions = readingQuestionRepository.findByReadingPassageIdOrderByQuestionOrderAsc(passage.getId());
                for (ReadingQuestion existingQuestion : existingQuestions) {
                    boolean stillExists = requestQuestionIds.stream()
                            .anyMatch(id -> id.equals(existingQuestion.getId()));
                    if (!stillExists) {
                        readingQuestionRepository.delete(existingQuestion);
                        log.info("Deleted question: {}", existingQuestion.getId());
                    }
                }

                List<ReadingQuestionResponse> passageQuestionResponses = new ArrayList<>();

                // Process questions for this passage
                if (pReq.getQuestions() != null && !pReq.getQuestions().isEmpty()) {
                    for (ReadingQuestionRequest qReq : pReq.getQuestions()) {
                        ReadingQuestion question;

                        if (qReq.getId() != null && !qReq.getId().startsWith("q-") && !qReq.getId().startsWith("temp-")) {
                            // Try to find existing question
                            try {
                                UUID questionUuid = UUID.fromString(qReq.getId());
                                Optional<ReadingQuestion> existingQuestionOpt = readingQuestionRepository.findById(questionUuid);
                                if (existingQuestionOpt.isPresent()) {
                                    question = existingQuestionOpt.get();
                                    // Check if the new questionOrder would conflict with another question in the same passage
                                    if (!question.getQuestionOrder().equals(qReq.getQuestionOrder())) {
                                        if (readingQuestionRepository.existsByReadingPassageIdAndQuestionOrder(passage.getId(), qReq.getQuestionOrder())) {
                                            throw new BadRequestException(
                                                    String.format("Question with order %d already exists for this passage",
                                                            qReq.getQuestionOrder()));
                                        }
                                    }
                                    question.setQuestionOrder(qReq.getQuestionOrder());
                                    question.setQuestion(trimToNull(qReq.getQuestion()));
                                    question.setOptionA(trimToNull(qReq.getOptionA()));
                                    question.setOptionB(trimToNull(qReq.getOptionB()));
                                    question.setOptionC(trimToNull(qReq.getOptionC()));
                                    question.setOptionD(trimToNull(qReq.getOptionD()));
                                    question.setCorrectAnswer(qReq.getCorrectAnswer().toUpperCase().trim());
                                    question.setExplanation(trimToNull(qReq.getExplanation()));
                                    question.setReadingPassage(passage);
                                    question = readingQuestionRepository.save(question);
                                    log.info("Updated existing question: {}", question.getId());
                                } else {
                                    // ID doesn't exist, create new
                                    question = ReadingQuestion.builder()
                                            .readingLesson(lesson)
                                            .readingPassage(passage)
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
                                    log.info("Created new question with provided id: {}", question.getId());
                                }
                            } catch (Exception e) {
                                // Invalid UUID, create new
                                question = ReadingQuestion.builder()
                                        .readingLesson(lesson)
                                        .readingPassage(passage)
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
                                log.info("Created new question: {}", question.getId());
                            }
                        } else {
                            // New question
                            if (readingQuestionRepository.existsByReadingPassageIdAndQuestionOrder(passage.getId(), qReq.getQuestionOrder())) {
                                throw new BadRequestException(
                                        String.format("Question with order %d already exists for this passage",
                                                qReq.getQuestionOrder()));
                            }

                            question = ReadingQuestion.builder()
                                    .readingLesson(lesson)
                                    .readingPassage(passage)
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
                            log.info("Created new question: {}", question.getId());
                        }

                        ReadingQuestionResponse qResp = toQuestionResponse(question);
                        passageQuestionResponses.add(qResp);
                        questionResponses.add(qResp);
                    }
                }

                passageResponses.add(toPassageResponse(passage, passageQuestionResponses));
            }
        }

        log.info("Updated reading lesson: {}", lessonId);
        return toDetailResponse(lesson, passageResponses, questionResponses);
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

        List<ReadingPassageResponse> passages = readingPassageRepository
                .findByReadingLessonIdOrderByPassageOrderAsc(lessonId)
                .stream()
                .map(passage -> {
                    List<ReadingQuestionResponse> passageQuestions = readingQuestionRepository
                            .findByReadingPassageIdOrderByQuestionOrderAsc(passage.getId())
                            .stream()
                            .map(this::toQuestionResponse)
                            .collect(Collectors.toList());
                    return toPassageResponse(passage, passageQuestions);
                })
                .collect(Collectors.toList());

        List<ReadingQuestionResponse> questions = readingQuestionRepository
                .findByReadingLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, passages, questions);
    }

    @Override
    public void deleteReadingLesson(UUID lessonId) {
        log.info("Deleting reading lesson: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        UUID sharedLessonId = lesson.getLesson() != null ? lesson.getLesson().getId() : null;

        readingLessonRepository.delete(lesson);
        log.info("Deleted reading lesson: {}", lessonId);

        learningJourneyLessonService.checkAndDeleteEmptyLesson(sharedLessonId);
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

        List<ReadingPassageResponse> passages = readingPassageRepository
                .findByReadingLessonIdOrderByPassageOrderAsc(lessonId)
                .stream()
                .map(passage -> {
                    List<ReadingQuestionResponse> questions = readingQuestionRepository
                            .findByReadingPassageIdOrderByQuestionOrderAsc(passage.getId())
                            .stream()
                            .map(this::toQuestionResponse)
                            .collect(Collectors.toList());
                    return toPassageResponse(passage, questions);
                })
                .collect(Collectors.toList());

        List<ReadingQuestionResponse> questions = readingQuestionRepository
                .findByReadingLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, passages, questions);
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

    @Override
    @Transactional(readOnly = true)
    public ReadingSubmitResponse submitAnswers(UUID lessonId, ReadingSubmitRequest request) {
        log.info("Grading reading submission for lesson: {}", lessonId);

        ReadingLesson lesson = readingLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingLesson", "id", lessonId));

        // 1. Determine the question pool
        List<ReadingQuestion> pool = request.getPassageId() != null
                ? readingQuestionRepository.findByReadingPassageIdOrderByQuestionOrderAsc(request.getPassageId())
                : readingQuestionRepository.findByReadingLessonIdOrderByQuestionOrderAsc(lessonId);

        if (request.getPassageId() != null && pool.isEmpty()) {
            throw new ResourceNotFoundException("ReadingPassage", "id", request.getPassageId());
        }

        pool = pool.stream()
                .sorted(Comparator.comparing(ReadingQuestion::getQuestionOrder,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        // 2. Build a lookup from questionId -> selected letter for O(1) access
        Map<UUID, String> submittedAnswers = new HashMap<>();
        if (request.getAnswers() != null) {
            for (ReadingSubmitRequest.ReadingAnswerItem item : request.getAnswers()) {
                if (item != null && item.getQuestionId() != null && item.getSelectedAnswer() != null) {
                    submittedAnswers.put(item.getQuestionId(),
                            item.getSelectedAnswer().toUpperCase().trim());
                }
            }
        }

        // 3. Grade each question
        int correct = 0;
        int wrong = 0;
        List<ReadingSubmitResponse.ReadingAnswerResult> results = new ArrayList<>();

        for (ReadingQuestion question : pool) {
            String correctLetter = question.getCorrectAnswer() == null
                    ? null
                    : question.getCorrectAnswer().toUpperCase().trim();
            String userLetter = submittedAnswers.get(question.getId());
            boolean isCorrect = correctLetter != null
                    && userLetter != null
                    && correctLetter.equals(userLetter);

            if (isCorrect) correct += 1;
            else wrong += 1;

            results.add(ReadingSubmitResponse.ReadingAnswerResult.builder()
                    .questionId(question.getId())
                    .questionOrder(question.getQuestionOrder())
                    .question(question.getQuestion())
                    .optionA(question.getOptionA())
                    .optionB(question.getOptionB())
                    .optionC(question.getOptionC())
                    .optionD(question.getOptionD())
                    .userAnswer(userLetter)
                    .correctAnswer(correctLetter)
                    .userAnswerText(resolveOptionText(question, userLetter))
                    .correctAnswerText(resolveOptionText(question, correctLetter))
                    .isCorrect(isCorrect)
                    .explanation(question.getExplanation())
                    .build());
        }

        int total = pool.size();
        double percentage = total == 0 ? 0.0 : Math.round(((double) correct / total) * 1000.0) / 10.0;
        int legacyScore = (int) Math.floor(percentage);

        log.info("Graded reading submission for lesson {}: {}/{} correct ({}%)",
                lessonId, correct, total, percentage);

        return ReadingSubmitResponse.builder()
                .readingLessonId(lesson.getId())
                .passageId(request.getPassageId())
                .score(legacyScore)
                .totalQuestions(total)
                .correctAnswers(correct)
                .wrongAnswers(wrong)
                .percentage(percentage)
                .answers(results)
                .submittedAt(Instant.now())
                .build();
    }

    private String resolveOptionText(ReadingQuestion question, String letter) {
        if (letter == null) {
            return null;
        }
        switch (letter.toUpperCase().trim()) {
            case "A": return question.getOptionA();
            case "B": return question.getOptionB();
            case "C": return question.getOptionC();
            case "D": return question.getOptionD();
            default: return null;
        }
    }

    private ReadingLessonResponse toResponse(ReadingLesson lesson) {
        return ReadingLessonResponse.builder()
                .id(lesson.getId())
                .lessonId(lesson.getLesson() != null ? lesson.getLesson().getId() : null)
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

    private ReadingDetailResponse toDetailResponse(ReadingLesson lesson, List<ReadingPassageResponse> passages, List<ReadingQuestionResponse> questions) {
        return ReadingDetailResponse.builder()
                .id(lesson.getId())
                .lessonId(lesson.getLesson() != null ? lesson.getLesson().getId() : null)
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
                .passages(passages)
                .questions(questions)
                .build();
    }

    private ReadingPassageResponse toPassageResponse(ReadingPassage passage, List<ReadingQuestionResponse> questions) {
        // Extract title from first line of passage content
        String title = extractTitleFromPassage(passage.getPassage());

        return ReadingPassageResponse.builder()
                .id(passage.getId())
                .readingLessonId(passage.getReadingLesson().getId())
                .title(title)
                .passageOrder(passage.getPassageOrder())
                .passage(passage.getPassage())
                .vietnameseTranslation(passage.getVietnameseTranslation())
                .questions(questions)
                .createdAt(passage.getCreatedAt())
                .updatedAt(passage.getUpdatedAt())
                .build();
    }

    /**
     * Extracts the title from the first line of a passage.
     * If the passage starts with a line that looks like a title (short text followed by newline),
     * extract it. Otherwise, use the first line as the title.
     */
    private String extractTitleFromPassage(String passageContent) {
        if (passageContent == null || passageContent.isEmpty()) {
            return null;
        }

        int firstNewline = passageContent.indexOf('\n');
        if (firstNewline > 0) {
            String firstLine = passageContent.substring(0, firstNewline).trim();
            // If the first line is short (less than 100 chars), treat it as a title
            if (firstLine.length() <= 100) {
                return firstLine;
            }
        }
        // If no newline found or first line is too long, use the first 50 chars
        return passageContent.length() > 50
                ? passageContent.substring(0, 50).trim() + "..."
                : passageContent.trim();
    }

    private ReadingQuestionResponse toQuestionResponse(ReadingQuestion question) {
        return ReadingQuestionResponse.builder()
                .id(question.getId())
                .readingLessonId(question.getReadingLesson().getId())
                .readingPassageId(question.getReadingPassage() != null
                        ? question.getReadingPassage().getId()
                        : null)
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
