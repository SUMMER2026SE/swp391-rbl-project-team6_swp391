package com.midori.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.dto.dictionary.*;
import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.entity.StudentSavedWord;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.repository.StudentSavedWordRepository;
import com.midori.service.DictionaryCacheService;
import com.midori.service.StudentDictionaryService;
import com.midori.util.CurrentUserProvider;
import com.midori.util.JapaneseFormConverter;
import com.midori.util.RomajiConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Student-facing dictionary service with AI fallback.
 * Priority: Database → AI fallback
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudentDictionaryServiceImpl implements StudentDictionaryService {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final StudentSavedWordRepository studentSavedWordRepository;
    private final DictionaryCacheService cacheService;
    private final AiCoreService aiCoreService;
    private final CurrentUserProvider currentUserProvider;
    private final LocalDictionaryRegistry localDictionaryRegistry;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String LOOKUP_CACHE_PREFIX = "student:dict:lookup:";
    private static final String WORD_CACHE_PREFIX = "student:dict:word:";
    private static final String SENTENCE_CACHE_PREFIX = "student:dict:sentence:";
    private static final long CACHE_TTL_HOURS = 24;

    // ============================================================
    // Full Dictionary Lookup (New Comprehensive Method)
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public DictionaryLookupResponse lookupWordFull(DictionaryLookupRequest request) {
        if (request == null || request.getWord() == null || request.getWord().trim().isEmpty()) {
            return createEmptyLookupResponse(request != null ? request.getWord() : "");
        }

        String targetWord = request.getWord().trim();
        String surface = request.getSurface() != null ? request.getSurface().trim() : targetWord;
        String sentence = request.getSentence();
        
        // Build cache key including context for better caching
        String cacheKey = LOOKUP_CACHE_PREFIX + surface + ":" + 
                (sentence != null ? sentence.hashCode() : "none");

        return cacheService.getOrFetch(cacheKey, DictionaryLookupResponse.class, () -> {
            // 1. Try database lookup — JMdict (English meanings included as fallback)
            DictionaryLookupResponse dbResult = lookupFromDatabaseFull(targetWord, surface, sentence);
            if (dbResult != null && hasValidMeaning(dbResult)) {
                dbResult.setFromCache(false);
                dbResult.setFromAi(false);

                // Check if word is saved by user
                checkSavedStatus(dbResult);

                log.debug("Word '{}' found in database ({} meanings)", targetWord,
                        dbResult.getMeanings() != null ? dbResult.getMeanings().size() : 0);
                return dbResult;
            }

            // 2. Phrase fallback: try shorter sub-strings (right-to-left longest match)
            DictionaryLookupResponse phraseResult = lookupPhraseFallback(targetWord, sentence);
            if (phraseResult != null && hasValidMeaning(phraseResult)) {
                phraseResult.setFromCache(false);
                phraseResult.setFromAi(false);
                checkSavedStatus(phraseResult);
                log.debug("Phrase '{}' matched as sub-word '{}'", targetWord, phraseResult.getSurface());
                return phraseResult;
            }

            // 3. Try local XML dictionary lookup (JMdict.xml in RAM)
            List<LocalDictionaryRegistry.LocalEntry> localEntries = localDictionaryRegistry.lookup(targetWord);
            if (localEntries.isEmpty() && !surface.equals(targetWord)) {
                localEntries = localDictionaryRegistry.lookup(surface);
            }
            if (!localEntries.isEmpty()) {
                LocalDictionaryRegistry.LocalEntry localEntry = localEntries.get(0);
                DictionaryLookupResponse localResult = DictionaryLookupResponse.builder()
                        .surface(localEntry.getSurface())
                        .dictionaryForm(localEntry.getSurface())
                        .reading(localEntry.getReading())
                        .romaji(localEntry.getReading() != null ? RomajiConverter.convert(localEntry.getReading()) : RomajiConverter.convert(localEntry.getSurface()))
                        .jlpt("N3")
                        .wordType(localEntry.getPartOfSpeech())
                        .meanings(localEntry.getMeanings())
                        .primaryMeaning(localEntry.getMeanings().isEmpty() ? "" : localEntry.getMeanings().get(0))
                        .contextMeaning("")
                        .contextExplanation("")
                        .fromCache(false)
                        .fromAi(false)
                        .build();
                checkSavedStatus(localResult);
                log.debug("Word '{}' found in local XML dictionary memory ({} meanings)", targetWord, localEntry.getMeanings().size());
                return localResult;
            }

            // 4. DB had no meanings at all — return graceful empty response without AI
            log.debug("Word '{}' not in database or local XML dictionary, returning empty response", targetWord);
            return createEmptyLookupResponse(targetWord);
        }, CACHE_TTL_HOURS, TimeUnit.HOURS);
    }

private DictionaryLookupResponse lookupFromDatabaseFull(String word, String surface, String sentence) {
        // Try surface form first, then lemma, then reading
        List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurfaceWithMeanings(surface);

        if (entries.isEmpty()) {
            entries = dictionaryEntryRepository.findByLemmaWithMeanings(word);
        }

        if (entries.isEmpty()) {
            entries = dictionaryEntryRepository.findByReadingWithMeanings(word);
        }

        if (entries.isEmpty()) {
            return null;
        }

        DictionaryEntry entry = entries.get(0);

            // Get all meanings grouped by language
            List<String> viMeanings = new ArrayList<>();
            List<String> enMeanings = new ArrayList<>();

            for (DictionaryMeaning m : entry.getMeanings()) {
                if ("vi".equalsIgnoreCase(m.getLanguage())) {
                    viMeanings.add(m.getMeaning());
                } else if ("en".equalsIgnoreCase(m.getLanguage())) {
                    enMeanings.add(m.getMeaning());
                }
            }

            // Use Vietnamese if available, otherwise fall back to English
            List<String> sortedViMeanings = viMeanings.isEmpty() ? enMeanings : viMeanings;

        // Build grammar forms if it's a verb or adjective
        DictionaryLookupResponse.GrammarForms forms = buildGrammarForms(
                entry.getSurface(),
                entry.getReading(),
                entry.getPartOfSpeech()
        );

        // Build examples
        List<DictionaryLookupResponse.WordExample> examples = entry.getExamples().stream()
                .limit(3)
                .map(ex -> DictionaryLookupResponse.WordExample.builder()
                        .japanese(ex.getJapanese())
                        .reading(ex.getReading() != null ? ex.getReading() : "")
                        .vietnamese(ex.getTranslation())
                        .english("")
                        .highlightStart(0)
                        .highlightEnd(0)
                        .build())
                .collect(Collectors.toList());

        return DictionaryLookupResponse.builder()
                .surface(entry.getSurface())
                .dictionaryForm(entry.getLemma() != null ? entry.getLemma() : entry.getSurface())
                .reading(entry.getReading() != null ? entry.getReading() : entry.getSurface())
                .romaji(entry.getRomaji() != null ? entry.getRomaji() : RomajiConverter.convert(entry.getSurface()))
                .jlpt(entry.getJlptLevel())
                .wordType(entry.getPartOfSpeech())
                .pitchAccent(null) // Not in DB yet
                .meanings(sortedViMeanings)
                .primaryMeaning(sortedViMeanings.isEmpty() ? "" : sortedViMeanings.get(0))
                .contextMeaning("")
                .contextExplanation("")
                .forms(forms)
                .examples(examples)
                .audioUrl(null)
                .hasAudio(false)
                .saved(false)
                .saveId(null)
                .fromCache(true)
                .fromAi(false)
                .build();
    }

    /**
     * Phrase fallback: when the whole phrase is not in the DB, try shorter
     * right-aligned substrings to find the longest meaningful token.
     * Example: "みなさんこんにちは" -> try "みなさんこんにち" -> "みなさんこん" -> ... -> "みなさん" -> "こんにち" -> ...
     */
    private DictionaryLookupResponse lookupPhraseFallback(String originalPhrase, String sentence) {
        if (originalPhrase == null || originalPhrase.trim().isEmpty()) {
            return null;
        }

        String phrase = originalPhrase.trim();
        if (phrase.length() < 2) {
            return null;
        }

        List<DictionaryLookupResponse> matchedParts = new ArrayList<>();
        int i = 0;
        int len = phrase.length();

        while (i < len) {
            boolean found = false;
            for (int l = len - i; l >= 1; l--) {
                String sub = phrase.substring(i, i + l);
                if (sub.length() == 1 && !isKanji(sub.charAt(0))) {
                    continue;
                }

                // Check DB
                DictionaryLookupResponse r = lookupFromDatabaseFull(sub, sub, sentence);
                if (r != null && hasValidMeaning(r)) {
                    matchedParts.add(r);
                    i += l;
                    found = true;
                    break;
                }

                // Check local XML registry
                List<LocalDictionaryRegistry.LocalEntry> localEntries = localDictionaryRegistry.lookup(sub);
                if (!localEntries.isEmpty()) {
                    LocalDictionaryRegistry.LocalEntry entry = localEntries.get(0);
                    DictionaryLookupResponse localRes = DictionaryLookupResponse.builder()
                            .surface(entry.getSurface())
                            .dictionaryForm(entry.getSurface())
                            .reading(entry.getReading())
                            .romaji(entry.getReading() != null ? RomajiConverter.convert(entry.getReading()) : RomajiConverter.convert(entry.getSurface()))
                            .jlpt("N3")
                            .wordType(entry.getPartOfSpeech())
                            .meanings(entry.getMeanings())
                            .primaryMeaning(entry.getMeanings().isEmpty() ? "" : entry.getMeanings().get(0))
                            .contextMeaning("")
                            .contextExplanation("")
                            .fromCache(false)
                            .fromAi(false)
                            .build();
                    matchedParts.add(localRes);
                    i += l;
                    found = true;
                    break;
                }
            }

            if (!found) {
                i++;
            }
        }

        if (matchedParts.isEmpty()) {
            return null;
        }

        if (matchedParts.size() == 1) {
            return matchedParts.get(0);
        }

        List<String> combinedMeanings = new ArrayList<>();
        StringBuilder primaryMeaningBuilder = new StringBuilder();
        StringBuilder readingBuilder = new StringBuilder();

        for (DictionaryLookupResponse part : matchedParts) {
            String partMeaning = part.getPrimaryMeaning();
            if (partMeaning == null || partMeaning.isEmpty()) {
                partMeaning = part.getMeanings().isEmpty() ? "" : part.getMeanings().get(0);
            }

            combinedMeanings.add("• [" + part.getSurface() + "] " + partMeaning);
            if (primaryMeaningBuilder.length() > 0) {
                primaryMeaningBuilder.append("; ");
            }
            primaryMeaningBuilder.append(part.getSurface()).append(": ").append(partMeaning);

            if (part.getReading() != null) {
                readingBuilder.append(part.getReading());
            } else {
                readingBuilder.append(part.getSurface());
            }
        }

        return DictionaryLookupResponse.builder()
                .surface(phrase)
                .dictionaryForm(phrase)
                .reading(readingBuilder.toString())
                .romaji(RomajiConverter.convert(readingBuilder.toString()))
                .jlpt("N3")
                .wordType("phrase")
                .meanings(combinedMeanings)
                .primaryMeaning(primaryMeaningBuilder.toString())
                .contextMeaning("")
                .contextExplanation("")
                .fromCache(false)
                .fromAi(false)
                .build();
    }

    private boolean isKanji(char c) {
        return c >= '\u4e00' && c <= '\u9faf';
    }

    private DictionaryLookupResponse.GrammarForms buildGrammarForms(String surface, String reading, String wordType) {
        if (wordType == null) return null;
        
        String type = wordType.toLowerCase();
        if (!type.contains("verb") && !type.contains("adjective") && !type.contains("dan")) {
            return null;
        }
        
        boolean isIchidan = type.contains("ichidan") || type.contains("一段") || 
                           (surface != null && (surface.endsWith("る") || surface.endsWith("れ")));
        boolean isGodan = type.contains("godan") || type.contains("五段") ||
                         (surface != null && !surface.endsWith("る") && !surface.endsWith("れ"));
        
        String base = reading != null ? reading : surface;
        if (base == null) base = surface;
        
        return JapaneseFormConverter.convertForms(surface, base, isIchidan, isGodan);
    }

    private DictionaryLookupResponse enrichWithAi(String word, String surface, String sentence, 
                                                  DictionaryLookupResponse dbResult) {
        try {
            String systemPrompt = buildWordLookupSystemPrompt();
            String userMessage = buildWordLookupUserMessage(word, sentence);

            String response = aiCoreService.chat(systemPrompt, userMessage, Collections.emptyList());
            
            DictionaryLookupResponse aiResult = parseAiLookupResponse(word, surface, response);
            
            // Merge with DB result if available
            if (dbResult != null) {
                // Prefer DB meanings if available
                if (dbResult.getMeanings() != null && !dbResult.getMeanings().isEmpty() && 
                    (aiResult.getMeanings() == null || aiResult.getMeanings().isEmpty())) {
                    aiResult.setMeanings(dbResult.getMeanings());
                    aiResult.setPrimaryMeaning(dbResult.getPrimaryMeaning());
                }
                // Keep DB examples
                if (dbResult.getExamples() != null && !dbResult.getExamples().isEmpty()) {
                    aiResult.setExamples(dbResult.getExamples());
                }
                // Keep DB grammar forms
                if (dbResult.getForms() != null) {
                    aiResult.setForms(dbResult.getForms());
                }
            }
            
            aiResult.setFromAi(true);
            return aiResult;
            
        } catch (Exception e) {
            log.error("AI word enrichment failed for '{}': {}", word, e.getMessage());
            
            // Return DB result with error flag, or create empty response
            if (dbResult != null) {
                dbResult.setFromAi(true);
                dbResult.setAiError("AI enrichment failed: " + e.getMessage());
                return dbResult;
            }
            
            DictionaryLookupResponse fallback = createEmptyLookupResponse(word);
            fallback.setFromAi(true);
            fallback.setAiError(e.getMessage());
            return fallback;
        }
    }

    private DictionaryLookupResponse parseAiLookupResponse(String word, String surface, String response) {
        try {
            String cleanedJson = cleanJsonString(response);
            JsonNode root = objectMapper.readTree(cleanedJson);

            // Parse grammar forms if present
            DictionaryLookupResponse.GrammarForms forms = null;
            JsonNode formsNode = root.get("forms");
            if (formsNode != null && !formsNode.isNull()) {
                forms = DictionaryLookupResponse.GrammarForms.builder()
                        .masu(getTextValue(formsNode, "masu", ""))
                        .te(getTextValue(formsNode, "te", ""))
                        .ta(getTextValue(formsNode, "ta", ""))
                        .nai(getTextValue(formsNode, "nai", ""))
                        .potential(getTextValue(formsNode, "potential", ""))
                        .passive(getTextValue(formsNode, "passive", ""))
                        .causative(getTextValue(formsNode, "causative", ""))
                        .volitional(getTextValue(formsNode, "volitional", ""))
                        .teKudasai(getTextValue(formsNode, "teKudasai", ""))
                        .tai(getTextValue(formsNode, "tai", ""))
                        .nakereba(getTextValue(formsNode, "nakereba", ""))
                        .build();
            }

            // Parse meanings
            List<String> meanings = new ArrayList<>();
            JsonNode meaningsNode = root.get("meanings");
            if (meaningsNode != null && meaningsNode.isArray()) {
                for (JsonNode m : meaningsNode) {
                    meanings.add(m.asText());
                }
            }

            // Parse examples
            List<DictionaryLookupResponse.WordExample> examples = new ArrayList<>();
            JsonNode examplesNode = root.get("examples");
            if (examplesNode != null && examplesNode.isArray()) {
                for (JsonNode ex : examplesNode) {
                    examples.add(DictionaryLookupResponse.WordExample.builder()
                            .japanese(getTextValue(ex, "japanese", ""))
                            .reading(getTextValue(ex, "reading", ""))
                            .vietnamese(getTextValue(ex, "vietnamese", ""))
                            .english(getTextValue(ex, "english", ""))
                            .highlightStart(0)
                            .highlightEnd(0)
                            .build());
                }
            }

            return DictionaryLookupResponse.builder()
                    .surface(surface != null ? surface : word)
                    .dictionaryForm(getTextValue(root, "dictionaryForm", word))
                    .reading(getTextValue(root, "reading", word))
                    .romaji(getTextValue(root, "romaji", ""))
                    .jlpt(getTextValue(root, "jlpt", guessJlptLevel(word)))
                    .wordType(getTextValue(root, "wordType", ""))
                    .pitchAccent(getTextValue(root, "pitchAccent", ""))
                    .meanings(meanings)
                    .primaryMeaning(meanings.isEmpty() ? "" : meanings.get(0))
                    .contextMeaning(getTextValue(root, "contextMeaning", ""))
                    .contextExplanation(getTextValue(root, "contextExplanation", ""))
                    .forms(forms)
                    .examples(examples)
                    .audioUrl(getTextValue(root, "audioUrl", ""))
                    .hasAudio(false)
                    .saved(false)
                    .fromCache(false)
                    .fromAi(true)
                    .build();
                    
        } catch (Exception e) {
            log.error("Failed to parse AI lookup response: {}", e.getMessage());
            return createEmptyLookupResponse(word);
        }
    }

    // ============================================================
    // Legacy Word Lookup (for backward compatibility)
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public StudentDictionaryResponse lookupWord(String word, String contextSentence) {
        if (word == null || word.trim().isEmpty()) {
            return createEmptyResponse(word);
        }

        String targetWord = word.trim();
        String cacheKey = WORD_CACHE_PREFIX + targetWord;

        return cacheService.getOrFetch(cacheKey, StudentDictionaryResponse.class, () -> {
            // 1. Try database lookup — JMdict (English meanings included as fallback)
            StudentDictionaryResponse dbResult = lookupFromDatabaseLegacy(targetWord);
            if (dbResult != null && hasValidMeaningLegacy(dbResult)) {
                dbResult.setFromCache(false);
                dbResult.setFromAi(false);
                log.debug("Word '{}' found in database", targetWord);
                return dbResult;
            }

            // 2. Try local XML dictionary lookup (JMdict.xml in RAM)
            List<LocalDictionaryRegistry.LocalEntry> localEntries = localDictionaryRegistry.lookup(targetWord);
            if (!localEntries.isEmpty()) {
                LocalDictionaryRegistry.LocalEntry localEntry = localEntries.get(0);
                StudentDictionaryResponse localResult = StudentDictionaryResponse.builder()
                        .surface(localEntry.getSurface())
                        .reading(localEntry.getReading())
                        .romaji(localEntry.getReading() != null ? RomajiConverter.convert(localEntry.getReading()) : RomajiConverter.convert(localEntry.getSurface()))
                        .meaningVi(localEntry.getMeanings().isEmpty() ? "" : String.join("; ", localEntry.getMeanings()))
                        .meaningEn("")
                        .jlpt("N3")
                        .partOfSpeech(localEntry.getPartOfSpeech())
                        .examples(new ArrayList<>())
                        .fromCache(false)
                        .fromAi(false)
                        .build();
                log.debug("Word '{}' found in local XML dictionary memory (legacy)", targetWord);
                return localResult;
            }

            // 3. DB had no meanings — fall back to AI
            log.debug("Word '{}' not in database or local XML dictionary, using AI fallback", targetWord);
            return lookupFromAiLegacy(targetWord, contextSentence);
        }, CACHE_TTL_HOURS, TimeUnit.HOURS);
    }

    private StudentDictionaryResponse lookupFromDatabaseLegacy(String word) {
        List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurfaceWithMeanings(word);

        if (entries.isEmpty()) {
            entries = dictionaryEntryRepository.findByLemmaWithMeanings(word);
        }

        if (entries.isEmpty()) {
            entries = dictionaryEntryRepository.findByReadingWithMeanings(word);
        }

        if (entries.isEmpty()) {
            return null;
        }

        DictionaryEntry entry = entries.get(0);

        // Get Vietnamese meanings
        List<String> viMeanings = entry.getMeanings().stream()
                .filter(m -> "vi".equalsIgnoreCase(m.getLanguage()))
                .sorted(Comparator.comparingInt(DictionaryMeaning::getSortOrder))
                .map(DictionaryMeaning::getMeaning)
                .limit(5)
                .collect(Collectors.toList());

        // Get English meanings as fallback
        if (viMeanings.isEmpty()) {
            viMeanings = entry.getMeanings().stream()
                    .filter(m -> "en".equalsIgnoreCase(m.getLanguage()))
                    .sorted(Comparator.comparingInt(DictionaryMeaning::getSortOrder))
                    .map(DictionaryMeaning::getMeaning)
                    .limit(5)
                    .collect(Collectors.toList());
        }

        // Get examples
        List<StudentDictionaryResponse.WordExample> examples = entry.getExamples().stream()
                .map(ex -> StudentDictionaryResponse.WordExample.builder()
                        .ja(ex.getJapanese())
                        .vi(ex.getTranslation())
                        .en("")
                        .build())
                .limit(3)
                .collect(Collectors.toList());

        return StudentDictionaryResponse.builder()
                .surface(entry.getSurface())
                .reading(entry.getReading() != null ? entry.getReading() : entry.getSurface())
                .romaji(entry.getRomaji() != null ? entry.getRomaji() : "")
                .meaningVi(viMeanings.isEmpty() ? "" : String.join("; ", viMeanings))
                .meaningEn("")
                .jlpt(entry.getJlptLevel() != null ? entry.getJlptLevel() : guessJlptLevel(entry.getSurface()))
                .partOfSpeech(entry.getPartOfSpeech() != null ? entry.getPartOfSpeech() : "")
                .examples(examples)
                .fromCache(true)
                .fromAi(false)
                .build();
    }

    private StudentDictionaryResponse lookupFromAiLegacy(String word, String contextSentence) {
        String systemPrompt = buildWordLookupSystemPrompt();
        String userMessage = buildWordLookupUserMessage(word, contextSentence);

        try {
            String response = aiCoreService.chat(systemPrompt, userMessage, Collections.emptyList());
            return parseAiWordResponseLegacy(word, response);
        } catch (Exception e) {
            log.error("AI word lookup failed for '{}': {}", word, e.getMessage());
            StudentDictionaryResponse fallback = createEmptyResponse(word);
            fallback.setFromAi(true);
            fallback.setAiError(e.getMessage());
            return fallback;
        }
    }

    private StudentDictionaryResponse parseAiWordResponseLegacy(String word, String response) {
        try {
            String cleanedJson = cleanJsonString(response);
            JsonNode root = objectMapper.readTree(cleanedJson);

            return StudentDictionaryResponse.builder()
                    .surface(getTextValue(root, "surface", word))
                    .reading(getTextValue(root, "reading", word))
                    .romaji(getTextValue(root, "romaji", ""))
                    .meaningVi(getTextValue(root, "meaningVi", ""))
                    .meaningEn(getTextValue(root, "meaningEn", ""))
                    .jlpt(getTextValue(root, "jlpt", guessJlptLevel(word)))
                    .partOfSpeech(getTextValue(root, "partOfSpeech", ""))
                    .context(getTextValue(root, "context", ""))
                    .examples(new ArrayList<>())
                    .fromCache(false)
                    .fromAi(true)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse AI word response: {}", e.getMessage());
            StudentDictionaryResponse fallback = createEmptyResponse(word);
            fallback.setFromAi(true);
            fallback.setAiError("Parse error: " + e.getMessage());
            return fallback;
        }
    }

    // ============================================================
    // Sentence Analysis
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public StudentSentenceResponse analyzeSentence(String sentence) {
        if (sentence == null || sentence.trim().isEmpty()) {
            return createEmptySentenceResponse(sentence);
        }

        String targetSentence = sentence.trim();
        String cacheKey = SENTENCE_CACHE_PREFIX + normalizeCacheKey(targetSentence);

        return cacheService.getOrFetch(cacheKey, StudentSentenceResponse.class, () -> {
            // 1. Try database lookup for vocabulary
            StudentSentenceResponse dbResult = analyzeFromDatabase(targetSentence);
            dbResult.setFromCache(false);

            // 2. Enhance with AI for translation and grammar
            try {
                StudentSentenceResponse aiResult = analyzeFromAi(targetSentence);
                // Merge AI results with DB results
                if (aiResult.getTranslationVi() != null && !aiResult.getTranslationVi().isEmpty()) {
                    dbResult.setTranslationVi(aiResult.getTranslationVi());
                }
                if (aiResult.getTranslationEn() != null && !aiResult.getTranslationEn().isEmpty()) {
                    dbResult.setTranslationEn(aiResult.getTranslationEn());
                }
                if (aiResult.getGrammar() != null && !aiResult.getGrammar().isEmpty()) {
                    dbResult.setGrammar(aiResult.getGrammar());
                }
                dbResult.setFromAi(true);
            } catch (Exception e) {
                log.warn("AI sentence analysis failed for '{}': {}", targetSentence, e.getMessage());
                dbResult.setFromAi(false);
            }

            return dbResult;
        }, CACHE_TTL_HOURS, TimeUnit.HOURS);
    }

    private StudentSentenceResponse analyzeFromDatabase(String sentence) {
        // Tokenize the sentence
        JapaneseStringTokenizer tokenizer = new JapaneseStringTokenizer();

        List<StudentSentenceResponse.VocabItem> vocabulary = new ArrayList<>();
        Set<String> processedWords = new HashSet<>();

        for (String word : tokenizer.tokenize(sentence)) {
            if (processedWords.contains(word)) continue;
            processedWords.add(word);

            List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurfaceWithMeanings(word);
            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByLemmaWithMeanings(word);
            }

            if (!entries.isEmpty()) {
                DictionaryEntry entry = entries.get(0);

                // Prefer Vietnamese meanings, fall back to English
                List<String> meanings = entry.getMeanings().stream()
                        .filter(m -> "vi".equalsIgnoreCase(m.getLanguage()))
                        .sorted(Comparator.comparingInt(DictionaryMeaning::getSortOrder))
                        .map(DictionaryMeaning::getMeaning)
                        .limit(2)
                        .collect(Collectors.toList());

                if (meanings.isEmpty()) {
                    meanings = entry.getMeanings().stream()
                            .filter(m -> "en".equalsIgnoreCase(m.getLanguage()))
                            .sorted(Comparator.comparingInt(DictionaryMeaning::getSortOrder))
                            .map(DictionaryMeaning::getMeaning)
                            .limit(2)
                            .collect(Collectors.toList());
                }

                vocabulary.add(StudentSentenceResponse.VocabItem.builder()
                        .word(entry.getSurface())
                        .reading(entry.getReading() != null ? entry.getReading() : entry.getSurface())
                        .meaning(meanings.isEmpty() ? "" : meanings.get(0))
                        .jlpt(entry.getJlptLevel() != null ? entry.getJlptLevel() : "")
                        .isHighlighted(true)
                        .build());
            }
        }

        return StudentSentenceResponse.builder()
                .originalText(sentence)
                .translationVi("")
                .translationEn("")
                .vocabulary(vocabulary)
                .grammar(new ArrayList<>())
                .fromCache(true)
                .fromAi(false)
                .build();
    }

    private StudentSentenceResponse analyzeFromAi(String sentence) {
        String systemPrompt = buildSentenceAnalysisSystemPrompt();
        String userMessage = buildSentenceAnalysisUserMessage(sentence);

        try {
            String response = aiCoreService.chat(systemPrompt, userMessage, Collections.emptyList());
            return parseAiSentenceResponse(response);
        } catch (Exception e) {
            log.error("AI sentence analysis failed: {}", e.getMessage());
            throw new RuntimeException("AI analysis failed", e);
        }
    }

    private StudentSentenceResponse parseAiSentenceResponse(String response) {
        try {
            String cleanedJson = cleanJsonString(response);
            JsonNode root = objectMapper.readTree(cleanedJson);

            List<StudentSentenceResponse.GrammarItem> grammar = new ArrayList<>();
            JsonNode grammarNode = root.get("grammar");
            if (grammarNode != null && grammarNode.isArray()) {
                for (JsonNode item : grammarNode) {
                    grammar.add(StudentSentenceResponse.GrammarItem.builder()
                            .pattern(getTextValue(item, "pattern", ""))
                            .reading(getTextValue(item, "reading", ""))
                            .meaning(getTextValue(item, "meaning", ""))
                            .explanation(getTextValue(item, "explanation", ""))
                            .build());
                }
            }

            return StudentSentenceResponse.builder()
                    .translationVi(getTextValue(root, "translationVi", ""))
                    .translationEn(getTextValue(root, "translationEn", ""))
                    .grammar(grammar)
                    .fromAi(true)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse AI sentence response: {}", e.getMessage());
            return StudentSentenceResponse.builder()
                    .translationVi("")
                    .translationEn("")
                    .grammar(new ArrayList<>())
                    .fromAi(true)
                    .build();
        }
    }

    // ============================================================
    // Flashcard Operations
    // ============================================================

    @Override
    @Transactional
    public DictionaryLookupResponse saveToFlashcard(SaveFlashcardRequest request) {
        if (request == null || request.getWord() == null) {
            return createEmptyLookupResponse("");
        }

        String word = request.getWord().trim();
        String userId = getCurrentUserId();

        // Check if already saved
        Optional<StudentSavedWord> existing = studentSavedWordRepository.findByUserIdAndSurface(userId, word);
        if (existing.isPresent()) {
            return DictionaryLookupResponse.builder()
                    .surface(word)
                    .saved(true)
                    .saveId(existing.get().getId().toString())
                    .build();
        }

        // Create new saved word
        StudentSavedWord savedWord = StudentSavedWord.builder()
                .userId(userId)
                .surface(word)
                .reading(request.getReading())
                .meaning(request.getMeaning())
                .context(request.getContext())
                .lessonId(request.getLessonId())
                .dictionaryForm(request.getDictionaryForm())
                .wordType(request.getWordType())
                .jlptLevel(request.getJlpt())
                .build();

        StudentSavedWord saved = studentSavedWordRepository.save(savedWord);

        return DictionaryLookupResponse.builder()
                .surface(word)
                .reading(request.getReading())
                .dictionaryForm(request.getDictionaryForm())
                .jlpt(request.getJlpt())
                .wordType(request.getWordType())
                .saved(true)
                .saveId(saved.getId().toString())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isWordSaved(String word) {
        if (word == null) return false;
        String userId = getCurrentUserId();
        return studentSavedWordRepository.existsByUserIdAndSurface(userId, word.trim());
    }

    private void checkSavedStatus(DictionaryLookupResponse response) {
        if (response == null) return;
        String userId = getCurrentUserId();
        Optional<StudentSavedWord> saved = studentSavedWordRepository.findByUserIdAndSurface(userId, response.getSurface());
        if (saved.isPresent()) {
            response.setSaved(true);
            response.setSaveId(saved.get().getId().toString());
        }
    }

    private String getCurrentUserId() {
        String userId = currentUserProvider.getCurrentUserId();
        return userId != null ? userId : "anonymous";
    }

    // ============================================================
    // AI Prompts
    // ============================================================

    private String buildWordLookupSystemPrompt() {
        return """
                Bạn là một từ điển Nhật-Việt chuyên nghiệp.
                Khi nhận được một từ tiếng Nhật, hãy trả về thông tin chi tiết về từ đó.
                
                Trả về JSON với format:
                {
                  "surface": "từ tiếng Nhật",
                  "dictionaryForm": "định dạng từ điển (thể từ điển)",
                  "reading": "cách đọc (furigana)",
                  "romaji": "cách đọc romaji",
                  "jlpt": "cấp độ JLPT (N5, N4, N3, N2, N1)",
                  "wordType": "loại từ (Godan Verb, Ichidan Verb, i-adjective, na-adjective, noun)",
                  "pitchAccent": "âm điệu (0, 1, 2, 3, 4)",
                  "meanings": ["nghĩa 1", "nghĩa 2", "nghĩa 3"],
                  "primaryMeaning": "nghĩa chính",
                  "contextMeaning": "nghĩa trong ngữ cảnh cụ thể",
                  "contextExplanation": "giải thích tại sao nghĩa này phù hợp với ngữ cảnh",
                  "forms": {
                    "masu": "thể masu (ます)",
                    "te": "thể te (て)",
                    "ta": "thể ta (た)",
                    "nai": "thể nai (ない)",
                    "potential": "thể khả năng",
                    "passive": "thể bị động",
                    "causative": "thể sai khiến",
                    "volitional": "thể ý chí",
                    "teKudasai": "thể てください",
                    "tai": "thể たい",
                    "nakereba": "thể なければならない"
                  },
                  "examples": [
                    {
                      "japanese": "ví dụ tiếng Nhật",
                      "reading": "cách đọc",
                      "vietnamese": "bản dịch tiếng Việt",
                      "english": "english translation"
                    }
                  ],
                  "audioUrl": "url audio nếu có"
                }
                
                Chỉ trả về JSON, không giải thích thêm.
                """;
    }

    private String buildWordLookupUserMessage(String word, String contextSentence) {
        StringBuilder sb = new StringBuilder();
        sb.append("Từ cần tra: ").append(word).append("\n");
        if (contextSentence != null && !contextSentence.isEmpty()) {
            sb.append("Câu gốc: ").append(contextSentence).append("\n");
            sb.append("Hãy xác định nghĩa của từ '").append(word).append("' trong câu này và giải thích tại sao.\n");
        }
        return sb.toString();
    }

    private String buildSentenceAnalysisSystemPrompt() {
        return """
                Bạn là chuyên gia ngữ pháp và từ vựng tiếng Nhật.
                Phân tích câu tiếng Nhật và trả về:
                1. Bản dịch tiếng Việt
                2. Bản dịch tiếng Anh
                3. Các điểm ngữ pháp quan trọng trong câu
                
                Trả về JSON:
                {
                  "translationVi": "bản dịch tiếng Việt",
                  "translationEn": "bản dịch tiếng Anh",
                  "grammar": [
                    {
                      "pattern": "mẫu ngữ pháp (vd: ～は～です)",
                      "reading": "cách đọc",
                      "meaning": "nghĩa",
                      "explanation": "giải thích ngắn gọn"
                    }
                  ]
                }
                
                Nếu không có ngữ pháp đặc biệt, trả về mảng grammar rỗng.
                Chỉ trả về JSON, không giải thích thêm.
                """;
    }

    private String buildSentenceAnalysisUserMessage(String sentence) {
        return "Câu cần phân tích: " + sentence;
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    private boolean hasValidMeaning(DictionaryLookupResponse response) {
        return response != null &&
               response.getMeanings() != null &&
               !response.getMeanings().isEmpty();
    }

    private boolean hasValidMeaningLegacy(StudentDictionaryResponse response) {
        return response != null &&
               response.getMeaningVi() != null &&
               !response.getMeaningVi().isEmpty();
    }

    private String guessJlptLevel(String word) {
        if (word == null || word.isEmpty()) return "N5";
        long kanjiCount = word.chars().filter(c -> c >= 0x4E00 && c <= 0x9FFF).count();
        if (kanjiCount >= 4) return "N3";
        if (kanjiCount >= 2) return "N4";
        return "N5";
    }

    private String normalizeCacheKey(String text) {
        return text.replaceAll("[\\s\\n]+", " ").trim();
    }

    private String getTextValue(JsonNode node, String field, String defaultValue) {
        JsonNode fieldNode = node.get(field);
        if (fieldNode != null && !fieldNode.isNull()) {
            String value = fieldNode.asText();
            return value != null ? value : defaultValue;
        }
        return defaultValue;
    }

    private String cleanJsonString(String response) {
        if (response == null) return "{}";
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

    private DictionaryLookupResponse createEmptyLookupResponse(String word) {
        return DictionaryLookupResponse.builder()
                .surface(word != null ? word : "")
                .dictionaryForm("")
                .reading("")
                .romaji("")
                .jlpt("")
                .wordType("")
                .pitchAccent("")
                .meanings(new ArrayList<>())
                .primaryMeaning("")
                .contextMeaning("")
                .contextExplanation("")
                .forms(null)
                .examples(new ArrayList<>())
                .audioUrl("")
                .hasAudio(false)
                .saved(false)
                .saveId(null)
                .fromCache(false)
                .fromAi(false)
                .build();
    }

    private StudentDictionaryResponse createEmptyResponse(String word) {
        return StudentDictionaryResponse.builder()
                .surface(word != null ? word : "")
                .reading("")
                .romaji("")
                .meaningVi("")
                .meaningEn("")
                .jlpt("")
                .partOfSpeech("")
                .context("")
                .examples(new ArrayList<>())
                .fromCache(false)
                .fromAi(false)
                .build();
    }

    private StudentSentenceResponse createEmptySentenceResponse(String sentence) {
        return StudentSentenceResponse.builder()
                .originalText(sentence != null ? sentence : "")
                .translationVi("")
                .translationEn("")
                .vocabulary(new ArrayList<>())
                .grammar(new ArrayList<>())
                .fromCache(false)
                .fromAi(false)
                .build();
    }

    // ============================================================
    // Japanese String Tokenizer (Simple)
    // ============================================================

    private static class JapaneseStringTokenizer {
        public List<String> tokenize(String text) {
            List<String> tokens = new ArrayList<>();
            StringBuilder current = new StringBuilder();
            boolean inJapanese = false;

            for (int i = 0; i < text.length(); i++) {
                char c = text.charAt(i);
                boolean isJapanese = isJapaneseChar(c);

                if (isJapanese) {
                    if (!inJapanese && current.length() > 0) {
                        tokens.add(current.toString());
                        current.setLength(0);
                    }
                    inJapanese = true;
                    current.append(c);
                } else {
                    if (inJapanese && current.length() > 0) {
                        tokens.add(current.toString());
                        current.setLength(0);
                    }
                    inJapanese = false;
                    if (!Character.isWhitespace(c)) {
                        current.append(c);
                    } else if (current.length() > 0) {
                        tokens.add(current.toString());
                        current.setLength(0);
                    }
                }
            }

            if (current.length() > 0) {
                tokens.add(current.toString());
            }

            return tokens;
        }

        private boolean isJapaneseChar(char c) {
            return (c >= 0x3040 && c <= 0x309F) ||  // Hiragana
                   (c >= 0x30A0 && c <= 0x30FF) ||  // Katakana
                   (c >= 0x4E00 && c <= 0x9FFF) ||  // CJK
                   (c >= 0x3400 && c <= 0x4DBF);    // CJK Extension
        }
    }
}
