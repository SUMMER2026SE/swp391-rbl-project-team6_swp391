package com.midori.service;

import com.midori.dto.listening.ListeningDetailResponse;
import com.midori.dto.listening.ListeningLessonRequest;
import com.midori.dto.listening.ListeningLessonResponse;

import java.util.List;
import java.util.UUID;

public interface ListeningLessonService {

    ListeningLessonResponse createListeningLesson(ListeningLessonRequest request);

    ListeningDetailResponse updateListeningLesson(UUID lessonId, ListeningLessonRequest request);

    void deleteListeningLesson(UUID lessonId);

    ListeningLessonResponse getListeningLesson(UUID lessonId);

    ListeningDetailResponse getListeningLessonDetail(UUID lessonId);

    List<ListeningLessonResponse> getAllListeningLessons();

    List<ListeningLessonResponse> getListeningLessonsByLevel(String jlptLevel);

    List<ListeningLessonResponse> getActiveListeningLessons();

    List<ListeningLessonResponse> getActiveListeningLessonsByLevel(String jlptLevel);

    ListeningLessonResponse publishLesson(UUID lessonId);

    ListeningLessonResponse unpublishLesson(UUID lessonId);
}
