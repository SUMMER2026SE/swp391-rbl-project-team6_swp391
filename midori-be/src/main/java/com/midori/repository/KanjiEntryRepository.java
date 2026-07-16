package com.midori.repository;

import com.midori.entity.KanjiEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KanjiEntryRepository extends JpaRepository<KanjiEntry, UUID> {
    Optional<KanjiEntry> findByCharacter(String character);
    boolean existsByCharacter(String character);
    List<KanjiEntry> findBySvgFileIsNull();
}
