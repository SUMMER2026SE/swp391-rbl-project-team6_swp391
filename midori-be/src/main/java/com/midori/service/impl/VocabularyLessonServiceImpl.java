package com.midori.service.impl;

import com.midori.dto.vocabulary.VocabularyDetailResponse;
import com.midori.dto.vocabulary.VocabularyItemRequest;
import com.midori.dto.vocabulary.VocabularyItemResponse;
import com.midori.dto.vocabulary.VocabularyLessonRequest;
import com.midori.dto.vocabulary.VocabularyLessonResponse;
import com.midori.dto.vocabulary.VocabularyLessonWithItemsRequest;
import com.midori.entity.Difficulty;
import com.midori.entity.VocabularyItem;
import com.midori.entity.VocabularyLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.VocabularyItemRepository;
import com.midori.repository.VocabularyLessonRepository;
import com.midori.service.LearningJourneyLessonService;
import com.midori.service.LessonService;
import com.midori.service.VocabularyLessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
public class VocabularyLessonServiceImpl implements VocabularyLessonService {

    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final LessonService lessonService;
    private final LearningJourneyLessonService learningJourneyLessonService;

    @Override
    public VocabularyLessonResponse createVocabularyLesson(VocabularyLessonRequest request) {
        log.info("Creating vocabulary lesson: {} for level {}", request.getTitle(), request.getJlptLevel());

        if (vocabularyLessonRepository.existsByLessonNumberAndJlptLevel(
                request.getLessonNumber(), request.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Vocabulary lesson with number %d already exists for level %s",
                            request.getLessonNumber(), request.getJlptLevel()));
        }

        var lessonResponse = lessonService.getOrCreateLesson(
                request.getJlptLevel(),
                request.getLessonNumber(),
                request.getTitle(),
                request.getDescription()
        );

        VocabularyLesson lesson = VocabularyLesson.builder()
                .jlptLevel(trimToNull(request.getJlptLevel()))
                .lessonNumber(request.getLessonNumber())
                .title(trimToNull(request.getTitle()))
                .description(trimToNull(request.getDescription()))
                .estimatedMinutes(request.getEstimatedMinutes())
                .difficulty(parseDifficulty(request.getDifficulty()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
        lesson = vocabularyLessonRepository.save(lesson);
        log.info("Created vocabulary lesson with id: {}", lesson.getId());

        return toResponse(lesson);
    }

    @Override
    public VocabularyDetailResponse createVocabularyLessonWithItems(VocabularyLessonWithItemsRequest request) {
        log.info("Creating vocabulary lesson with items: {}", request.getLesson().getTitle());

        VocabularyLessonRequest lessonRequest = request.getLesson();

        if (vocabularyLessonRepository.existsByLessonNumberAndJlptLevel(
                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Vocabulary lesson with number %d already exists for level %s",
                            lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
        }

        var lessonResponse = lessonService.getOrCreateLesson(
                lessonRequest.getJlptLevel(),
                lessonRequest.getLessonNumber(),
                lessonRequest.getTitle(),
                lessonRequest.getDescription()
        );

        VocabularyLesson lesson = VocabularyLesson.builder()
                .jlptLevel(trimToNull(lessonRequest.getJlptLevel()))
                .lessonNumber(lessonRequest.getLessonNumber())
                .title(trimToNull(lessonRequest.getTitle()))
                .description(trimToNull(lessonRequest.getDescription()))
                .estimatedMinutes(lessonRequest.getEstimatedMinutes())
                .difficulty(parseDifficulty(lessonRequest.getDifficulty()))
                .isActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true)
                .build();

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
        lesson = vocabularyLessonRepository.save(lesson);
        log.info("Created vocabulary lesson with id: {}", lesson.getId());

        List<VocabularyItemResponse> itemResponses = new ArrayList<>();

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (int i = 0; i < request.getItems().size(); i++) {
                VocabularyItemRequest iReq = request.getItems().get(i);
                Integer itemOrder = iReq.getItemOrder() != null ? iReq.getItemOrder() : (i + 1);

                VocabularyItem item = VocabularyItem.builder()
                        .vocabularyLesson(lesson)
                        .itemOrder(itemOrder)
                        .japanese(trimToNull(iReq.getJapanese()))
                        .furigana(trimToNull(iReq.getFurigana()))
                        .romaji(trimToNull(iReq.getRomaji()))
                        .meaning(trimToNull(iReq.getMeaning()))
                        .exampleSentence(trimToNull(iReq.getExampleSentence()))
                        .exampleTranslation(trimToNull(iReq.getExampleTranslation()))
                        .partOfSpeech(trimToNull(iReq.getPartOfSpeech()))
                        .build();

                item = vocabularyItemRepository.save(item);
                itemResponses.add(toItemResponse(item));
            }
            log.info("Created {} items for vocabulary lesson: {}", itemResponses.size(), lesson.getId());
        }

        return toDetailResponse(lesson, itemResponses);
    }

