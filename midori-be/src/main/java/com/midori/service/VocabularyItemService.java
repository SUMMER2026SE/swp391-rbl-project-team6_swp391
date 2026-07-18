package com.midori.service;

import com.midori.dto.vocabulary.VocabularyItemRequest;
import com.midori.dto.vocabulary.VocabularyItemResponse;

import java.util.List;
import java.util.UUID;

public interface VocabularyItemService {

    VocabularyItemResponse createItem(UUID vocabularyLessonId, VocabularyItemRequest request);

    VocabularyItemResponse updateItem(UUID itemId, VocabularyItemRequest request);

    void deleteItem(UUID itemId);

    VocabularyItemResponse getItem(UUID itemId);

    List<VocabularyItemResponse> getItemsByVocabularyLesson(UUID vocabularyLessonId);

    void deleteItemsByVocabularyLesson(UUID vocabularyLessonId);
}