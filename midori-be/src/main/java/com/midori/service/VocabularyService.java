package com.midori.service;

import com.midori.dto.vocabulary.*;

import java.util.List;
import java.util.UUID;

public interface VocabularyService {

    // ===== Teacher / Admin =====

    VocabularyLessonResponse createLesson(VocabularyLessonCreateRequest request, UUID createdBy);

    VocabularyLessonResponse updateLesson(UUID lessonId, VocabularyLessonUpdateRequest request);

    void deleteLesson(UUID lessonId);

    VocabularyLessonDetailResponse getLessonDetailForManagement(UUID lessonId);

    List<VocabularyLessonResponse> listLessonsForManagement(String level, String topic, String search);

    VocabularyWordResponse addWord(UUID lessonId, VocabularyWordCreateRequest request);

    VocabularyWordResponse updateWord(UUID wordId, VocabularyWordUpdateRequest request);

    void deleteWord(UUID wordId);

    VocabularyLessonResponse publishLesson(UUID lessonId);

    VocabularyLessonResponse unpublishLesson(UUID lessonId);

    // ===== Student =====

    List<VocabularyLessonResponse> listPublishedLessons(String level, String topic, String search);

    VocabularyLessonDetailResponse getPublishedLessonDetail(UUID lessonId);
}
