package com.midori.service;

import com.midori.dto.vocabulary.VocabularyDetailResponse;
import com.midori.dto.vocabulary.VocabularyLessonRequest;
import com.midori.dto.vocabulary.VocabularyLessonResponse;
import com.midori.dto.vocabulary.VocabularyLessonWithItemsRequest;

import java.util.List;
import java.util.UUID;

public interface VocabularyLessonService {

    VocabularyLessonResponse createVocabularyLesson(VocabularyLessonRequest request);

    VocabularyDetailResponse createVocabularyLessonWithItems(VocabularyLessonWithItemsRequest request);

    VocabularyDetailResponse updateVocabularyLesson(UUID lessonId, VocabularyLessonRequest request);

    VocabularyDetailResponse updateVocabularyLessonWithItems(UUID lessonId, VocabularyLessonWithItemsRequest request);

    void deleteVocabularyLesson(UUID lessonId);

    VocabularyLessonResponse getVocabularyLesson(UUID lessonId);

    VocabularyDetailResponse getVocabularyLessonDetail(UUID lessonId);

    List<VocabularyLessonResponse> getAllVocabularyLessons();

    List<VocabularyLessonResponse> getVocabularyLessonsByLevel(String jlptLevel);

    List<VocabularyLessonResponse> getActiveVocabularyLessons();

    List<VocabularyLessonResponse> getActiveVocabularyLessonsByLevel(String jlptLevel);

    VocabularyLessonResponse publishLesson(UUID lessonId);

    VocabularyLessonResponse unpublishLesson(UUID lessonId);
}
