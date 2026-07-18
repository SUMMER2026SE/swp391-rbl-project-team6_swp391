package com.midori.service.impl;

import com.midori.dto.grammar.GrammarContentRequest;
import com.midori.dto.grammar.GrammarContentResponse;
import com.midori.dto.grammar.GrammarDetailResponse;
import com.midori.dto.grammar.GrammarExampleRequest;
import com.midori.dto.grammar.GrammarExampleResponse;
import com.midori.dto.grammar.GrammarLessonRequest;
import com.midori.dto.grammar.GrammarLessonResponse;
import com.midori.dto.grammar.GrammarLessonWithContentsRequest;
import com.midori.entity.Difficulty;
import com.midori.entity.GrammarContent;
import com.midori.entity.GrammarExample;
import com.midori.entity.GrammarLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.GrammarContentRepository;
import com.midori.repository.GrammarExampleRepository;
import com.midori.repository.GrammarLessonRepository;
import com.midori.service.GrammarLessonService;
import com.midori.service.LearningJourneyLessonService;
import com.midori.service.LessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GrammarLessonServiceImpl implements GrammarLessonService {

    private final GrammarLessonRepository grammarLessonRepository;
    private final GrammarContentRepository grammarContentRepository;
    private final GrammarExampleRepository grammarExampleRepository;
    private final LessonService lessonService;
    private final LearningJourneyLessonService learningJourneyLessonService;

    @Override
    public GrammarLessonResponse createGrammarLesson(GrammarLessonRequest request) {
        log.info("Creating grammar lesson: {} for level {}", request.getTitle(), request.getJlptLevel());

        if (grammarLessonRepository.existsByLessonNumberAndJlptLevel(
                request.getLessonNumber(), request.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Grammar lesson with number %d already exists for level %s",
                            request.getLessonNumber(), request.getJlptLevel()));
        }

        var lessonResponse = lessonService.getOrCreateLesson(
                request.getJlptLevel(),
                request.getLessonNumber(),
                request.getTitle(),
                request.getDescription()
        );

        GrammarLesson lesson = GrammarLesson.builder()
                .jlptLevel(trimToNull(request.getJlptLevel()))
                .lessonNumber(request.getLessonNumber())
                .title(trimToNull(request.getTitle()))
                .description(trimToNull(request.getDescription()))
                .estimatedMinutes(request.getEstimatedMinutes())
                .difficulty(parseDifficulty(request.getDifficulty()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
        lesson = grammarLessonRepository.save(lesson);
        log.info("Created grammar lesson with id: {}", lesson.getId());

        return toResponse(lesson);
    }

    @Override
    public GrammarDetailResponse createGrammarLessonWithContents(GrammarLessonWithContentsRequest request) {
        log.info("Creating grammar lesson with contents: {}", request.getLesson().getTitle());

        GrammarLessonRequest lessonRequest = request.getLesson();

        if (grammarLessonRepository.existsByLessonNumberAndJlptLevel(
                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Grammar lesson with number %d already exists for level %s",
                            lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
        }

        var lessonResponse = lessonService.getOrCreateLesson(
                lessonRequest.getJlptLevel(),
                lessonRequest.getLessonNumber(),
                lessonRequest.getTitle(),
                lessonRequest.getDescription()
        );

        GrammarLesson lesson = GrammarLesson.builder()
                .jlptLevel(trimToNull(lessonRequest.getJlptLevel()))
                .lessonNumber(lessonRequest.getLessonNumber())
                .title(trimToNull(lessonRequest.getTitle()))
                .description(trimToNull(lessonRequest.getDescription()))
                .estimatedMinutes(lessonRequest.getEstimatedMinutes())
                .difficulty(parseDifficulty(lessonRequest.getDifficulty()))
                .isActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true)
                .build();

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
        lesson = grammarLessonRepository.save(lesson);
        log.info("Created grammar lesson with id: {}", lesson.getId());

        List<GrammarContentResponse> contentResponses = new ArrayList<>();

        if (request.getContents() != null && !request.getContents().isEmpty()) {
            validateUniqueContentOrders(request.getContents());

            for (GrammarContentRequest cReq : request.getContents()) {
                if (grammarContentRepository.existsByGrammarLessonIdAndContentOrder(
                        lesson.getId(), cReq.getContentOrder())) {
                    throw new BadRequestException(
                            String.format("Content with order %d already exists for this grammar lesson",
                                    cReq.getContentOrder()));
                }

                GrammarContent content = GrammarContent.builder()
                        .grammarLesson(lesson)
                        .contentOrder(cReq.getContentOrder())
                        .pattern(trimToNull(cReq.getPattern()))
                        .meaning(trimToNull(cReq.getMeaning()))
                        .structure(trimToNull(cReq.getStructure()))
                        .usage(trimToNull(cReq.getUsage()))
                        .build();

                content = grammarContentRepository.save(content);

                List<GrammarExampleResponse> exampleResponses = createExamplesForContent(content, cReq.getExamples());
                contentResponses.add(toContentResponse(content, exampleResponses));
            }
            log.info("Created {} contents for grammar lesson: {}", contentResponses.size(), lesson.getId());
        }

        return toDetailResponse(lesson, contentResponses);
    }

    @Override
    public GrammarDetailResponse updateGrammarLessonWithContents(UUID lessonId, GrammarLessonWithContentsRequest request) {
        log.info("Updating grammar lesson with contents: {}", lessonId);

        // 1. Load lesson with contents
        GrammarLesson lesson = grammarLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", lessonId));

        GrammarLessonRequest lessonRequest = request.getLesson();

        // 2. Update lesson metadata
        if (!lesson.getJlptLevel().equals(lessonRequest.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(lessonRequest.getLessonNumber())) {
            if (grammarLessonRepository.existsByLessonNumberAndJlptLevel(
                    lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Grammar lesson with number %d already exists for level %s",
                                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
            }
        }

        lesson.setJlptLevel(trimToNull(lessonRequest.getJlptLevel()));
        lesson.setLessonNumber(lessonRequest.getLessonNumber());
        lesson.setTitle(trimToNull(lessonRequest.getTitle()));
        lesson.setDescription(trimToNull(lessonRequest.getDescription()));
        lesson.setEstimatedMinutes(lessonRequest.getEstimatedMinutes());
        lesson.setDifficulty(parseDifficulty(lessonRequest.getDifficulty()));
        lesson.setIsActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true);

        lesson = grammarLessonRepository.save(lesson);

        // 3. Sync contents
        List<GrammarContentResponse> contentResponses = syncGrammarContents(lesson, request.getContents());

        log.info("Updated grammar lesson: {}", lessonId);
        return toDetailResponse(lesson, contentResponses);
    }

    /**
     * Syncs grammar contents with the database:
     * - Updates existing contents (by id)
     * - Inserts new contents (no id)
     * - Deletes contents not in the request
     */
    private List<GrammarContentResponse> syncGrammarContents(GrammarLesson lesson, List<GrammarContentRequest> requestContents) {
        List<GrammarContentResponse> contentResponses = new ArrayList<>();

        // Get current contents from database
        List<GrammarContent> currentContents = grammarContentRepository
                .findByGrammarLessonIdOrderByContentOrderAsc(lesson.getId());

        Map<UUID, GrammarContent> currentContentsById = currentContents.stream()
                .collect(Collectors.toMap(GrammarContent::getId, c -> c));

        Set<UUID> receivedContentIds = new HashSet<>();

        if (requestContents != null && !requestContents.isEmpty()) {
            validateUniqueContentOrders(requestContents);

            for (int i = 0; i < requestContents.size(); i++) {
                GrammarContentRequest cReq = requestContents.get(i);
                UUID contentId = cReq.getId();

                if (contentId != null && currentContentsById.containsKey(contentId)) {
                    // Update existing content
                    GrammarContent existingContent = currentContentsById.get(contentId);
                    existingContent.setContentOrder(cReq.getContentOrder() != null ? cReq.getContentOrder() : (i + 1));
                    existingContent.setPattern(trimToNull(cReq.getPattern()));
                    existingContent.setMeaning(trimToNull(cReq.getMeaning()));
                    existingContent.setStructure(trimToNull(cReq.getStructure()));
                    existingContent.setUsage(trimToNull(cReq.getUsage()));

                    // IMPORTANT: Ensure lesson relationship is set
                    existingContent.setGrammarLesson(lesson);

                    grammarContentRepository.save(existingContent);

                    // Sync examples for this content
                    List<GrammarExampleResponse> exampleResponses = syncExamplesForContent(existingContent, cReq.getExamples());
                    contentResponses.add(toContentResponse(existingContent, exampleResponses));
                    receivedContentIds.add(contentId);

                    log.debug("Updated grammar content id={}", contentId);
                } else {
                    // Insert new content
                    GrammarContent newContent = GrammarContent.builder()
                            .grammarLesson(lesson) // Set lesson relationship
                            .contentOrder(cReq.getContentOrder() != null ? cReq.getContentOrder() : (i + 1))
                            .pattern(trimToNull(cReq.getPattern()))
                            .meaning(trimToNull(cReq.getMeaning()))
                            .structure(trimToNull(cReq.getStructure()))
                            .usage(trimToNull(cReq.getUsage()))
                            .build();

                    newContent = grammarContentRepository.save(newContent);
                    log.debug("Created new grammar content id={}", newContent.getId());

                    // Create examples for new content
                    List<GrammarExampleResponse> exampleResponses = createExamplesForContent(newContent, cReq.getExamples());
                    contentResponses.add(toContentResponse(newContent, exampleResponses));

                    if (newContent.getId() != null) {
                        receivedContentIds.add(newContent.getId());
                    }
                }
            }
        }

        // Delete contents not in the request
        List<GrammarContent> contentsToDelete = currentContents.stream()
                .filter(content -> !receivedContentIds.contains(content.getId()))
                .collect(Collectors.toList());

        if (!contentsToDelete.isEmpty()) {
            log.info("Deleting {} grammar contents: {}", contentsToDelete.size(),
                    contentsToDelete.stream().map(GrammarContent::getId).collect(Collectors.toList()));
            grammarContentRepository.deleteAll(contentsToDelete);
        }

        log.info("Synced {} grammar contents (received: {}, toDelete: {})",
                contentResponses.size(), receivedContentIds.size(), contentsToDelete.size());

        return contentResponses;
    }

    /**
     * Syncs examples for a grammar content:
     * - Updates existing examples (by id)
     * - Inserts new examples (no id)
     * - Deletes examples not in the request
     */
    private List<GrammarExampleResponse> syncExamplesForContent(GrammarContent content, List<GrammarExampleRequest> requestExamples) {
        List<GrammarExampleResponse> exampleResponses = new ArrayList<>();

        // Get current examples from database
        List<GrammarExample> currentExamples = grammarExampleRepository
                .findByGrammarContentIdOrderByExampleOrderAsc(content.getId());

        Map<UUID, GrammarExample> currentExamplesById = currentExamples.stream()
                .collect(Collectors.toMap(GrammarExample::getId, e -> e));

        Set<UUID> receivedExampleIds = new HashSet<>();

        if (requestExamples == null || requestExamples.isEmpty()) {
            // Delete all existing examples
            if (!currentExamples.isEmpty()) {
                log.info("Deleting all {} examples for content id={}", currentExamples.size(), content.getId());
                grammarExampleRepository.deleteAll(currentExamples);
            }
            return exampleResponses;
        }

        validateUniqueExampleOrders(requestExamples);

        for (int i = 0; i < requestExamples.size(); i++) {
            GrammarExampleRequest eReq = requestExamples.get(i);
            UUID exampleId = eReq.getId();

            if (exampleId != null && currentExamplesById.containsKey(exampleId)) {
                // Update existing example
                GrammarExample existingExample = currentExamplesById.get(exampleId);
                existingExample.setExampleOrder(eReq.getExampleOrder() != null ? eReq.getExampleOrder() : (i + 1));
                existingExample.setJapanese(trimToNull(eReq.getJapanese()));
                existingExample.setVietnameseMeaning(trimToNull(eReq.getVietnameseMeaning()));

                // IMPORTANT: Ensure content relationship is set
                existingExample.setGrammarContent(content);

                grammarExampleRepository.save(existingExample);
                exampleResponses.add(toExampleResponse(existingExample));
                receivedExampleIds.add(exampleId);

                log.debug("Updated grammar example id={}", exampleId);
            } else {
                // Insert new example
                GrammarExample newExample = GrammarExample.builder()
                        .grammarContent(content) // Set content relationship
                        .exampleOrder(eReq.getExampleOrder() != null ? eReq.getExampleOrder() : (i + 1))
                        .japanese(trimToNull(eReq.getJapanese()))
                        .vietnameseMeaning(trimToNull(eReq.getVietnameseMeaning()))
                        .build();

                newExample = grammarExampleRepository.save(newExample);
                exampleResponses.add(toExampleResponse(newExample));

                if (newExample.getId() != null) {
                    receivedExampleIds.add(newExample.getId());
                }
                log.debug("Created new grammar example id={} for content id={}", newExample.getId(), content.getId());
            }
        }

        // Delete examples not in the request
        List<GrammarExample> examplesToDelete = currentExamples.stream()
                .filter(example -> !receivedExampleIds.contains(example.getId()))
                .collect(Collectors.toList());

        if (!examplesToDelete.isEmpty()) {
            log.info("Deleting {} grammar examples: {}", examplesToDelete.size(),
                    examplesToDelete.stream().map(GrammarExample::getId).collect(Collectors.toList()));
            grammarExampleRepository.deleteAll(examplesToDelete);
        }

        return exampleResponses;
    }

    @Override
    public GrammarDetailResponse updateGrammarLesson(UUID lessonId, GrammarLessonRequest request) {
        log.info("Updating grammar lesson: {}", lessonId);

        GrammarLesson lesson = grammarLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", lessonId));

        if (!lesson.getJlptLevel().equals(request.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(request.getLessonNumber())) {
            if (grammarLessonRepository.existsByLessonNumberAndJlptLevel(
                    request.getLessonNumber(), request.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Grammar lesson with number %d already exists for level %s",
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
        if (request.getEstimatedMinutes() != null) {
            lesson.setEstimatedMinutes(request.getEstimatedMinutes());
        }
        if (request.getDifficulty() != null) {
            lesson.setDifficulty(parseDifficulty(request.getDifficulty()));
        }
        if (request.getIsActive() != null) {
            lesson.setIsActive(request.getIsActive());
        }

        lesson = grammarLessonRepository.save(lesson);
        log.info("Updated grammar lesson: {}", lessonId);

        List<GrammarContentResponse> contents = loadContentsForLesson(lessonId);
        return toDetailResponse(lesson, contents);
    }

    @Override
    public void deleteGrammarLesson(UUID lessonId) {
        log.info("Deleting grammar lesson: {}", lessonId);

        GrammarLesson lesson = grammarLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", lessonId));

        UUID sharedLessonId = lesson.getLesson() != null ? lesson.getLesson().getId() : null;

        grammarLessonRepository.delete(lesson);
        log.info("Deleted grammar lesson: {}", lessonId);

        learningJourneyLessonService.checkAndDeleteEmptyLesson(sharedLessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarLessonResponse getGrammarLesson(UUID lessonId) {
        log.debug("Fetching grammar lesson: {}", lessonId);

        GrammarLesson lesson = grammarLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", lessonId));

        return toResponse(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public GrammarDetailResponse getGrammarLessonDetail(UUID lessonId) {
        log.debug("Fetching grammar lesson detail: {}", lessonId);

        GrammarLesson lesson = grammarLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", lessonId));

        List<GrammarContentResponse> contents = loadContentsForLesson(lessonId);
        return toDetailResponse(lesson, contents);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarLessonResponse> getAllGrammarLessons() {
        log.debug("Fetching all grammar lessons");

        return grammarLessonRepository.findAllByOrderByLessonNumberAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarLessonResponse> getGrammarLessonsByLevel(String jlptLevel) {
        log.debug("Fetching grammar lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return grammarLessonRepository.findAllByJlptLevelOrdered(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarLessonResponse> getActiveGrammarLessons() {
        log.debug("Fetching active grammar lessons");

        return grammarLessonRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrammarLessonResponse> getActiveGrammarLessonsByLevel(String jlptLevel) {
        log.debug("Fetching active grammar lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return grammarLessonRepository.findByJlptLevelAndIsActiveTrue(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public GrammarLessonResponse publishLesson(UUID lessonId) {
        log.info("Publishing grammar lesson: {}", lessonId);

        GrammarLesson lesson = grammarLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", lessonId));

        lesson.setIsActive(true);
        lesson = grammarLessonRepository.save(lesson);
        log.info("Published grammar lesson: {}", lessonId);

        return toResponse(lesson);
    }

    @Override
    public GrammarLessonResponse unpublishLesson(UUID lessonId) {
        log.info("Unpublishing grammar lesson: {}", lessonId);

        GrammarLesson lesson = grammarLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("GrammarLesson", "id", lessonId));

        lesson.setIsActive(false);
        lesson = grammarLessonRepository.save(lesson);
        log.info("Unpublished grammar lesson: {}", lessonId);

        return toResponse(lesson);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private List<GrammarExampleResponse> createExamplesForContent(GrammarContent content,
                                                                 List<GrammarExampleRequest> exampleRequests) {
        List<GrammarExampleResponse> exampleResponses = new ArrayList<>();
        if (exampleRequests == null || exampleRequests.isEmpty()) {
            return exampleResponses;
        }

        validateUniqueExampleOrders(exampleRequests);

        for (GrammarExampleRequest eReq : exampleRequests) {
            if (grammarExampleRepository.existsByGrammarContentIdAndExampleOrder(
                    content.getId(), eReq.getExampleOrder())) {
                throw new BadRequestException(
                        String.format("Example with order %d already exists for this grammar content",
                                eReq.getExampleOrder()));
            }

            GrammarExample example = GrammarExample.builder()
                    .grammarContent(content)
                    .exampleOrder(eReq.getExampleOrder())
                    .japanese(trimToNull(eReq.getJapanese()))
                    .vietnameseMeaning(trimToNull(eReq.getVietnameseMeaning()))
                    .build();

            example = grammarExampleRepository.save(example);
            exampleResponses.add(toExampleResponse(example));
        }
        return exampleResponses;
    }

    private void validateUniqueContentOrders(List<GrammarContentRequest> requests) {
        Set<Integer> seen = new HashSet<>();
        for (GrammarContentRequest req : requests) {
            if (!seen.add(req.getContentOrder())) {
                throw new BadRequestException(
                        String.format("Duplicate content order %d in request", req.getContentOrder()));
            }
        }
    }

    private void validateUniqueExampleOrders(List<GrammarExampleRequest> requests) {
        Set<Integer> seen = new HashSet<>();
        for (GrammarExampleRequest req : requests) {
            if (!seen.add(req.getExampleOrder())) {
                throw new BadRequestException(
                        String.format("Duplicate example order %d in request", req.getExampleOrder()));
            }
        }
    }

    private List<GrammarContentResponse> loadContentsForLesson(UUID lessonId) {
        List<GrammarContent> contents = grammarContentRepository
                .findByGrammarLessonIdOrderByContentOrderAsc(lessonId);

        return contents.stream().map(content -> {
            List<GrammarExampleResponse> examples = grammarExampleRepository
                    .findByGrammarContentIdOrderByExampleOrderAsc(content.getId())
                    .stream()
                    .map(this::toExampleResponse)
                    .collect(Collectors.toList());
            return toContentResponse(content, examples);
        }).collect(Collectors.toList());
    }

    private GrammarLessonResponse toResponse(GrammarLesson lesson) {
        return GrammarLessonResponse.builder()
                .id(lesson.getId())
                .lessonId(lesson.getLesson() != null ? lesson.getLesson().getId() : null)
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private GrammarDetailResponse toDetailResponse(GrammarLesson lesson, List<GrammarContentResponse> contents) {
        return GrammarDetailResponse.builder()
                .id(lesson.getId())
                .lessonId(lesson.getLesson() != null ? lesson.getLesson().getId() : null)
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .contents(contents)
                .build();
    }

    private GrammarContentResponse toContentResponse(GrammarContent content, List<GrammarExampleResponse> examples) {
        return GrammarContentResponse.builder()
                .id(content.getId())
                .grammarLessonId(content.getGrammarLesson() != null ? content.getGrammarLesson().getId() : null)
                .contentOrder(content.getContentOrder())
                .pattern(content.getPattern())
                .meaning(content.getMeaning())
                .structure(content.getStructure())
                .usage(content.getUsage())
                .examples(examples)
                .createdAt(content.getCreatedAt())
                .updatedAt(content.getUpdatedAt())
                .build();
    }

    private GrammarExampleResponse toExampleResponse(GrammarExample example) {
        return GrammarExampleResponse.builder()
                .id(example.getId())
                .grammarContentId(example.getGrammarContent() != null ? example.getGrammarContent().getId() : null)
                .exampleOrder(example.getExampleOrder())
                .japanese(example.getJapanese())
                .vietnameseMeaning(example.getVietnameseMeaning())
                .createdAt(example.getCreatedAt())
                .updatedAt(example.getUpdatedAt())
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
