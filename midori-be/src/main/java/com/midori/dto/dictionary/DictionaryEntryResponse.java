package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryEntryResponse {
    private UUID id;
    private String surface;
    private String lemma;
    private String reading;
    private String romaji;
    private String jlptLevel;
    private String partOfSpeech;
    private Integer frequency;
    private List<DictionaryMeaningResponse> meanings;
    private List<DictionaryExampleResponse> examples;
}
