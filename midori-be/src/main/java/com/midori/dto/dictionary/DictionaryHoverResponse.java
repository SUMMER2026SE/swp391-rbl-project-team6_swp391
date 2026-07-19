package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryHoverResponse {
    private String word;
    private String reading;
    private String romaji;
    private String partOfSpeech;
    private List<String> meanings;
}
