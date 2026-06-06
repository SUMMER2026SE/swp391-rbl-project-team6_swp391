package com.midori.repository;

import com.midori.entity.VocabularyWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyWordRepository extends JpaRepository<VocabularyWord, UUID> {

    Optional<VocabularyWord> findById(UUID id);

    @Query("SELECT vw FROM VocabularyWord vw WHERE vw.lesson.id = :lessonId ORDER BY vw.displayOrder ASC")
    List<VocabularyWord> findByLessonIdOrderByDisplayOrderAsc(@Param("lessonId") UUID lessonId);

    long countByLessonId(UUID lessonId);
}
