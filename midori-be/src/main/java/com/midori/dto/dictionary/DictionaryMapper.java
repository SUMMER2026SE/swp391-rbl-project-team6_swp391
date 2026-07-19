package com.midori.dto.dictionary;

import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.entity.DictionaryExample;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class DictionaryMapper {

    public static DictionaryEntryResponse toResponse(DictionaryEntry entry) {
        if (entry == null) {
            return null;
        }

        List<DictionaryMeaningResponse> meaningResponses = entry.getMeanings() != null
                ? entry.getMeanings().stream()
                        .map(DictionaryMapper::toResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        List<DictionaryExampleResponse> exampleResponses = entry.getExamples() != null
                ? entry.getExamples().stream()
                        .map(DictionaryMapper::toResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return DictionaryEntryResponse.builder()
                .id(entry.getId())
                .surface(entry.getSurface())
                .lemma(entry.getLemma())
                .reading(entry.getReading())
                .romaji(entry.getRomaji())
                .jlptLevel(entry.getJlptLevel())
                .partOfSpeech(entry.getPartOfSpeech())
                .frequency(entry.getFrequency())
                .meanings(meaningResponses)
                .examples(exampleResponses)
                .build();
    }

    public static DictionaryMeaningResponse toResponse(DictionaryMeaning meaning) {
        if (meaning == null) {
            return null;
        }
        return DictionaryMeaningResponse.builder()
                .id(meaning.getId())
                .language(meaning.getLanguage())
                .meaning(meaning.getMeaning())
                .sortOrder(meaning.getSortOrder())
                .build();
    }

    public static DictionaryExampleResponse toResponse(DictionaryExample example) {
        if (example == null) {
            return null;
        }
        return DictionaryExampleResponse.builder()
                .id(example.getId())
                .japanese(example.getJapanese())
                .reading(example.getReading())
                .translation(example.getTranslation())
                .sortOrder(example.getSortOrder())
                .build();
    }
}
