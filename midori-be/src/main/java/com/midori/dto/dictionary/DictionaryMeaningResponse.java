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
public class DictionaryMeaningResponse {
    private UUID id;
    private String language;
    private String meaning;
    private Integer sortOrder;
}
