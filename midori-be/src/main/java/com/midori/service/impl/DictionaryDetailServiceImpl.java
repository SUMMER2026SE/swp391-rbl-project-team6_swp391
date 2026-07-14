package com.midori.service.impl;

import com.midori.dto.dictionary.*;
import com.midori.entity.DictionaryEntry;
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

    @Override
    @Transactional(readOnly = true)
    public DictionaryDetailResponse getDetail(String word) {
        if (word == null || word.trim().isEmpty()) {
            return createEmptyResponse(word != null ? word.trim() : "");
        }

        String targetWord = word.trim();
        String cacheKey = "dictionary:detail:" + targetWord;

        return cacheService.getOrFetch(cacheKey, DictionaryDetailResponse.class, () -> {
            List<DictionaryEntry> entries = dictionaryEntryRepository.findBySurface(targetWord);

            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByLemma(targetWord);
            }

            if (entries.isEmpty()) {
                entries = dictionaryEntryRepository.findByReading(targetWord);
            }

            if (entries.isEmpty()) {
                // Return empty response instead of throwing exception
                return createEmptyResponse(targetWord);
            }

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
        }, 24, TimeUnit.HOURS);
    }

    private DictionaryDetailResponse createEmptyResponse(String word) {
        return DictionaryDetailResponse.builder()
                .word(word)
                .reading("")
                .romaji("")
                .partOfSpeech("")
                .meanings(Collections.emptyList())
                .examples(Collections.emptyList())
                .relatedWords(Collections.emptyList())
                .build();
    }
}
