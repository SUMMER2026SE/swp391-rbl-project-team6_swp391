package com.midori.service;

import com.midori.dto.vocabulary.VocabularyFavoriteResponse;

import java.util.List;
import java.util.UUID;

public interface StudentVocabularyFavoriteService {

    /**
     * Add a vocabulary item to favorites
     */
    VocabularyFavoriteResponse addFavorite(UUID studentId, UUID vocabularyItemId);

    /**
     * Remove a vocabulary item from favorites
     */
    void removeFavorite(UUID studentId, UUID vocabularyItemId);

    /**
     * Check if a vocabulary item is favorited
     */
    boolean isFavorite(UUID studentId, UUID vocabularyItemId);

    /**
     * Get all favorite vocabulary item IDs for a student
     */
    List<UUID> getFavoriteVocabularyItemIds(UUID studentId);

    /**
     * Get all favorite vocabulary item IDs for a student within a specific lesson
     */
    List<UUID> getFavoriteVocabularyItemIdsByLesson(UUID studentId, UUID lessonId);

    /**
     * Get all favorites for a student
     */
    List<VocabularyFavoriteResponse> getFavorites(UUID studentId);

    /**
     * Get all favorites for a student within a specific lesson
     */
    List<VocabularyFavoriteResponse> getFavoritesByLesson(UUID studentId, UUID lessonId);

    /**
     * Toggle favorite status
     */
    VocabularyFavoriteResponse toggleFavorite(UUID studentId, UUID vocabularyItemId);
}
