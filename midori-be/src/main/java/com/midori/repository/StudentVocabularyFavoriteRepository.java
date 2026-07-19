package com.midori.repository;

import com.midori.entity.StudentVocabularyFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentVocabularyFavoriteRepository extends JpaRepository<StudentVocabularyFavorite, UUID> {

    /**
     * Find a favorite by student and vocabulary item
     */
    Optional<StudentVocabularyFavorite> findByStudentIdAndVocabularyItemId(UUID studentId, UUID vocabularyItemId);

    /**
     * Check if a vocabulary item is favorited by a student
     */
    boolean existsByStudentIdAndVocabularyItemId(UUID studentId, UUID vocabularyItemId);

    /**
     * Get all favorite vocabulary item IDs for a student
     */
    @Query("SELECT f.vocabularyItem.id FROM StudentVocabularyFavorite f WHERE f.student.id = :studentId")
    List<UUID> findVocabularyItemIdsByStudentId(@Param("studentId") UUID studentId);

    /**
     * Get all favorite vocabulary item IDs for a student within a specific lesson
     */
    @Query("SELECT f.vocabularyItem.id FROM StudentVocabularyFavorite f " +
           "WHERE f.student.id = :studentId AND f.vocabularyItem.vocabularyLesson.id = :lessonId")
    List<UUID> findVocabularyItemIdsByStudentIdAndLessonId(@Param("studentId") UUID studentId, @Param("lessonId") UUID lessonId);

    /**
     * Get all favorites for a student
     */
    List<StudentVocabularyFavorite> findByStudentId(UUID studentId);

    /**
     * Get all favorites for a student within a specific lesson
     */
    @Query("SELECT f FROM StudentVocabularyFavorite f " +
           "JOIN FETCH f.vocabularyItem vi " +
           "JOIN FETCH vi.vocabularyLesson " +
           "WHERE f.student.id = :studentId AND vi.vocabularyLesson.id = :lessonId")
    List<StudentVocabularyFavorite> findByStudentIdAndLessonId(@Param("studentId") UUID studentId, @Param("lessonId") UUID lessonId);

    /**
     * Delete a favorite by student and vocabulary item
     */
    void deleteByStudentIdAndVocabularyItemId(UUID studentId, UUID vocabularyItemId);

    /**
     * Count favorites for a student
     */
    long countByStudentId(UUID studentId);

    /**
     * Count favorites for a student within a specific lesson
     */
    @Query("SELECT COUNT(f) FROM StudentVocabularyFavorite f " +
           "WHERE f.student.id = :studentId AND f.vocabularyItem.vocabularyLesson.id = :lessonId")
    long countByStudentIdAndLessonId(@Param("studentId") UUID studentId, @Param("lessonId") UUID lessonId);
}
