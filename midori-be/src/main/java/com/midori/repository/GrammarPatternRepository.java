package com.midori.repository;

import com.midori.entity.GrammarPattern;
import com.midori.entity.GrammarPatternStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrammarPatternRepository extends JpaRepository<GrammarPattern, UUID> {

    Optional<GrammarPattern> findByPattern(String pattern);

    boolean existsByPattern(String pattern);

    List<GrammarPattern> findByJlptLevel(String jlptLevel);

    List<GrammarPattern> findByStatus(GrammarPatternStatus status);

    long countByStatus(GrammarPatternStatus status);

    @Query("SELECT g FROM GrammarPattern g ORDER BY g.jlptLevel ASC, g.pattern ASC")
    List<GrammarPattern> findAllOrdered();
}
