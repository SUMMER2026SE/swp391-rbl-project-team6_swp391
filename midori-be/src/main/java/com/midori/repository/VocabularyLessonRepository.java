package com.midori.repository;

import com.midori.entity.VocabularyLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyLessonRepository extends JpaRepository<VocabularyLesson, UUID>, JpaSpecificationExecutor<VocabularyLesson> {

    Optional<VocabularyLesson> findById(UUID id);

    @Query("SELECT vl FROM VocabularyLesson vl WHERE vl.isPublished = true")
    List<VocabularyLesson> findAllPublished();

    @Query("SELECT vl FROM VocabularyLesson vl WHERE vl.isPublished = true AND vl.level = :level")
    List<VocabularyLesson> findAllPublishedByLevel(@Param("level") String level);

    @Query("SELECT vl FROM VocabularyLesson vl WHERE vl.isPublished = true AND vl.topic = :topic")
    List<VocabularyLesson> findAllPublishedByTopic(@Param("topic") String topic);

    @Query("SELECT vl FROM VocabularyLesson vl WHERE vl.isPublished = true AND vl.level = :level AND vl.topic = :topic")
    List<VocabularyLesson> findAllPublishedByLevelAndTopic(
            @Param("level") String level,
            @Param("topic") String topic);

    @Query("SELECT vl FROM VocabularyLesson vl WHERE vl.isPublished = true AND " +
           "(LOWER(vl.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(vl.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<VocabularyLesson> searchPublished(@Param("search") String search);
}
