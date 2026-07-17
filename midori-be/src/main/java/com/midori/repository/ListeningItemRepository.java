package com.midori.repository;

import com.midori.entity.ListeningItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ListeningItemRepository extends JpaRepository<ListeningItem, UUID> {

    /**
     * Returns every listening item belonging to a lesson, ordered by
     * {@code questionOrder} ascending. This is the canonical query used
     * to render the student exercise flow.
     */
    @Query("""
            SELECT li
            FROM ListeningItem li
            WHERE li.listeningLesson.id = :lessonId
            ORDER BY li.questionOrder ASC
            """)
    List<ListeningItem> findByListeningLessonIdOrderByQuestionOrderAsc(@Param("lessonId") UUID lessonId);

    @Query("""
            SELECT li
            FROM ListeningItem li
            JOIN FETCH li.listeningLesson
            WHERE li.id = :id
            """)
    Optional<ListeningItem> findByIdWithLesson(@Param("id") UUID id);

    boolean existsByListeningLessonIdAndQuestionOrder(UUID listeningLessonId, Integer questionOrder);

    void deleteByListeningLessonId(UUID listeningLessonId);

    long countByListeningLessonId(UUID listeningLessonId);
}