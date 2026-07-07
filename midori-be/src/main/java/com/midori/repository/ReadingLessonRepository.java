package com.midori.repository;

import com.midori.entity.ReadingLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReadingLessonRepository extends JpaRepository<ReadingLesson, UUID> {

    Optional<ReadingLesson> findById(UUID id);

    @Query("SELECT r FROM ReadingLesson r ORDER BY r.lessonNumber ASC")
    List<ReadingLesson> findAllByOrderByLessonNumberAsc();

    List<ReadingLesson> findByJlptLevel(String jlptLevel);

    List<ReadingLesson> findByIsActiveTrue();

    List<ReadingLesson> findByJlptLevelAndIsActiveTrue(String jlptLevel);

    boolean existsByLessonNumberAndJlptLevel(Integer lessonNumber, String jlptLevel);

    @Query("SELECT r FROM ReadingLesson r WHERE r.jlptLevel = :jlptLevel ORDER BY r.lessonNumber ASC")
    List<ReadingLesson> findAllByJlptLevelOrdered(@Param("jlptLevel") String jlptLevel);

    long countByIsActive(Boolean isActive);

    long countByJlptLevel(String jlptLevel);
}
