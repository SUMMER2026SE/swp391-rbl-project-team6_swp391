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
     * Find a saved word by user ID, surface form, and lesson ID.
     */
    Optional<StudentSavedWord> findByUserIdAndSurfaceAndLessonId(String userId, String surface, String lessonId);

    /**
     * Check if a word is saved by a user.
     */
    boolean existsByUserIdAndSurface(String userId, String surface);

    /**
     * Check if a word is saved by a user in a specific lesson.
     */
    boolean existsByUserIdAndSurfaceAndLessonId(String userId, String surface, String lessonId);

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
     * Delete a saved word by user ID, surface form, and lesson ID.
     */
    void deleteByUserIdAndSurfaceAndLessonId(String userId, String surface, String lessonId);

    /**
     * Find saved words by user that include a specific lesson.
     */
    List<StudentSavedWord> findByUserIdAndLessonIdOrderByCreatedAtDesc(String userId, String lessonId);
}
