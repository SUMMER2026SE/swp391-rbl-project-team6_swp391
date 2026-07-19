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
public class DictionaryDetailResponse {
    private UUID id;
    private String word; // surface
    private String reading;
    private String romaji;
    private String jlpt; // jlptLevel
    private Integer frequency;
    private String partOfSpeech;
    private List<DictionaryMeaningResponse> meanings;
    private List<DictionaryExampleResponse> examples;
    private List<DictionaryRelatedWordResponse> relatedWords;
}
