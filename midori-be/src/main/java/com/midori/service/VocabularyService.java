package com.midori.service;

import com.midori.dto.vocabulary.*;

import java.util.List;
import java.util.UUID;

public interface VocabularyService {

    VocabularyLessonResponseV2 createLesson(VocabularyLessonCreateRequestV2 request, UUID createdBy);

    VocabularyLessonResponseV2 updateLesson(UUID lessonId, VocabularyLessonUpdateRequestV2 request, UUID currentUserId);

    void deleteLesson(UUID lessonId, UUID currentUserId);

    VocabularyLessonDetailResponseV2 getLessonDetailForManagement(UUID lessonId, UUID currentUserId);

    List<VocabularyLessonResponseV2> listLessonsForManagement(String level, String topic, String search, UUID currentUserId);

    VocabularyWordResponseV2 addWord(UUID lessonId, VocabularyWordCreateRequestV2 request, UUID currentUserId);

    VocabularyWordResponseV2 updateWord(UUID wordId, VocabularyWordUpdateRequestV2 request, UUID currentUserId);

    void deleteWord(UUID wordId, UUID currentUserId);

    VocabularyLessonResponseV2 publishLesson(UUID lessonId, UUID currentUserId);

    VocabularyLessonResponseV2 unpublishLesson(UUID lessonId, UUID currentUserId);

    List<VocabularyLessonResponseV2> listPublishedLessons(String level, String topic, String search);

    VocabularyLessonDetailResponseV2 getPublishedLessonDetail(UUID lessonId);
}
