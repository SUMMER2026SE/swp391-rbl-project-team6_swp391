package com.midori.repository;

import com.midori.entity.VocabularyLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyLessonRepository extends JpaRepository<VocabularyLesson, UUID> {

    Optional<VocabularyLesson> findById(UUID id);

    @Query("SELECT v FROM VocabularyLesson v ORDER BY v.lessonNumber ASC")
    List<VocabularyLesson> findAllByOrderByLessonNumberAsc();

    List<VocabularyLesson> findByJlptLevel(String jlptLevel);

    List<VocabularyLesson> findByIsActiveTrue();

    List<VocabularyLesson> findByJlptLevelAndIsActiveTrue(String jlptLevel);

    List<VocabularyLesson> findByIsActiveTrueAndIsPublishedTrue();

    boolean existsByLessonNumberAndJlptLevel(Integer lessonNumber, String jlptLevel);

    @Query("SELECT v FROM VocabularyLesson v WHERE v.jlptLevel = :jlptLevel ORDER BY v.lessonNumber ASC")
    List<VocabularyLesson> findAllByJlptLevelOrdered(@Param("jlptLevel") String jlptLevel);

    long countByIsActive(Boolean isActive);

    long countByJlptLevel(String jlptLevel);

    long countByLessonId(UUID lessonId);

    Optional<VocabularyLesson> findByJlptLevelAndLessonNumber(String jlptLevel, Integer lessonNumber);
}
