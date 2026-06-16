package com.midori.repository;

import com.midori.entity.ListeningLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ListeningLessonRepository extends JpaRepository<ListeningLesson, UUID> {
    List<ListeningLesson> findByStatus(String status);
    List<ListeningLesson> findAllByLevel(String level);
    List<ListeningLesson> findAllByLevelAndStatus(String level, String status);
    List<ListeningLesson> findAllByTeacherId(UUID teacherId);
    List<ListeningLesson> findAllByTeacherIdAndLevel(UUID teacherId, String level);
    List<ListeningLesson> findAllByTeacherIdAndStatus(UUID teacherId, String status);
    List<ListeningLesson> findAllByTeacherIdAndLevelAndStatus(UUID teacherId, String level, String status);
    long countByStatus(String status);
}
