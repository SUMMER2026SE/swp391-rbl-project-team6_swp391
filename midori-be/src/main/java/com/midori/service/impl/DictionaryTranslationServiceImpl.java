package com.midori.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.repository.DictionaryMeaningRepository;
import com.midori.service.DictionaryTranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;
import java.util.stream.Collectors;

import com.midori.service.DictionaryCacheService;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionaryTranslationServiceImpl implements DictionaryTranslationService {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final DictionaryMeaningRepository dictionaryMeaningRepository;
    private final AiCoreService aiCoreService;
    private final TransactionTemplate transactionTemplate;
    private final DictionaryCacheService cacheService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public int translatePendingEntries(int limit) {
        if (limit <= 0) {
            return 0;
        }

        // 1. Fetch entries needing translation
        List<DictionaryEntry> entries = dictionaryEntryRepository.findEntriesNeedingTranslation(PageRequest.of(0, limit));
        if (entries.isEmpty()) {
            return 0;
        }

        log.info("Found {} dictionary entries needing translation.", entries.size());

        // 2. Build the JSON input for Gemini
        List<Map<String, Object>> inputList = new ArrayList<>();
        Map<String, DictionaryEntry> entryMap = new HashMap<>();

        for (DictionaryEntry entry : entries) {
            entryMap.put(entry.getId().toString(), entry);
            
            List<String> englishMeanings = entry.getMeanings().stream()
                    .filter(m -> "en".equalsIgnoreCase(m.getLanguage()))
                    .sorted(Comparator.comparingInt(DictionaryMeaning::getSortOrder))
                    .map(DictionaryMeaning::getMeaning)
                    .collect(Collectors.toList());

            Map<String, Object> item = new HashMap<>();
            item.put("id", entry.getId().toString());
            item.put("surface", entry.getSurface());
            item.put("meanings", englishMeanings);
            inputList.add(item);
        }

        String inputJson;
        try {
            inputJson = objectMapper.writeValueAsString(inputList);
        } catch (Exception e) {
            log.error("Failed to serialize translation inputs to JSON", e);
            return 0;
        }

        // 3. Build the system prompt
        String systemPrompt = "You are an expert Japanese-Vietnamese dictionary translator. " +
                "Translate the provided English meanings of Japanese words into Vietnamese meanings. " +
                "Keep the translations natural, concise, and accurate to the original word. " +
                "Format your output as a raw JSON object containing a 'translations' field, which is an array of objects. " +
                "Each object must have 'id' (the entry ID) and 'translations' (a list of strings representing the translated Vietnamese meanings in the exact order as the input). " +
                "Example output format:\n" +
                "{\n" +
                "  \"translations\": [\n" +
                "    {\n" +
                "      \"id\": \"some-uuid-1\",\n" +
                "      \"translations\": [\"xin chào\", \"chào buổi sáng\"]\n" +
                "    }\n" +
                "  ]\n" +
                "}\n" +
                "Never include any markdown formatting (like ```json ... ```) or explanation. Return raw JSON text only.";

        // 4. Invoke AI core chat with retry mechanism
        String response = null;
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.info("Sending translation batch to Gemini (Attempt {}/{})...", attempt, maxRetries);
                response = aiCoreService.chat(systemPrompt, inputJson, Collections.emptyList());
                if (response != null && !response.trim().isEmpty()) {
                    break;
                }
            } catch (Exception e) {
                log.warn("Translation attempt {} failed: {}", attempt, e.getMessage());
                if (attempt == maxRetries) {
                    log.error("All translation retry attempts failed.");
                    return 0;
                }
                try {
                    Thread.sleep(1000L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return 0;
                }
            }
        }

        if (response == null || response.trim().isEmpty()) {
            log.error("Received empty response from AI translator.");
            return 0;
        }

        // 5. Parse and save translations
        String cleanedJson = cleanJsonString(response);
        int successCount = 0;

        try {
            JsonNode rootNode = objectMapper.readTree(cleanedJson);
            JsonNode translationsArray = rootNode.get("translations");
            if (translationsArray == null || !translationsArray.isArray()) {
                log.error("Invalid response format: 'translations' array not found. Cleaned response: {}", cleanedJson);
                return 0;
            }

            List<DictionaryMeaning> meaningsToSave = new ArrayList<>();

            for (JsonNode item : translationsArray) {
                String idStr = item.has("id") ? item.get("id").asText() : null;
                JsonNode transListNode = item.get("translations");

                if (idStr == null || transListNode == null || !transListNode.isArray()) {
                    continue;
                }

                DictionaryEntry entry = entryMap.get(idStr);
                if (entry == null) {
                    continue;
                }

                int sortOrder = 0;
                for (JsonNode transNode : transListNode) {
                    String meaningText = transNode.asText().trim();
                    if (!meaningText.isEmpty()) {
                        DictionaryMeaning meaning = DictionaryMeaning.builder()
                                .entry(entry)
                                .language("vi")
                                .meaning(meaningText)
                                .sortOrder(sortOrder++)
                                .build();
                        meaningsToSave.add(meaning);
                    }
                }
                successCount++;
            }

            // Save in a transaction block
            if (!meaningsToSave.isEmpty()) {
                transactionTemplate.execute(status -> {
                    for (DictionaryMeaning meaning : meaningsToSave) {
                        dictionaryMeaningRepository.save(meaning);
                    }
                    return null;
                });
                log.info("Successfully translated and saved {} entries ({} total meanings).", successCount, meaningsToSave.size());

                // Evict cache for all updated entries
                for (DictionaryMeaning meaning : meaningsToSave) {
                    if (meaning.getEntry() != null) {
                        String word = meaning.getEntry().getSurface();
                        if (word != null) {
                            cacheService.evict("dictionary:hover:" + word);
                            cacheService.evict("dictionary:detail:" + word);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("Failed to parse and save translations. Cleaned JSON: " + cleanedJson, e);
            return 0;
        }

        return successCount;
    }

    private String cleanJsonString(String response) {
        if (response == null) return "";
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }
}