    @Override
    public VocabularyDetailResponse updateVocabularyLesson(UUID lessonId, VocabularyLessonRequest request) {
        log.info("Updating vocabulary lesson: {}", lessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        if (!lesson.getJlptLevel().equals(request.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(request.getLessonNumber())) {
            if (vocabularyLessonRepository.existsByLessonNumberAndJlptLevel(
                    request.getLessonNumber(), request.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Vocabulary lesson with number %d already exists for level %s",
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

        lesson = vocabularyLessonRepository.save(lesson);
        log.info("Updated vocabulary lesson: {}", lessonId);

        List<VocabularyItemResponse> items = vocabularyItemRepository
                .findByVocabularyLessonIdOrderByItemOrderAsc(lessonId)
                .stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, items);
    }

    @Override
    public VocabularyDetailResponse updateVocabularyLessonWithItems(UUID lessonId, VocabularyLessonWithItemsRequest request) {
        log.info("Updating vocabulary lesson with items: {}", lessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        VocabularyLessonRequest lessonRequest = request.getLesson();

        if (!lesson.getJlptLevel().equals(lessonRequest.getJlptLevel()) ||
                !lesson.getLessonNumber().equals(lessonRequest.getLessonNumber())) {
            if (vocabularyLessonRepository.existsByLessonNumberAndJlptLevel(
                    lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
                throw new BadRequestException(
                        String.format("Vocabulary lesson with number %d already exists for level %s",
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

        vocabularyLessonRepository.save(lesson);

        // Sync items: update existing, insert new, delete removed
        List<VocabularyItemResponse> itemResponses = syncVocabularyItems(lesson, request.getItems());

        log.info("Updated vocabulary lesson: {}", lessonId);
        return toDetailResponse(lesson, itemResponses);
    }

    /**
     * Syncs vocabulary items with the database:
     * - Updates existing items (by id)
     * - Inserts new items (no id)
     * - Deletes items not in the request
     */
    private List<VocabularyItemResponse> syncVocabularyItems(VocabularyLesson lesson, List<VocabularyItemRequest> requestItems) {
        List<VocabularyItemResponse> itemResponses = new ArrayList<>();

        // Get current items from database
        List<VocabularyItem> currentItems = vocabularyItemRepository.findByVocabularyLessonIdOrderByItemOrderAsc(lesson.getId());
        Map<UUID, VocabularyItem> currentItemsById = currentItems.stream()
                .collect(Collectors.toMap(VocabularyItem::getId, item -> item));

        Set<UUID> receivedIds = new java.util.HashSet<>();

        if (requestItems != null && !requestItems.isEmpty()) {
            for (int i = 0; i < requestItems.size(); i++) {
                VocabularyItemRequest iReq = requestItems.get(i);
                UUID itemId = iReq.getId();

                if (itemId != null && currentItemsById.containsKey(itemId)) {
                    // Update existing item
                    VocabularyItem existingItem = currentItemsById.get(itemId);
                    existingItem.setItemOrder(iReq.getItemOrder() != null ? iReq.getItemOrder() : (i + 1));
                    existingItem.setJapanese(trimToNull(iReq.getJapanese()));
                    existingItem.setFurigana(trimToNull(iReq.getFurigana()));
                    existingItem.setRomaji(trimToNull(iReq.getRomaji()));
                    existingItem.setMeaning(trimToNull(iReq.getMeaning()));
                    existingItem.setExampleSentence(trimToNull(iReq.getExampleSentence()));
                    existingItem.setExampleTranslation(trimToNull(iReq.getExampleTranslation()));
                    existingItem.setPartOfSpeech(trimToNull(iReq.getPartOfSpeech()));

                    vocabularyItemRepository.save(existingItem);
                    itemResponses.add(toItemResponse(existingItem));
                    receivedIds.add(itemId);
                } else {
                    // Insert new item
                    VocabularyItem newItem = VocabularyItem.builder()
                            .vocabularyLesson(lesson)
                            .itemOrder(iReq.getItemOrder() != null ? iReq.getItemOrder() : (i + 1))
                            .japanese(trimToNull(iReq.getJapanese()))
                            .furigana(trimToNull(iReq.getFurigana()))
                            .romaji(trimToNull(iReq.getRomaji()))
                            .meaning(trimToNull(iReq.getMeaning()))
                            .exampleSentence(trimToNull(iReq.getExampleSentence()))
                            .exampleTranslation(trimToNull(iReq.getExampleTranslation()))
                            .partOfSpeech(trimToNull(iReq.getPartOfSpeech()))
                            .build();

                    newItem = vocabularyItemRepository.save(newItem);
                    itemResponses.add(toItemResponse(newItem));
                    if (newItem.getId() != null) {
                        receivedIds.add(newItem.getId());
                    }
                }
            }
        }

        // Delete items not in the request
        List<VocabularyItem> itemsToDelete = currentItems.stream()
                .filter(item -> !receivedIds.contains(item.getId()))
                .collect(Collectors.toList());

        if (!itemsToDelete.isEmpty()) {
            log.info("Deleting {} vocabulary items", itemsToDelete.size());
            vocabularyItemRepository.deleteAll(itemsToDelete);
        }

        log.info("Synced {} vocabulary items ({} updated/inserted, {} deleted)",
                itemResponses.size(), itemResponses.size(), itemsToDelete.size());

        return itemResponses;
    }

    @Override
    public void deleteVocabularyLesson(UUID lessonId) {
        log.info("Deleting vocabulary lesson: {}", lessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        // Capture the shared Lesson id BEFORE the delete so the cleanup
        // service can decide whether the parent lesson is now empty.
        UUID sharedLessonId = lesson.getLesson() != null ? lesson.getLesson().getId() : null;

        vocabularyLessonRepository.delete(lesson);
        log.info("Deleted vocabulary lesson: {}", lessonId);

        // Remove the shared Lesson if no remaining skills reference it. Runs
        // in the same transaction as the skill delete above.
        learningJourneyLessonService.checkAndDeleteEmptyLesson(sharedLessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyLessonResponse getVocabularyLesson(UUID lessonId) {
        log.debug("Fetching vocabulary lesson: {}", lessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        return toResponse(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public VocabularyDetailResponse getVocabularyLessonDetail(UUID lessonId) {
        log.debug("Fetching vocabulary lesson detail: {}", lessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        List<VocabularyItemResponse> items = vocabularyItemRepository
                .findByVocabularyLessonIdOrderByItemOrderAsc(lessonId)
                .stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, items);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponse> getAllVocabularyLessons() {
        log.debug("Fetching all vocabulary lessons");

        return vocabularyLessonRepository.findAllByOrderByLessonNumberAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponse> getVocabularyLessonsByLevel(String jlptLevel) {
        log.debug("Fetching vocabulary lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return vocabularyLessonRepository.findAllByJlptLevelOrdered(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponse> getActiveVocabularyLessons() {
        log.debug("Fetching active vocabulary lessons");

        return vocabularyLessonRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VocabularyLessonResponse> getActiveVocabularyLessonsByLevel(String jlptLevel) {
        log.debug("Fetching active vocabulary lessons for level: {}", jlptLevel);

        validateLevel(jlptLevel);

        return vocabularyLessonRepository.findByJlptLevelAndIsActiveTrue(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VocabularyLessonResponse publishLesson(UUID lessonId) {
        log.info("Publishing vocabulary lesson: {}", lessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        lesson.setIsActive(true);
        lesson = vocabularyLessonRepository.save(lesson);
        log.info("Published vocabulary lesson: {}", lessonId);

        return toResponse(lesson);
    }

    @Override
    public VocabularyLessonResponse unpublishLesson(UUID lessonId) {
        log.info("Unpublishing vocabulary lesson: {}", lessonId);

        VocabularyLesson lesson = vocabularyLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("VocabularyLesson", "id", lessonId));

        lesson.setIsActive(false);
        lesson = vocabularyLessonRepository.save(lesson);
        log.info("Unpublished vocabulary lesson: {}", lessonId);

        return toResponse(lesson);
    }

    private VocabularyLessonResponse toResponse(VocabularyLesson lesson) {
        return VocabularyLessonResponse.builder()
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

    private VocabularyDetailResponse toDetailResponse(VocabularyLesson lesson, List<VocabularyItemResponse> items) {
        return VocabularyDetailResponse.builder()
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
                .items(items)
                .build();
    }

    private VocabularyItemResponse toItemResponse(VocabularyItem item) {
        return VocabularyItemResponse.builder()
                .id(item.getId())
                .vocabularyLessonId(item.getVocabularyLesson() != null ? item.getVocabularyLesson().getId() : null)
                .itemOrder(item.getItemOrder())
                .japanese(item.getJapanese())
                .furigana(item.getFurigana())
                .romaji(item.getRomaji())
                .meaning(item.getMeaning())
                .exampleSentence(item.getExampleSentence())
                .exampleTranslation(item.getExampleTranslation())
                .partOfSpeech(item.getPartOfSpeech())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
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