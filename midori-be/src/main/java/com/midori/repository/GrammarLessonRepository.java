package com.midori.repository;

import com.midori.entity.GrammarLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrammarLessonRepository extends JpaRepository<GrammarLesson, UUID> {

    Optional<GrammarLesson> findById(UUID id);

    @Query("SELECT g FROM GrammarLesson g ORDER BY g.lessonNumber ASC")
    List<GrammarLesson> findAllByOrderByLessonNumberAsc();

    List<GrammarLesson> findByJlptLevel(String jlptLevel);

    List<GrammarLesson> findByIsActiveTrue();

    List<GrammarLesson> findByJlptLevelAndIsActiveTrue(String jlptLevel);

    boolean existsByLessonNumberAndJlptLevel(Integer lessonNumber, String jlptLevel);

    @Query("SELECT g FROM GrammarLesson g WHERE g.jlptLevel = :jlptLevel ORDER BY g.lessonNumber ASC")
    List<GrammarLesson> findAllByJlptLevelOrdered(@Param("jlptLevel") String jlptLevel);

    long countByIsActive(Boolean isActive);

    long countByJlptLevel(String jlptLevel);

    long countByLessonId(UUID lessonId);

    Optional<GrammarLesson> findByJlptLevelAndLessonNumber(String jlptLevel, Integer lessonNumber);
}