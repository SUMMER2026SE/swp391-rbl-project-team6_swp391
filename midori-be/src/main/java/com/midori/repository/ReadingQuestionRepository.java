package com.midori.repository;

import com.midori.entity.ReadingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReadingQuestionRepository extends JpaRepository<ReadingQuestion, UUID> {

    Optional<ReadingQuestion> findById(UUID id);

    @Query("SELECT rq FROM ReadingQuestion rq WHERE rq.readingLesson.id = :lessonId ORDER BY rq.questionOrder ASC")
    List<ReadingQuestion> findByReadingLessonIdOrderByQuestionOrderAsc(@Param("lessonId") UUID lessonId);

    @Query("SELECT rq FROM ReadingQuestion rq JOIN FETCH rq.readingLesson WHERE rq.id = :id")
    Optional<ReadingQuestion> findByIdWithLesson(@Param("id") UUID id);

    boolean existsByReadingLessonIdAndQuestionOrder(UUID readingLessonId, Integer questionOrder);

    void deleteByReadingLessonId(UUID readingLessonId);

    long countByReadingLessonId(UUID readingLessonId);
}
