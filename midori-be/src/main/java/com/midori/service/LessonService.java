package com.midori.service;

import com.midori.dto.lesson.LessonResponse;

import java.util.List;
import java.util.UUID;

public interface LessonService {

    LessonResponse getOrCreateLesson(String level, Integer lessonNumber, String title, String description);

    List<LessonResponse> getAllLessons();

    List<LessonResponse> getLessonsByLevel(String level);
}
