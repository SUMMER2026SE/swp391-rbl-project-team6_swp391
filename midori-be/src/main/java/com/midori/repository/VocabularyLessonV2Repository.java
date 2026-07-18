package com.midori.repository;

import com.midori.entity.VocabularyLessonV2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyLessonV2Repository extends JpaRepository<VocabularyLessonV2, UUID> {

    Optional<VocabularyLessonV2> findById(UUID id);

    @Query("SELECT vl FROM VocabularyLessonV2 vl LEFT JOIN FETCH vl.createdBy u LEFT JOIN FETCH u.profile WHERE vl.id = :id")
    Optional<VocabularyLessonV2> findByIdWithCreator(@Param("id") UUID id);

    @Query("SELECT vl FROM VocabularyLessonV2 vl LEFT JOIN FETCH vl.createdBy u LEFT JOIN FETCH u.profile ORDER BY vl.createdAt ASC")
    List<VocabularyLessonV2> findAllOrderedWithCreator();

    @Query("SELECT vl FROM VocabularyLessonV2 vl LEFT JOIN FETCH vl.createdBy u LEFT JOIN FETCH u.profile WHERE vl.isPublished = true ORDER BY vl.createdAt ASC")
    List<VocabularyLessonV2> findAllPublishedWithCreator();

    @Query("SELECT vl FROM VocabularyLessonV2 vl WHERE vl.isPublished = true ORDER BY vl.createdAt ASC")
    List<VocabularyLessonV2> findAllPublished();

    @Query("SELECT vl FROM VocabularyLessonV2 vl LEFT JOIN FETCH vl.createdBy u LEFT JOIN FETCH u.profile WHERE vl.isPublished = true AND vl.level = :level")
    List<VocabularyLessonV2> findAllPublishedByLevel(@Param("level") String level);

    @Query("SELECT vl FROM VocabularyLessonV2 vl LEFT JOIN FETCH vl.createdBy u LEFT JOIN FETCH u.profile WHERE vl.isPublished = true AND vl.topic = :topic")
    List<VocabularyLessonV2> findAllPublishedByTopic(@Param("topic") String topic);

    @Query("SELECT vl FROM VocabularyLessonV2 vl LEFT JOIN FETCH vl.createdBy u LEFT JOIN FETCH u.profile WHERE vl.isPublished = true AND vl.level = :level AND vl.topic = :topic")
    List<VocabularyLessonV2> findAllPublishedByLevelAndTopic(
            @Param("level") String level,
            @Param("topic") String topic);

    @Query("SELECT vl FROM VocabularyLessonV2 vl LEFT JOIN FETCH vl.createdBy u LEFT JOIN FETCH u.profile WHERE vl.isPublished = true AND " +
           "(LOWER(vl.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(vl.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<VocabularyLessonV2> searchPublished(@Param("search") String search);

    long countByIsPublished(Boolean isPublished);
}
