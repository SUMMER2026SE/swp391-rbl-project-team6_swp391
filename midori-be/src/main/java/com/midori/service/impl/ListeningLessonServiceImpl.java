package com.midori.service.impl;

import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningLessonRequest;
import com.midori.dto.listening.ListeningLessonResponse;
import com.midori.entity.Difficulty;
import com.midori.entity.ListeningLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ListeningLessonRepository;
import com.midori.service.ListeningLessonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ListeningLessonServiceImpl implements ListeningLessonService {

    private final ListeningLessonRepository listeningLessonRepository;

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

        return toDetailResponse(lesson);
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

        return toDetailResponse(lesson);
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

    private ListeningDetailResponse toDetailResponse(ListeningLesson lesson) {
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
