package com.midori.service.impl;

import com.midori.entity.Lesson;
import com.midori.repository.LessonRepository;
import com.midori.service.LessonService;
import com.midori.dto.lesson.LessonResponse;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final EntityManager entityManager;

    @Override
    public LessonResponse getOrCreateLesson(String level, Integer lessonNumber, String title, String description) {
        return lessonRepository.findByLevelAndLessonNumber(level, lessonNumber)
                .map(this::toResponse)
                .orElseGet(() -> {
                    Lesson lesson = Lesson.builder()
                            .level(level)
                            .lessonNumber(lessonNumber)
                            .title(title)
                            .description(description)
                            .orderIndex(lessonNumber)
                            .build();
                    lesson = lessonRepository.save(lesson);
                    entityManager.flush();
                    return toResponse(lesson);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonResponse> getAllLessons() {
        return lessonRepository.findAllOrdered()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByLevel(String level) {
        return lessonRepository.findByLevelOrdered(level)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private LessonResponse toResponse(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .level(lesson.getLevel())
                .lessonNumber(lesson.getLessonNumber())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .orderIndex(lesson.getOrderIndex())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }
}
