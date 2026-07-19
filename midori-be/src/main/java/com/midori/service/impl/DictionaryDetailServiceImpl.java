package com.midori.service.impl;

import com.midori.dto.dictionary.*;
import com.midori.entity.DictionaryEntry;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.service.DictionaryDetailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.midori.service.DictionaryCacheService;
import java.util.concurrent.TimeUnit;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionaryDetailServiceImpl implements DictionaryDetailService {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final DictionaryCacheService cacheService;
    private final LocalDictionaryRegistry localDictionaryRegistry;

    @Override
    @Transactional(readOnly = true)
    public DictionaryDetailResponse getDetail(String word) {
        if (word == null || word.trim().isEmpty()) {
            return createEmptyResponse(word != null ? word.trim() : "");
        }

        // Clean punctuation
        String targetWord = sanitizeLookupWord(word);
        if (targetWord.isEmpty()) {
            targetWord = word.trim();
        }

        String cacheKey = "dictionary:detail:" + targetWord;

        String finalTargetWord = targetWord;
        return cacheService.getOrFetch(cacheKey, DictionaryDetailResponse.class, () -> {
            List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurface(finalTargetWord);

            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByLemma(finalTargetWord);
            }

            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByReading(finalTargetWord);
            }

            if (!entries.isEmpty()) {
                DictionaryEntry entry = entries.get(0);

                List<DictionaryMeaningResponse> meanings = entry.getMeanings() != null
                        ? entry.getMeanings().stream()
                                .map(DictionaryMapper::toResponse)
                                .collect(Collectors.toList())
                        : Collections.emptyList();

                List<DictionaryExampleResponse> examples = entry.getExamples() != null
                        ? entry.getExamples().stream()
                                .map(DictionaryMapper::toResponse)
                                .collect(Collectors.toList())
                        : Collections.emptyList();

                List<DictionaryEntry> relatedEntries = dictionaryEntryRepository.findRelatedWords(
                        entry.getSurface(), PageRequest.of(0, 5)
                );

                List<DictionaryRelatedWordResponse> relatedWords = relatedEntries.stream()
                        .map(re -> DictionaryRelatedWordResponse.builder()
                                .id(re.getId())
                                .word(re.getSurface())
                                .reading(re.getReading())
                                .romaji(re.getRomaji())
                                .build())
                        .collect(Collectors.toList());

                return DictionaryDetailResponse.builder()
                        .id(entry.getId())
                        .word(entry.getSurface())
                        .reading(entry.getReading())
                        .romaji(entry.getRomaji())
                        .jlpt(entry.getJlptLevel())
                        .frequency(entry.getFrequency())
                        .partOfSpeech(entry.getPartOfSpeech())
                        .meanings(meanings)
                        .examples(examples)
                        .relatedWords(relatedWords)
                        .build();
            }

            // Fallback to local XML dictionary registry
            List<LocalDictionaryRegistry.LocalEntry> localEntries = localDictionaryRegistry.lookup(finalTargetWord);
            if (!localEntries.isEmpty()) {
                LocalDictionaryRegistry.LocalEntry localEntry = localEntries.get(0);
                List<DictionaryMeaningResponse> meanings = localEntry.getMeanings().stream()
                        .map(m -> DictionaryMeaningResponse.builder()
                                .language("en")
                                .meaning(m)
                                .build())
                        .collect(Collectors.toList());

                return DictionaryDetailResponse.builder()
                        .id(null)
                        .word(localEntry.getSurface())
                        .reading(localEntry.getReading())
                        .romaji(localEntry.getReading() != null ? com.midori.util.RomajiConverter.convert(localEntry.getReading()) : com.midori.util.RomajiConverter.convert(localEntry.getSurface()))
                        .jlpt("N3")
                        .partOfSpeech(localEntry.getPartOfSpeech())
                        .meanings(meanings)
                        .examples(Collections.emptyList())
                        .relatedWords(Collections.emptyList())
                        .build();
            }

            throw new ResourceNotFoundException("DictionaryEntry", "word", finalTargetWord);
        }, 24, TimeUnit.HOURS);
    }

    private String sanitizeLookupWord(String word) {
        if (word == null) return "";
        return word.replaceAll("^[、。，．？！」『』（）〔〕【】〜…‥・~,\\.\\?!\"';:]+", "")
                   .replaceAll("[、。，．？！」『』（）〔〕【】〜…‥・~,\\.\\?!\"';:]+$", "")
                   .trim();
    }

    private DictionaryDetailResponse createEmptyResponse(String word) {
        return DictionaryDetailResponse.builder()
                .id(null)
                .word(word)
                .reading("")
                .romaji("")
                .jlpt("")
                .frequency(0)
                .partOfSpeech("")
                .meanings(Collections.emptyList())
                .examples(Collections.emptyList())
                .relatedWords(Collections.emptyList())
                .build();
    }
}
