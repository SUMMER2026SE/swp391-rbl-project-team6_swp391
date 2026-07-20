package com.midori.dto.dictionary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DictionaryRelatedWordResponse {
    private UUID id;
    private String word;
    private String reading;
    private String romaji;
}
