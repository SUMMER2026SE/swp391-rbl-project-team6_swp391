package com.midori.repository;

import com.midori.entity.DictionaryMeaning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DictionaryMeaningRepository extends JpaRepository<DictionaryMeaning, UUID> {
    List<DictionaryMeaning> findByEntryId(UUID entryId);
}
