package com.midori.repository;

import com.midori.entity.ListeningLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ListeningLessonRepository extends JpaRepository<ListeningLesson, UUID> {

    Optional<ListeningLesson> findById(UUID id);

    @Query("SELECT ll FROM ListeningLesson ll ORDER BY ll.lessonNumber ASC")
    List<ListeningLesson> findAllByOrderByLessonNumberAsc();

    List<ListeningLesson> findByJlptLevel(String jlptLevel);

    List<ListeningLesson> findByIsActiveTrue();

    List<ListeningLesson> findByJlptLevelAndIsActiveTrue(String jlptLevel);

    boolean existsByLessonNumberAndJlptLevel(Integer lessonNumber, String jlptLevel);

    @Query("SELECT ll FROM ListeningLesson ll WHERE ll.jlptLevel = :jlptLevel ORDER BY ll.lessonNumber ASC")
    List<ListeningLesson> findAllByJlptLevelOrdered(@Param("jlptLevel") String jlptLevel);

    long countByIsActive(Boolean isActive);

    long countByJlptLevel(String jlptLevel);

    long countByLessonId(UUID lessonId);
}