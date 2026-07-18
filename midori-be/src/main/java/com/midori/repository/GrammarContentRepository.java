package com.midori.repository;

import com.midori.entity.GrammarContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrammarContentRepository extends JpaRepository<GrammarContent, UUID> {

    Optional<GrammarContent> findById(UUID id);

    @Query("SELECT gc FROM GrammarContent gc WHERE gc.grammarLesson.id = :lessonId ORDER BY gc.contentOrder ASC")
    List<GrammarContent> findByGrammarLessonIdOrderByContentOrderAsc(@Param("lessonId") UUID lessonId);

    @Query("SELECT gc FROM GrammarContent gc JOIN FETCH gc.grammarLesson WHERE gc.id = :id")
    Optional<GrammarContent> findByIdWithLesson(@Param("id") UUID id);

    boolean existsByGrammarLessonIdAndContentOrder(UUID grammarLessonId, Integer contentOrder);

    void deleteByGrammarLessonId(UUID grammarLessonId);

    long countByGrammarLessonId(UUID grammarLessonId);
}