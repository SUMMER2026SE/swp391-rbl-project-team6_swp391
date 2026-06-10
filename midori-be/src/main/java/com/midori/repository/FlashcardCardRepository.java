package com.midori.repository;

import com.midori.entity.FlashcardCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FlashcardCardRepository extends JpaRepository<FlashcardCard, UUID> {

    Optional<FlashcardCard> findById(UUID id);

    @Query("SELECT fc FROM FlashcardCard fc LEFT JOIN FETCH fc.flashcardSet fs LEFT JOIN FETCH fs.teacher WHERE fc.id = :id")
    Optional<FlashcardCard> findByIdWithSetAndTeacher(@Param("id") UUID id);

    List<FlashcardCard> findAllByFlashcardSetIdOrderByOrderIndexAsc(UUID setId);

    @Modifying
    @Query("DELETE FROM FlashcardCard fc WHERE fc.flashcardSet.id = :setId")
    void deleteAllBySetId(@Param("setId") UUID setId);

    long countByFlashcardSetId(UUID setId);
}
