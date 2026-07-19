package com.midori.dto.tokenizer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JapaneseTokenResponse {
    private String surface;
    private String lemma;
    private String reading;
    private String partOfSpeech;
    private String dictionaryForm;
    private int characterOffset;
}
