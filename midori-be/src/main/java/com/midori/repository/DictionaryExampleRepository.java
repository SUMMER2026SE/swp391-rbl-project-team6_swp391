package com.midori.repository;

import com.midori.entity.DictionaryExample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DictionaryExampleRepository extends JpaRepository<DictionaryExample, UUID> {
    List<DictionaryExample> findByEntryId(UUID entryId);
}
