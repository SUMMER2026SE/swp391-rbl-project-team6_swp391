package com.midori.service;

import com.midori.dto.vocabulary.*;

import java.util.List;
import java.util.UUID;

public interface VocabularyService {

    // ===== Teacher / Admin =====

    VocabularyLessonResponse createLesson(VocabularyLessonCreateRequest request, UUID createdBy);

    VocabularyLessonResponse updateLesson(UUID lessonId, VocabularyLessonUpdateRequest request, UUID currentUserId);

    void deleteLesson(UUID lessonId, UUID currentUserId);

    VocabularyLessonDetailResponse getLessonDetailForManagement(UUID lessonId, UUID currentUserId);

    List<VocabularyLessonResponse> listLessonsForManagement(String level, String topic, String search, UUID currentUserId);

    VocabularyWordResponse addWord(UUID lessonId, VocabularyWordCreateRequest request, UUID currentUserId);

    VocabularyWordResponse updateWord(UUID wordId, VocabularyWordUpdateRequest request, UUID currentUserId);

    void deleteWord(UUID wordId, UUID currentUserId);

    VocabularyLessonResponse publishLesson(UUID lessonId, UUID currentUserId);

    VocabularyLessonResponse unpublishLesson(UUID lessonId, UUID currentUserId);

    // ===== Student =====

    List<VocabularyLessonResponse> listPublishedLessons(String level, String topic, String search);

    VocabularyLessonDetailResponse getPublishedLessonDetail(UUID lessonId);
}
