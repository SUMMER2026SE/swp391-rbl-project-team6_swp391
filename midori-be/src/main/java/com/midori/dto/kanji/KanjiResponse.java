package com.midori.dto.kanji;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KanjiResponse {
    private String character;
    private String onyomi;
    private String kunyomi;
    private Integer strokeCount;
    private String radical;
    private String jlpt;
    private String meaning;
}
