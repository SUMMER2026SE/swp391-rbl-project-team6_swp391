package com.midori.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.entity.GrammarPattern;
import com.midori.entity.GrammarPatternStatus;
import com.midori.repository.GrammarPatternRepository;
import com.midori.service.GrammarImporterService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Reads all 5 Hanabira grammar JSON files (N1–N5) from
 * {@code classpath:dictionary/grammar/*.json} and imports them
 * into the {@code grammar_patterns} table.
 * <p>
 * Import is fully idempotent — existing patterns are skipped, manually
 * edited Vietnamese translations are never overwritten.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GrammarImporterServiceImpl implements GrammarImporterService {

    private static final String GRAMMAR_JSON_PATTERN = "classpath:dictionary/grammar/*.json";

    // Map: JLPT level keyword in filename → level string
    private static final Map<String, String> LEVEL_MAP = Map.of(
            "N1", "N1",
            "N2", "N2",
            "N3", "N3",
            "N4", "N4",
            "N5", "N5"
    );

    private final GrammarPatternRepository grammarPatternRepository;
    private final ObjectMapper objectMapper;

    /**
     * Automatically runs once on application startup.
     * Safe to run multiple times — already-imported patterns are skipped.
     */
    @PostConstruct
    public void autoImportOnStartup() {
        try {
            int count = importAll();
            if (count > 0) {
                log.info("[GrammarImporter] Auto-import complete. {} new patterns imported.", count);
            } else {
                log.info("[GrammarImporter] Auto-import: all patterns already up to date.");
            }
        } catch (Exception e) {
            log.error("[GrammarImporter] Auto-import failed: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public int importAll() {
        int totalImported = 0;

        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources(GRAMMAR_JSON_PATTERN);

            if (resources.length == 0) {
                log.warn("[GrammarImporter] No grammar JSON files found at: {}", GRAMMAR_JSON_PATTERN);
                return 0;
            }

            log.info("[GrammarImporter] Found {} grammar JSON file(s). Starting import...", resources.length);

            for (Resource resource : resources) {
                String filename = resource.getFilename();
                String jlptLevel = extractJlptLevel(filename);
                log.info("[GrammarImporter] Processing file: {} (level={})", filename, jlptLevel);

                int imported = importFromResource(resource, jlptLevel);
                totalImported += imported;
                log.info("[GrammarImporter] {} → {} new patterns imported.", filename, imported);
            }

        } catch (Exception e) {
            log.error("[GrammarImporter] Failed to import grammar patterns: {}", e.getMessage(), e);
        }

        return totalImported;
    }

    private int importFromResource(Resource resource, String jlptLevel) {
        int count = 0;

        try (InputStream is = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(is);

            if (!root.isArray()) {
                log.warn("[GrammarImporter] {} is not a JSON array, skipping.", resource.getFilename());
                return 0;
            }

            for (JsonNode node : root) {
                try {
                    count += importEntry(node, jlptLevel);
                } catch (Exception e) {
                    log.warn("[GrammarImporter] Error parsing grammar entry in {}: {}",
                            resource.getFilename(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("[GrammarImporter] Failed to read {}: {}", resource.getFilename(), e.getMessage());
        }

        return count;
    }

    private int importEntry(JsonNode node, String jlptLevel) {
        String title = getText(node, "title");
        if (title == null || title.isBlank()) {
            return 0;
        }

        // Use the full title as the pattern key for deduplication
        String pattern = title.trim();

        // Skip if already imported — idempotent
        if (grammarPatternRepository.existsByPattern(pattern)) {
            return 0;
        }

        String meaningEn = getText(node, "short_explanation");
        String descriptionEn = getText(node, "long_explanation");
        String structure = getText(node, "formation");

        // Extract first example
        String exampleJp = null;
        String exampleEn = null;
        JsonNode examples = node.get("examples");
        if (examples != null && examples.isArray() && examples.size() > 0) {
            JsonNode first = examples.get(0);
            exampleJp = getText(first, "jp");
            exampleEn = getText(first, "en");
        }

        GrammarPattern gp = GrammarPattern.builder()
                .pattern(pattern)
                .jlptLevel(jlptLevel)
                .meaningEn(meaningEn)
                .descriptionEn(descriptionEn)
                .structure(structure)
                .exampleJapanese(exampleJp)
                .exampleEnglish(exampleEn)
                .status(GrammarPatternStatus.PENDING_TRANSLATION)
                .build();

        grammarPatternRepository.save(gp);
        return 1;
    }

    private String extractJlptLevel(String filename) {
        if (filename == null) return null;
        for (Map.Entry<String, String> entry : LEVEL_MAP.entrySet()) {
            if (filename.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String getText(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode val = node.get(field);
        return (val != null && !val.isNull()) ? val.asText().trim() : null;
    }
}
