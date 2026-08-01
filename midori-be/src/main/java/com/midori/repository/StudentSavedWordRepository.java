package com.midori.repository;

import com.midori.entity.StudentSavedWord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for student saved words.
 */
@Repository
public interface StudentSavedWordRepository extends JpaRepository<StudentSavedWord, UUID> {

    /**
     * Find a saved word by user ID and surface form.
     */
    Optional<StudentSavedWord> findByUserIdAndSurface(String userId, String surface);

    /**
     * Check if a word is saved by a user.
     */
    boolean existsByUserIdAndSurface(String userId, String surface);

    /**
     * Find all saved words by a user.
     */
    List<StudentSavedWord> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Find saved words by user with pagination.
     */
    Page<StudentSavedWord> findByUserId(String userId, Pageable pageable);

    /**
     * Find saved words by user and JLPT level.
     */
    List<StudentSavedWord> findByUserIdAndJlptLevelOrderByCreatedAtDesc(String userId, String jlptLevel);

    /**
     * Count saved words by user.
     */
    long countByUserId(String userId);

    /**
     * Search saved words by user and surface/meaning.
     */
    @Query("SELECT sw FROM StudentSavedWord sw WHERE sw.userId = :userId " +
           "AND (LOWER(sw.surface) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(sw.meaning) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<StudentSavedWord> searchByUserAndQuery(@Param("userId") String userId, 
                                                @Param("query") String query, 
                                                Pageable pageable);

    /**
     * Delete a saved word.
     */
    void deleteByUserIdAndSurface(String userId, String surface);

    /**
     * Find saved words by user that include a specific lesson.
     */
    List<StudentSavedWord> findByUserIdAndLessonIdOrderByCreatedAtDesc(String userId, String lessonId);

    /**
     * Find saved words for a user with optional filters.
     */
    @Query("SELECT sw FROM StudentSavedWord sw WHERE sw.userId = :userId " +
           "AND (:lessonId IS NULL OR sw.lessonId = :lessonId) " +
           "AND (:learningStatus IS NULL OR sw.learningStatus = :learningStatus) " +
           "AND (:isDifficult IS NULL OR sw.isDifficult = :isDifficult)")
    List<StudentSavedWord> findFiltered(
            @Param("userId") String userId,
            @Param("lessonId") String lessonId,
            @Param("learningStatus") String learningStatus,
            @Param("isDifficult") Boolean isDifficult);
}
