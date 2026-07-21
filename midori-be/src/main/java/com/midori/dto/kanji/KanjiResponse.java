package com.midori.dto.kanji;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KanjiResponse {
    private UUID id;
    private String character;
    private String onyomi;
    private String kunyomi;
    private Integer strokeCount;
    private String radical;
    private String jlpt;
    private String meaning;
    private String svgFile;
    private String mnemonic;
    private boolean svgAvailable;
}
