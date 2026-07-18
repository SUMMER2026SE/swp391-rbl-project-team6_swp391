package com.midori.repository;

import com.midori.entity.VocabularyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyItemRepository extends JpaRepository<VocabularyItem, UUID> {

    Optional<VocabularyItem> findById(UUID id);

    @Query("SELECT vi FROM VocabularyItem vi WHERE vi.vocabularyLesson.id = :lessonId ORDER BY vi.itemOrder ASC")
    List<VocabularyItem> findByVocabularyLessonIdOrderByItemOrderAsc(@Param("lessonId") UUID lessonId);

    @Query("SELECT vi FROM VocabularyItem vi JOIN FETCH vi.vocabularyLesson WHERE vi.id = :id")
    Optional<VocabularyItem> findByIdWithLesson(@Param("id") UUID id);

    boolean existsByVocabularyLessonIdAndItemOrder(UUID vocabularyLessonId, Integer itemOrder);

    void deleteByVocabularyLessonId(UUID vocabularyLessonId);

    long countByVocabularyLessonId(UUID vocabularyLessonId);
}