package com.midori.service.impl;

import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningItemRequest;
import com.midori.dto.listening.ListeningItemResponse;
import com.midori.dto.listening.ListeningLessonRequest;
import com.midori.dto.listening.ListeningLessonResponse;
import com.midori.dto.listening.ListeningLessonWithItemsRequest;
import com.midori.entity.Difficulty;
import com.midori.entity.ListeningItem;
import com.midori.entity.ListeningLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ListeningItemRepository;
import com.midori.repository.ListeningLessonRepository;
import com.midori.service.LearningJourneyLessonService;
import com.midori.service.LessonService;
import com.midori.service.ListeningLessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ListeningLessonServiceImpl implements ListeningLessonService {

    private final ListeningLessonRepository listeningLessonRepository;
    private final ListeningItemRepository listeningItemRepository;
    private final LessonService lessonService;
    private final LearningJourneyLessonService learningJourneyLessonService;

    @Override
    public ListeningLessonResponse createListeningLesson(ListeningLessonRequest request) {
        log.info("Creating listening lesson: {} for level {}", request.getTitle(), request.getJlptLevel());

        if (listeningLessonRepository.existsByLessonNumberAndJlptLevel(
                request.getLessonNumber(), request.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Listening lesson with number %d already exists for level %s",
                            request.getLessonNumber(), request.getJlptLevel()));
        }

        var lessonResponse = lessonService.getOrCreateLesson(
                request.getJlptLevel(),
                request.getLessonNumber(),
                request.getTitle(),
                request.getDescription()
        );

        ListeningLesson lesson = ListeningLesson.builder()
                .jlptLevel(trimToNull(request.getJlptLevel()))
                .lessonNumber(request.getLessonNumber())
                .title(trimToNull(request.getTitle()))
                .description(trimToNull(request.getDescription()))
                .transcript(trimToNull(request.getTranscript()))
                .estimatedMinutes(request.getEstimatedMinutes())
                .difficulty(parseDifficulty(request.getDifficulty()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
        lesson = listeningLessonRepository.save(lesson);
        log.info("Created listening lesson with id: {}", lesson.getId());

        return toResponse(lesson);
    }

    @Override
    public ListeningDetailResponse createListeningLessonWithItems(ListeningLessonWithItemsRequest request) {
        log.info("Creating listening lesson with items: {}", request.getLesson().getTitle());

        ListeningLessonRequest lessonRequest = request.getLesson();

        if (listeningLessonRepository.existsByLessonNumberAndJlptLevel(
                lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel())) {
            throw new BadRequestException(
                    String.format("Listening lesson with number %d already exists for level %s",
                            lessonRequest.getLessonNumber(), lessonRequest.getJlptLevel()));
        }

        var lessonResponse = lessonService.getOrCreateLesson(
                lessonRequest.getJlptLevel(),
                lessonRequest.getLessonNumber(),
                lessonRequest.getTitle(),
                lessonRequest.getDescription()
        );

        ListeningLesson lesson = ListeningLesson.builder()
                .jlptLevel(trimToNull(lessonRequest.getJlptLevel()))
                .lessonNumber(lessonRequest.getLessonNumber())
                .title(trimToNull(lessonRequest.getTitle()))
                .description(trimToNull(lessonRequest.getDescription()))
                .transcript(trimToNull(lessonRequest.getTranscript()))
                .estimatedMinutes(lessonRequest.getEstimatedMinutes())
                .difficulty(parseDifficulty(lessonRequest.getDifficulty()))
                .isActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true)
                .build();

        lesson.setLesson(com.midori.entity.Lesson.builder().id(lessonResponse.getId()).build());
        lesson = listeningLessonRepository.save(lesson);
        log.info("Created listening lesson with id: {}", lesson.getId());

        List<ListeningItemResponse> itemResponses = new ArrayList<>();

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (ListeningItemRequest iReq : request.getItems()) {
                if (listeningItemRepository.existsByListeningLessonIdAndQuestionOrder(
                        lesson.getId(), iReq.getQuestionOrder())) {
                    throw new BadRequestException(
                            String.format("Item with order %d already exists for this listening lesson",
                                    iReq.getQuestionOrder()));
                }

                ListeningItem item = ListeningItem.builder()
                        .listeningLesson(lesson)
                        .questionOrder(iReq.getQuestionOrder())
                        .audioUrl(trimToNull(iReq.getAudioUrl()))
                        .question(trimToNull(iReq.getQuestion()))
                        .optionA(trimToNull(iReq.getOptionA()))
                        .optionB(trimToNull(iReq.getOptionB()))
                        .optionC(trimToNull(iReq.getOptionC()))
                        .optionD(trimToNull(iReq.getOptionD()))
                        .correctAnswer(iReq.getCorrectAnswer().toUpperCase().trim())
                        .explanation(trimToNull(iReq.getExplanation()))
                        .build();

                item = listeningItemRepository.save(item);
                itemResponses.add(toItemResponse(item));
            }
            log.info("Created {} items for listening lesson: {}", itemResponses.size(), lesson.getId());
        }

        return toDetailResponse(lesson, itemResponses);
    }

    @Override
    public ListeningDetailResponse updateListeningLessonWithItems(UUID lessonId, ListeningLessonWithItemsRequest request) {
        log.info("Updating listening lesson with items: {}", lessonId);

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
        lesson.setTranscript(trimToNull(lessonRequest.getTranscript()));
        lesson.setEstimatedMinutes(lessonRequest.getEstimatedMinutes());
        lesson.setDifficulty(parseDifficulty(lessonRequest.getDifficulty()));
        lesson.setIsActive(lessonRequest.getIsActive() != null ? lessonRequest.getIsActive() : true);

        lesson = listeningLessonRepository.save(lesson);

        // Reconcile items: preserve ids that match existing items, drop
        // anything that has been removed from the request, and add new
        // ones.
        List<UUID> requestItemIds = request.getItems() != null
                ? request.getItems().stream()
                    .map(i -> {
                        String raw = i.getId();
                        if (raw == null || raw.isBlank()) return null;
                        if (raw.startsWith("item-") || raw.startsWith("temp-")) return null;
                        try {
                            return UUID.fromString(raw);
                        } catch (IllegalArgumentException ex) {
                            return null;
                        }
                    })
                    .filter(id -> id != null)
                    .collect(Collectors.toList())
                : new ArrayList<>();

        List<ListeningItem> existingItems = listeningItemRepository
                .findByListeningLessonIdOrderByQuestionOrderAsc(lessonId);

        for (ListeningItem existing : existingItems) {
            boolean stillExists = requestItemIds.stream()
                    .anyMatch(id -> id.equals(existing.getId()));
            if (!stillExists) {
                listeningItemRepository.delete(existing);
                log.info("Deleted listening item: {}", existing.getId());
            }
        }

        List<ListeningItemResponse> itemResponses = new ArrayList<>();

        if (request.getItems() != null) {
            for (ListeningItemRequest iReq : request.getItems()) {
                String raw = iReq.getId();
                boolean isExisting = raw != null && !raw.isBlank()
                        && !raw.startsWith("item-") && !raw.startsWith("temp-");

                if (isExisting) {
                    try {
                        UUID itemUuid = UUID.fromString(raw);
                        Optional<ListeningItem> existingOpt = listeningItemRepository.findById(itemUuid);
                        if (existingOpt.isPresent()) {
                            ListeningItem existing = existingOpt.get();
                            if (!existing.getQuestionOrder().equals(iReq.getQuestionOrder())) {
                                if (listeningItemRepository.existsByListeningLessonIdAndQuestionOrder(
                                        lessonId, iReq.getQuestionOrder())) {
                                    throw new BadRequestException(
                                            String.format("Item with order %d already exists for this listening lesson",
                                                    iReq.getQuestionOrder()));
                                }
                            }
                            existing.setQuestionOrder(iReq.getQuestionOrder());
                            if (iReq.getAudioUrl() != null && !iReq.getAudioUrl().isBlank()) {
                                existing.setAudioUrl(trimToNull(iReq.getAudioUrl()));
                            }
                            existing.setQuestion(trimToNull(iReq.getQuestion()));
                            existing.setOptionA(trimToNull(iReq.getOptionA()));
                            existing.setOptionB(trimToNull(iReq.getOptionB()));
                            existing.setOptionC(trimToNull(iReq.getOptionC()));
                            existing.setOptionD(trimToNull(iReq.getOptionD()));
                            existing.setCorrectAnswer(iReq.getCorrectAnswer().toUpperCase().trim());
                            existing.setExplanation(trimToNull(iReq.getExplanation()));
                            existing = listeningItemRepository.save(existing);
                            itemResponses.add(toItemResponse(existing));
                            continue;
                        }
                    } catch (IllegalArgumentException ignored) {
                        // fall through to create-new branch
                    }
                }

                // New item
                if (listeningItemRepository.existsByListeningLessonIdAndQuestionOrder(
                        lessonId, iReq.getQuestionOrder())) {
                    throw new BadRequestException(
                            String.format("Item with order %d already exists for this listening lesson",
                                    iReq.getQuestionOrder()));
                }

                ListeningItem item = ListeningItem.builder()
                        .listeningLesson(lesson)
                        .questionOrder(iReq.getQuestionOrder())
                        .audioUrl(trimToNull(iReq.getAudioUrl()))
                        .question(trimToNull(iReq.getQuestion()))
                        .optionA(trimToNull(iReq.getOptionA()))
                        .optionB(trimToNull(iReq.getOptionB()))
                        .optionC(trimToNull(iReq.getOptionC()))
                        .optionD(trimToNull(iReq.getOptionD()))
                        .correctAnswer(iReq.getCorrectAnswer().toUpperCase().trim())
                        .explanation(trimToNull(iReq.getExplanation()))
                        .build();

                item = listeningItemRepository.save(item);
                itemResponses.add(toItemResponse(item));
            }
        }

        log.info("Updated listening lesson: {}", lessonId);
        return toDetailResponse(lesson, itemResponses);
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

        List<ListeningItemResponse> items = listeningItemRepository
                .findByListeningLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, items);
    }

    @Override
    public void deleteListeningLesson(UUID lessonId) {
        log.info("Deleting listening lesson: {}", lessonId);

        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));

        UUID sharedLessonId = lesson.getLesson() != null ? lesson.getLesson().getId() : null;

        listeningLessonRepository.delete(lesson);
        log.info("Deleted listening lesson: {}", lessonId);

        learningJourneyLessonService.checkAndDeleteEmptyLesson(sharedLessonId);
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

        List<ListeningItemResponse> items = listeningItemRepository
                .findByListeningLessonIdOrderByQuestionOrderAsc(lessonId)
                .stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());

        return toDetailResponse(lesson, items);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getAllListeningLessons() {
        return listeningLessonRepository.findAllByOrderByLessonNumberAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getListeningLessonsByLevel(String jlptLevel) {
        validateLevel(jlptLevel);
        return listeningLessonRepository.findAllByJlptLevelOrdered(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getActiveListeningLessons() {
        return listeningLessonRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ListeningLessonResponse> getActiveListeningLessonsByLevel(String jlptLevel) {
        validateLevel(jlptLevel);
        return listeningLessonRepository.findByJlptLevelAndIsActiveTrue(jlptLevel)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ListeningLessonResponse publishLesson(UUID lessonId) {
        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));
        lesson.setIsActive(true);
        lesson = listeningLessonRepository.save(lesson);
        return toResponse(lesson);
    }

    @Override
    public ListeningLessonResponse unpublishLesson(UUID lessonId) {
        ListeningLesson lesson = listeningLessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("ListeningLesson", "id", lessonId));
        lesson.setIsActive(false);
        lesson = listeningLessonRepository.save(lesson);
        return toResponse(lesson);
    }

    private ListeningLessonResponse toResponse(ListeningLesson lesson) {
        return ListeningLessonResponse.builder()
                .id(lesson.getId())
                .lessonId(lesson.getLesson() != null ? lesson.getLesson().getId() : null)
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .transcript(lesson.getTranscript())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    private ListeningDetailResponse toDetailResponse(ListeningLesson lesson, List<ListeningItemResponse> items) {
        return ListeningDetailResponse.builder()
                .id(lesson.getId())
                .lessonId(lesson.getLesson() != null ? lesson.getLesson().getId() : null)
                .jlptLevel(lesson.getJlptLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .transcript(lesson.getTranscript())
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .difficulty(lesson.getDifficulty() != null ? lesson.getDifficulty().name() : null)
                .isActive(lesson.getIsActive())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .listeningItems(items)
                .build();
    }

    private ListeningItemResponse toItemResponse(ListeningItem item) {
        return ListeningItemResponse.builder()
                .id(item.getId().toString())
                .listeningLessonId(item.getListeningLesson().getId().toString())
                .questionOrder(item.getQuestionOrder())
                .audioUrl(item.getAudioUrl())
                .question(item.getQuestion())
                .optionA(item.getOptionA())
                .optionB(item.getOptionB())
                .optionC(item.getOptionC())
                .optionD(item.getOptionD())
                .correctAnswer(item.getCorrectAnswer())
                .explanation(item.getExplanation())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private Difficulty parseDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return null;
        try {
            return Difficulty.valueOf(difficulty.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Difficulty must be EASY, MEDIUM, or HARD");
        }
    }

    private void validateLevel(String level) {
        if (level == null || level.isBlank()) return;
        String normalized = level.toUpperCase().trim();
        if (!normalized.matches("^N[1-5]$")) {
            throw new BadRequestException("Level must be N5, N4, N3, N2, or N1");
        }
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}