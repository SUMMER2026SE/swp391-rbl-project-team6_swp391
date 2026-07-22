package com.midori.dto.contentlibrary;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminAiContentGenerateResponse {

    private String skillType;
    private String level;
    private String warning;

    private AdminVocabularyAiDraft vocabularyDraft;
    private AdminGrammarAiDraft grammarDraft;
    private AdminReadingAiDraft readingDraft;
}
