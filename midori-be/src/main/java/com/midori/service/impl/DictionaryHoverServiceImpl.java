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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionaryHoverServiceImpl implements DictionaryHoverService {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final DictionaryCacheService cacheService;

    @Override
    @Transactional(readOnly = true)
    public DictionaryHoverResponse getHoverInfo(String word) {
        if (word == null || word.trim().isEmpty()) {
            return createEmptyResponse(word.trim());
        }

        String targetWord = word.trim();
        String cacheKey = "dictionary:hover:" + targetWord;

        return cacheService.getOrFetch(cacheKey, DictionaryHoverResponse.class, () -> {
            List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurfaceWithMeanings(targetWord);

            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByLemmaWithMeanings(targetWord);
            }

            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByReadingWithMeanings(targetWord);
            }

            if (entries.isEmpty()) {
                // Return empty response instead of throwing exception
                // This allows frontend to handle gracefully and show "not found" message
                return createEmptyResponse(targetWord);
            }

            DictionaryEntry entry = entries.get(0);

            List<String> meanings = entry.getMeanings().stream()
                    .sorted(Comparator.comparingInt(DictionaryMeaning::getSortOrder))
                    .map(DictionaryMeaning::getMeaning)
                    .limit(5)
                    .collect(Collectors.toList());

            return DictionaryHoverResponse.builder()
                    .word(entry.getSurface())
                    .reading(entry.getReading())
                    .romaji(entry.getRomaji())
                    .partOfSpeech(entry.getPartOfSpeech())
                    .meanings(meanings)
                    .build();
        }, 24, TimeUnit.HOURS);
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
