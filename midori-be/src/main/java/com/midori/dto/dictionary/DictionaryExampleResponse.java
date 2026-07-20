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
public class DictionaryExampleResponse {
    private UUID id;
    private String japanese;
    private String reading;
    private String translation;
    private Integer sortOrder;
}
