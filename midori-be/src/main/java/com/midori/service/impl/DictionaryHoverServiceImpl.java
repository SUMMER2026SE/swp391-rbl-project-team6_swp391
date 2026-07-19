package com.midori.service.impl;

import com.midori.dto.dictionary.DictionaryHoverResponse;
import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.DictionaryHoverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.midori.service.DictionaryCacheService;
import java.util.concurrent.TimeUnit;
import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionaryHoverServiceImpl implements DictionaryHoverService {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final DictionaryCacheService cacheService;
    private final LocalDictionaryRegistry localDictionaryRegistry;

    @Override
    @Transactional(readOnly = true)
    public DictionaryHoverResponse getHoverInfo(String word) {
        if (word == null || word.trim().isEmpty()) {
            return createEmptyResponse(word != null ? word.trim() : "");
        }

        // Clean punctuation
        String targetWord = sanitizeLookupWord(word);
        if (targetWord.isEmpty()) {
            targetWord = word.trim();
        }

        String cacheKey = "dictionary:hover:" + targetWord;

        String finalTargetWord = targetWord;
        return cacheService.getOrFetch(cacheKey, DictionaryHoverResponse.class, () -> {
            // 1. Try database lookup by surface
            List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurfaceWithMeanings(finalTargetWord);

            // 2. Try lemma (dictionary form)
            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByLemmaWithMeanings(finalTargetWord);
            }

            // 3. Try reading (pronunciation)
            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByReadingWithMeanings(finalTargetWord);
            }

            if (!entries.isEmpty()) {
                DictionaryEntry entry = entries.get(0);

                // Get Vietnamese meanings first, fall back to English
                List<String> meanings = entry.getMeanings().stream()
                        .filter(m -> m.getLanguage() != null && !"en".equalsIgnoreCase(m.getLanguage()))
                        .sorted(Comparator.comparingInt(m -> {
                            Integer order = m.getSortOrder();
                            return order != null ? order : Integer.MAX_VALUE;
                        }))
                        .limit(5)
                        .map(DictionaryMeaning::getMeaning)
                        .collect(Collectors.toList());

                // Fall back to English if no Vietnamese meanings
                if (meanings.isEmpty()) {
                    meanings = entry.getMeanings().stream()
                            .filter(m -> "en".equalsIgnoreCase(m.getLanguage()))
                            .sorted(Comparator.comparingInt(m -> {
                                Integer order = m.getSortOrder();
                                return order != null ? order : Integer.MAX_VALUE;
                            }))
                            .limit(5)
                            .map(DictionaryMeaning::getMeaning)
                            .collect(Collectors.toList());
                }

                return DictionaryHoverResponse.builder()
                        .word(entry.getSurface())
                        .reading(entry.getReading())
                        .romaji(entry.getRomaji())
                        .partOfSpeech(entry.getPartOfSpeech())
                        .meanings(meanings)
                        .build();
            }

            // Fallback to local XML dictionary registry
            List<LocalDictionaryRegistry.LocalEntry> localEntries = localDictionaryRegistry.lookup(finalTargetWord);
            if (!localEntries.isEmpty()) {
                LocalDictionaryRegistry.LocalEntry localEntry = localEntries.get(0);
                return DictionaryHoverResponse.builder()
                        .word(localEntry.getSurface())
                        .reading(localEntry.getReading())
                        .romaji(localEntry.getReading() != null ? com.midori.util.RomajiConverter.convert(localEntry.getReading()) : com.midori.util.RomajiConverter.convert(localEntry.getSurface()))
                        .partOfSpeech(localEntry.getPartOfSpeech())
                        .meanings(localEntry.getMeanings())
                        .build();
            }

            // Phrase segmentation fallback - for multi-character phrases
            DictionaryHoverResponse phraseRes = lookupPhraseFallback(finalTargetWord);
            if (phraseRes != null) {
                return phraseRes;
            }

            throw new ResourceNotFoundException("DictionaryEntry", "word", finalTargetWord);
        }, 24, TimeUnit.HOURS);
    }

    private DictionaryHoverResponse lookupPhraseFallback(String originalPhrase) {
        if (originalPhrase == null || originalPhrase.trim().isEmpty()) {
            return null;
        }

        String phrase = originalPhrase.trim();
        if (phrase.length() < 2) {
            return null;
        }

        List<DictionaryHoverResponse> matchedParts = new ArrayList<>();
        int i = 0;
        int len = phrase.length();

        while (i < len) {
            boolean found = false;
            // Try longest match first, then shorter
            for (int l = len - i; l >= 1; l--) {
                String sub = phrase.substring(i, i + l);

                // Only skip single character if it's NOT hiragana that might be a particle/word
                // (hiragana particles like は, が, を, etc. DO exist in the dictionary)
                // Skip only obvious punctuation
                if (sub.length() == 1 && isJapanesePunctuation(sub.charAt(0))) {
                    i++;
                    found = true;
                    break;
                }

                // Check DB - try surface first, then lemma, then reading
                List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurfaceWithMeanings(sub);
                if (entries.isEmpty()) {
                    entries = dictionaryEntryRepository.findByLemmaWithMeanings(sub);
                }
                if (entries.isEmpty()) {
                    entries = dictionaryEntryRepository.findByReadingWithMeanings(sub);
                }
                if (!entries.isEmpty()) {
                    DictionaryEntry entry = entries.get(0);
                    // Get Vietnamese meanings first, fall back to English
                    List<String> meanings = entry.getMeanings().stream()
                            .filter(m -> m.getLanguage() != null && !"en".equalsIgnoreCase(m.getLanguage()))
                            .sorted(Comparator.comparingInt(m -> {
                                Integer order = m.getSortOrder();
                                return order != null ? order : Integer.MAX_VALUE;
                            }))
                            .limit(5)
                            .map(DictionaryMeaning::getMeaning)
                            .collect(Collectors.toList());
                    if (meanings.isEmpty()) {
                        meanings = entry.getMeanings().stream()
                                .filter(m -> "en".equalsIgnoreCase(m.getLanguage()))
                                .sorted(Comparator.comparingInt(m -> {
                                    Integer order = m.getSortOrder();
                                    return order != null ? order : Integer.MAX_VALUE;
                                }))
                                .limit(5)
                                .map(DictionaryMeaning::getMeaning)
                                .collect(Collectors.toList());
                    }
                    if (!meanings.isEmpty()) {
                        matchedParts.add(DictionaryHoverResponse.builder()
                                .word(entry.getSurface())
                                .reading(entry.getReading())
                                .romaji(entry.getRomaji())
                                .partOfSpeech(entry.getPartOfSpeech())
                                .meanings(meanings)
                                .build());
                        i += l;
                        found = true;
                        break;
                    }
                }

                // Check local XML registry
                List<LocalDictionaryRegistry.LocalEntry> localEntries = localDictionaryRegistry.lookup(sub);
                if (!localEntries.isEmpty()) {
                    LocalDictionaryRegistry.LocalEntry entry = localEntries.get(0);
                    matchedParts.add(DictionaryHoverResponse.builder()
                            .word(entry.getSurface())
                            .reading(entry.getReading())
                            .romaji(entry.getReading() != null ? com.midori.util.RomajiConverter.convert(entry.getReading()) : com.midori.util.RomajiConverter.convert(entry.getSurface()))
                            .partOfSpeech(entry.getPartOfSpeech())
                            .meanings(entry.getMeanings())
                            .build());
                    i += l;
                    found = true;
                    break;
                }
            }

            if (!found) {
                // No match found - advance by one character but still record as unknown
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
        StringBuilder readingBuilder = new StringBuilder();

        for (DictionaryHoverResponse part : matchedParts) {
            String partMeaning = part.getMeanings().isEmpty() ? "" : part.getMeanings().get(0);
            combinedMeanings.add("• [" + part.getWord() + "] " + partMeaning);
            if (part.getReading() != null) {
                readingBuilder.append(part.getReading());
            } else {
                readingBuilder.append(part.getWord());
            }
        }

        return DictionaryHoverResponse.builder()
                .word(phrase)
                .reading(readingBuilder.toString())
                .romaji(com.midori.util.RomajiConverter.convert(readingBuilder.toString()))
                .partOfSpeech("phrase")
                .meanings(combinedMeanings)
                .build();
    }

    private boolean isJapanesePunctuation(char c) {
        return "、，。！？「」『』（）〔〕【】〜…‥・".indexOf(c) >= 0;
    }

    private boolean isKanji(char c) {
        return c >= '\u4e00' && c <= '\u9faf';
    }

    private String sanitizeLookupWord(String word) {
        if (word == null) return "";
        return word.replaceAll("^[、。？！「」『』・~〜,\\.\\?!\"';:]+", "")
                   .replaceAll("[、。？！「」『』・~〜,\\.\\?!\"';:]+$", "")
                   .trim();
    }

    private DictionaryHoverResponse createEmptyResponse(String word) {
        return DictionaryHoverResponse.builder()
                .word(word)
                .reading("")
                .romaji("")
                .partOfSpeech("")
                .meanings(List.of())
                .build();
    }
}
