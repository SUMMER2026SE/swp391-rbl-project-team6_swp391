package com.midori.repository;

import com.midori.entity.ListeningQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ListeningQuestionRepository extends JpaRepository<ListeningQuestion, UUID> {

    Optional<ListeningQuestion> findById(UUID id);

    @Query("SELECT lq FROM ListeningQuestion lq WHERE lq.listeningLesson.id = :lessonId ORDER BY lq.questionOrder ASC")
    List<ListeningQuestion> findByListeningLessonIdOrderByQuestionOrderAsc(@Param("lessonId") UUID lessonId);

    @Query("SELECT lq FROM ListeningQuestion lq JOIN FETCH lq.listeningLesson WHERE lq.id = :id")
    Optional<ListeningQuestion> findByIdWithLesson(@Param("id") UUID id);

    boolean existsByListeningLessonIdAndQuestionOrder(UUID listeningLessonId, Integer questionOrder);

    void deleteByListeningLessonId(UUID listeningLessonId);

    long countByListeningLessonId(UUID listeningLessonId);
}
