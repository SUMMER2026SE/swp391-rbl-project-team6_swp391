package com.midori.repository;

import com.midori.entity.GrammarExample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrammarExampleRepository extends JpaRepository<GrammarExample, UUID> {

    Optional<GrammarExample> findById(UUID id);

    @Query("SELECT ge FROM GrammarExample ge WHERE ge.grammarContent.id = :contentId ORDER BY ge.exampleOrder ASC")
    List<GrammarExample> findByGrammarContentIdOrderByExampleOrderAsc(@Param("contentId") UUID contentId);

    @Query("SELECT ge FROM GrammarExample ge JOIN FETCH ge.grammarContent WHERE ge.id = :id")
    Optional<GrammarExample> findByIdWithContent(@Param("id") UUID id);

    boolean existsByGrammarContentIdAndExampleOrder(UUID grammarContentId, Integer exampleOrder);

    void deleteByGrammarContentId(UUID grammarContentId);

    long countByGrammarContentId(UUID grammarContentId);
}