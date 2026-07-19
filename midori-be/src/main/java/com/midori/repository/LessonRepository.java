package com.midori.repository;

import com.midori.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    Optional<Lesson> findByLevelAndLessonNumber(String level, Integer lessonNumber);

    @Query("SELECT l FROM Lesson l ORDER BY l.orderIndex ASC, l.lessonNumber ASC")
    List<Lesson> findAllOrdered();

    @Query("SELECT l FROM Lesson l WHERE l.level = :level ORDER BY l.orderIndex ASC, l.lessonNumber ASC")
    List<Lesson> findByLevelOrdered(@Param("level") String level);

    boolean existsByLevelAndLessonNumber(String level, Integer lessonNumber);
}
