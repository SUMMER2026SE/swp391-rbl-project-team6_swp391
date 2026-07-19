package com.midori.repository;

import com.midori.entity.ReadingPassage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReadingPassageRepository extends JpaRepository<ReadingPassage, UUID> {

    Optional<ReadingPassage> findById(UUID id);

    @Query("SELECT rp FROM ReadingPassage rp WHERE rp.readingLesson.id = :lessonId ORDER BY rp.passageOrder ASC")
    List<ReadingPassage> findByReadingLessonIdOrderByPassageOrderAsc(@Param("lessonId") UUID lessonId);

    @Query("SELECT rp FROM ReadingPassage rp JOIN FETCH rp.readingLesson WHERE rp.id = :id")
    Optional<ReadingPassage> findByIdWithLesson(@Param("id") UUID id);

    boolean existsByReadingLessonIdAndPassageOrder(UUID readingLessonId, Integer passageOrder);

    long countByReadingLessonId(UUID readingLessonId);
}
