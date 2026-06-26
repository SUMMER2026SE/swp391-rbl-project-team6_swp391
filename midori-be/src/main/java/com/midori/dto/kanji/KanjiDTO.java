package com.midori.dto.kanji;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KanjiDTO {
    private String character;
    private String hanViet;
    private String meaning;
    private String mnemonic;
    private List<String> svgPaths;
    private List<String> strokeOrderImages;
}
