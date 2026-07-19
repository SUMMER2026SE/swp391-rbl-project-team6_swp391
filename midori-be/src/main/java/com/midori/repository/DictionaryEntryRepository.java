package com.midori.repository;

import com.midori.entity.DictionaryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

@Repository
public interface DictionaryEntryRepository extends JpaRepository<DictionaryEntry, UUID> {
    List<DictionaryEntry> findBySurface(String surface);
    List<DictionaryEntry> findByLemma(String lemma);
    List<DictionaryEntry> findByReading(String reading);

    @Query("SELECT de FROM DictionaryEntry de WHERE " +
           "EXISTS (SELECT m FROM DictionaryMeaning m WHERE m.entry = de AND m.language = 'en') AND " +
           "NOT EXISTS (SELECT m FROM DictionaryMeaning m WHERE m.entry = de AND m.language = 'vi')")
    List<DictionaryEntry> findEntriesNeedingTranslation(Pageable pageable);

    @Query("SELECT de FROM DictionaryEntry de LEFT JOIN FETCH de.meanings WHERE de.surface = :surface")
    List<DictionaryEntry> findBySurfaceWithMeanings(@Param("surface") String surface);

    @Query("SELECT de FROM DictionaryEntry de LEFT JOIN FETCH de.meanings WHERE de.lemma = :lemma")
    List<DictionaryEntry> findByLemmaWithMeanings(@Param("lemma") String lemma);

    @Query("SELECT de FROM DictionaryEntry de LEFT JOIN FETCH de.meanings WHERE de.reading = :reading")
    List<DictionaryEntry> findByReadingWithMeanings(@Param("reading") String reading);

    @Query("SELECT de FROM DictionaryEntry de WHERE de.surface LIKE CONCAT(:surface, '%') AND de.surface <> :surface")
    List<DictionaryEntry> findRelatedWords(@Param("surface") String surface, Pageable pageable);

    @Query(value = "SELECT DISTINCT de FROM DictionaryEntry de " +
           "LEFT JOIN de.meanings dm " +
           "WHERE de.surface LIKE CONCAT('%', :query, '%') " +
           "OR de.lemma LIKE CONCAT('%', :query, '%') " +
           "OR de.reading LIKE CONCAT('%', :query, '%') " +
           "OR de.romaji LIKE CONCAT('%', :query, '%') " +
           "OR dm.meaning LIKE CONCAT('%', :query, '%')",
           countQuery = "SELECT COUNT(DISTINCT de) FROM DictionaryEntry de " +
                        "LEFT JOIN de.meanings dm " +
                        "WHERE de.surface LIKE CONCAT('%', :query, '%') " +
                        "OR de.lemma LIKE CONCAT('%', :query, '%') " +
                        "OR de.reading LIKE CONCAT('%', :query, '%') " +
                        "OR de.romaji LIKE CONCAT('%', :query, '%') " +
                        "OR dm.meaning LIKE CONCAT('%', :query, '%')")
    Page<DictionaryEntry> search(@Param("query") String query, Pageable pageable);

    @Query("SELECT de FROM DictionaryEntry de " +
           "WHERE de.surface LIKE CONCAT(:query, '%') " +
           "OR de.reading LIKE CONCAT(:query, '%') " +
           "OR de.romaji LIKE CONCAT(:query, '%')")
    List<DictionaryEntry> autocomplete(@Param("query") String query, Pageable pageable);
}
