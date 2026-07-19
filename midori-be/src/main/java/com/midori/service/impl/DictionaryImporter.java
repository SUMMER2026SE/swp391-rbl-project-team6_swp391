package com.midori.service.impl;

import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.util.RomajiConverter;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

import com.midori.service.DictionaryCacheService;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionaryImporter {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final EntityManager entityManager;
    private final TransactionTemplate transactionTemplate;
    private final DictionaryCacheService cacheService;

    public void importDictionary(InputStream xmlInputStream) {
        long startTime = System.currentTimeMillis();
        log.info("Starting JMdict import process...");

        // 1. Load existing entries to support resume and skip duplicates
        log.info("Loading existing dictionary entries to memory...");
        List<DictionaryEntry> existing = dictionaryEntryRepository.findAll();
        Set<String> existingKeys = existing.stream()
                .map(e -> getUniqueKey(e.getSurface(), e.getReading()))
                .collect(Collectors.toCollection(HashSet::new));
        log.info("Loaded {} existing unique entries.", existingKeys.size());

        int imported = 0;
        int skipped = 0;
        int failed = 0;

        List<DictionaryEntry> batch = new ArrayList<>();
        int batchSize = 1000;

        try {
            XMLInputFactory factory = XMLInputFactory.newInstance();
            factory.setProperty(XMLInputFactory.SUPPORT_DTD, true);
            factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);
            factory.setProperty(XMLInputFactory.IS_REPLACING_ENTITY_REFERENCES, true);

            // Set up resolver to bypass external DTD loading while allowing local definitions
            factory.setXMLResolver((publicId, systemId, baseURI, namespace) -> 
                new java.io.ByteArrayInputStream("".getBytes())
            );

            XMLStreamReader reader = factory.createXMLStreamReader(xmlInputStream);

            // Parsing state
            String currentTag = "";
            List<String> kebs = new ArrayList<>();
            List<String> rebs = new ArrayList<>();
            List<Sense> senses = new ArrayList<>();
            Sense currentSense = null;

            while (reader.hasNext()) {
                int event = reader.next();

                switch (event) {
                    case XMLStreamConstants.START_ELEMENT:
                        currentTag = reader.getLocalName();
                        if ("entry".equals(currentTag)) {
                            kebs.clear();
                            rebs.clear();
                            senses.clear();
                        } else if ("sense".equals(currentTag)) {
                            currentSense = new Sense();
                        } else if ("gloss".equals(currentTag) && currentSense != null) {
                            String lang = reader.getAttributeValue("http://www.w3.org/XML/1998/namespace", "lang");
                            if (lang == null) {
                                lang = "eng"; // default
                            }
                            currentSense.glossLangs.add(lang);
                        }
                        break;

                    case XMLStreamConstants.CHARACTERS:
                        String text = reader.getText().trim();
                        if (text.isEmpty()) {
                            break;
                        }
                        if ("keb".equals(currentTag)) {
                            kebs.add(text);
                        } else if ("reb".equals(currentTag)) {
                            rebs.add(text);
                        } else if ("pos".equals(currentTag) && currentSense != null) {
                            currentSense.posList.add(text);
                        } else if ("gloss".equals(currentTag) && currentSense != null) {
                            currentSense.glosses.add(text);
                        }
                        break;

                    case XMLStreamConstants.END_ELEMENT:
                        String endTag = reader.getLocalName();
                        currentTag = ""; // reset tag name
                        if ("sense".equals(endTag)) {
                            if (currentSense != null) {
                                senses.add(currentSense);
                                currentSense = null;
                            }
                        } else if ("entry".equals(endTag)) {
                            try {
                                boolean success = processEntry(kebs, rebs, senses, existingKeys, batch, batchSize);
                                if (success) {
                                    imported++;
                                    if (imported % 1000 == 0) {
                                        log.info("Imported {} entries", imported);
                                        System.out.println("Imported " + imported + " entries");
                                    }
                                } else {
                                    skipped++;
                                }
                            } catch (Exception ex) {
                                failed++;
                                log.error("Failed to process entry: " + ex.getMessage(), ex);
                            }
                        }
                        break;
                }
            }

            reader.close();

            // Flush remaining entries in the final batch
            if (!batch.isEmpty()) {
                saveBatch(batch);
                batch.clear();
            }

            // Invalidate cache since dictionary has updated
            cacheService.evictAll("dictionary:*");

        } catch (Exception e) {
            log.error("JMdict streaming import encountered an error: " + e.getMessage(), e);
            failed++;
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("JMdict import completed.");
        log.info("Imported: {}", imported);
        log.info("Skipped: {}", skipped);
        log.info("Failed: {}", failed);
        log.info("Duration: {} ms", duration);

        System.out.println("Imported: " + imported);
        System.out.println("Skipped: " + skipped);
        System.out.println("Failed: " + failed);
        System.out.println("Duration: " + duration + " ms");
    }

    private boolean processEntry(List<String> kebs, List<String> rebs, List<Sense> senses,
                                 Set<String> existingKeys, List<DictionaryEntry> batch, int batchSize) {
        // Resolve surface and reading
        String rawSurface = !kebs.isEmpty() ? kebs.get(0) : (!rebs.isEmpty() ? rebs.get(0) : null);
        String rawReading = !rebs.isEmpty() ? rebs.get(0) : null;

        if (rawSurface == null) {
            return false; // Skip if no word found
        }

        String surface = normalizeString(rawSurface);
        String reading = normalizeString(rawReading);

        // Resume & duplicate check
        String key = getUniqueKey(surface, reading);
        if (existingKeys.contains(key)) {
            return false;
        }
        existingKeys.add(key);

        // Normalize lemma, romaji and part of speech
        String lemma = surface; // lemma maps to surface base form
        String romaji = normalizeString(RomajiConverter.convert(reading != null ? reading : surface));

        // Aggregate unique parts of speech across all senses
        Set<String> posSet = new LinkedHashSet<>();
        for (Sense s : senses) {
            for (String pos : s.posList) {
                posSet.add(normalizeString(pos));
            }
        }
        String partOfSpeech = posSet.isEmpty() ? null : String.join(", ", posSet);

        // Build Entry
        DictionaryEntry entry = DictionaryEntry.builder()
                .surface(surface)
                .lemma(lemma)
                .reading(reading)
                .romaji(romaji)
                .partOfSpeech(partOfSpeech)
                .jlptLevel(null) // Not present in JMdict
                .frequency(null)
                .meanings(new ArrayList<>())
                .examples(new ArrayList<>())
                .build();

        // Add Meanings (from glosses)
        int sortOrder = 0;
        for (Sense s : senses) {
            for (int i = 0; i < s.glosses.size(); i++) {
                String gloss = s.glosses.get(i);
                String lang = s.glossLangs.get(i);
                String normLang = "eng".equalsIgnoreCase(lang) ? "en" : normalizeString(lang);
                if (normLang == null) normLang = "en";

                DictionaryMeaning meaning = DictionaryMeaning.builder()
                        .entry(entry)
                        .language(normLang)
                        .meaning(normalizeString(gloss))
                        .sortOrder(sortOrder++)
                        .build();

                entry.getMeanings().add(meaning);
            }
        }

        batch.add(entry);

        if (batch.size() >= batchSize) {
            saveBatch(batch);
            batch.clear();
        }

        return true;
    }

    /**
     * Bulk import optimized for large JMdict files (~180k entries)
     * Uses direct JDBC batch insert for performance
     */
    public BulkImportResult bulkImportJMdict(InputStream xmlInputStream) {
        long startTime = System.currentTimeMillis();
        log.info("Starting JMdict bulk import (optimized for ~180k entries)...");
        System.out.println("Starting JMdict bulk import...");

        int imported = 0;
        int skipped = 0;
        int failed = 0;

        List<DictionaryEntry> entryBatch = new ArrayList<>();
        List<Object[]> meaningBatch = new ArrayList<>();
        int batchSize = 500;

        try {
            System.setProperty("jdk.xml.entityExpansionLimit", "0");
            XMLInputFactory factory = XMLInputFactory.newInstance();
            factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
            factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);

            XMLStreamReader reader = factory.createXMLStreamReader(xmlInputStream);

            String currentTag = "";
            List<String> kebs = new ArrayList<>();
            List<String> rebs = new ArrayList<>();
            List<String> posList = new ArrayList<>();
            List<String> glosses = new ArrayList<>();
            UUID currentEntryId = null;

            while (reader.hasNext()) {
                int event = reader.next();

                switch (event) {
                    case XMLStreamConstants.START_ELEMENT:
                        currentTag = reader.getLocalName();
                        if ("entry".equals(currentTag)) {
                            kebs.clear();
                            rebs.clear();
                            posList.clear();
                            glosses.clear();
                        } else if ("gloss".equals(currentTag)) {
                            // Keep track of glosses
                        }
                        break;

                    case XMLStreamConstants.CHARACTERS:
                        String text = reader.getText().trim();
                        if (text.isEmpty()) break;

                        switch (currentTag) {
                            case "keb":
                                kebs.add(text);
                                break;
                            case "reb":
                                rebs.add(text);
                                break;
                            case "pos":
                                if (!posList.contains(text)) posList.add(text);
                                break;
                            case "gloss":
                                if (!glosses.contains(text) && glosses.size() < 10) {
                                    glosses.add(text);
                                }
                                break;
                        }
                        break;

                    case XMLStreamConstants.END_ELEMENT:
                        String endTag = reader.getLocalName();
                        if ("entry".equals(endTag)) {
                            if (!rebs.isEmpty() && !glosses.isEmpty()) {
                                String surface = kebs.isEmpty() ? rebs.get(0) : kebs.get(0);
                                String reading = rebs.isEmpty() ? null : rebs.get(0);
                                String partOfSpeech = posList.isEmpty() ? null : String.join(", ", posList);
                                String romaji = reading != null ? RomajiConverter.convert(reading) : null;

                                DictionaryEntry entry = DictionaryEntry.builder()
                                        .surface(surface)
                                        .lemma(surface)
                                        .reading(reading)
                                        .romaji(romaji)
                                        .partOfSpeech(partOfSpeech)
                                        .build();

                                entryBatch.add(entry);

                                int sortOrder = 0;
                                for (String gloss : glosses) {
                                    meaningBatch.add(new Object[]{null, "en", gloss, sortOrder++});
                                }

                                if (entryBatch.size() >= batchSize) {
                                    saveBulkBatch(entryBatch, meaningBatch);
                                    imported += entryBatch.size();
                                    entryBatch.clear();
                                    meaningBatch.clear();
                                    if (imported % 10000 == 0) {
                                        log.info("Bulk imported {} entries...", imported);
                                        System.out.println("Bulk imported: " + imported);
                                    }
                                }
                            } else {
                                skipped++;
                            }
                        }
                        currentTag = "";
                        break;
                }
            }

            reader.close();

            if (!entryBatch.isEmpty()) {
                saveBulkBatch(entryBatch, meaningBatch);
                imported += entryBatch.size();
            }

            cacheService.evictAll("dictionary:*");

        } catch (Exception e) {
            log.error("JMdict bulk import error: {}", e.getMessage(), e);
            e.printStackTrace();
            failed++;
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("JMdict bulk import completed!");
        log.info("Imported: {}, Skipped: {}, Failed: {}", imported, skipped, failed);
        log.info("Duration: {} ms ({} minutes)", duration, duration / 60000);

        System.out.println("JMdict bulk import completed!");
        System.out.println("Imported: " + imported);
        System.out.println("Skipped: " + skipped);
        System.out.println("Failed: " + failed);
        System.out.println("Duration: " + (duration / 60000) + " minutes");

        return new BulkImportResult(imported, skipped, failed, duration);
    }

    @Transactional
    protected void saveBulkBatch(List<DictionaryEntry> entries, List<Object[]> meanings) {
        for (DictionaryEntry entry : entries) {
            entityManager.persist(entry);
            if (entries.indexOf(entry) % 50 == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();

        for (Object[] m : meanings) {
            DictionaryMeaning meaning = DictionaryMeaning.builder()
                    .language((String) m[1])
                    .meaning((String) m[2])
                    .sortOrder((Integer) m[3])
                    .build();
            entityManager.persist(meaning);
        }
        entityManager.flush();
        entityManager.clear();
    }

    public record BulkImportResult(int imported, int skipped, int failed, long durationMs) {}

    private void saveBatch(List<DictionaryEntry> batchList) {
        transactionTemplate.execute(status -> {
            for (DictionaryEntry entry : batchList) {
                dictionaryEntryRepository.save(entry);
            }
            entityManager.flush();
            entityManager.clear();
            return null;
        });
    }

    private String getUniqueKey(String surface, String reading) {
        return (surface != null ? surface : "") + "|" + (reading != null ? reading : "");
    }

    private String normalizeString(String val) {
        if (val == null) {
            return null;
        }
        String trimmed = val.trim().replaceAll("\\s+", " ");
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static class Sense {
        List<String> posList = new ArrayList<>();
        List<String> glosses = new ArrayList<>();
        List<String> glossLangs = new ArrayList<>();
    }
}
