package com.midori.repository;

import com.midori.entity.ListeningLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ListeningLessonRepository extends JpaRepository<ListeningLesson, UUID> {
    List<ListeningLesson> findByStatus(String status);
    List<ListeningLesson> findByLevelId(UUID levelId);
    List<ListeningLesson> findByLevelIdAndStatus(UUID levelId, String status);
}
