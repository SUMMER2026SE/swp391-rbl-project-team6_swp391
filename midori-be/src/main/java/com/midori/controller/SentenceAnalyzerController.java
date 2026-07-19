package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.dictionary.SentenceAnalysisResponse;
import com.midori.dto.tokenizer.JapaneseTokenResponse;
import com.midori.service.JapaneseTokenizerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dictionary")
@RequiredArgsConstructor
@Validated
@Tag(name = "Sentence Analyzer", description = "Endpoints for analyzing and tokenizing complete Japanese sentences")
public class SentenceAnalyzerController {

    private final JapaneseTokenizerService tokenizerService;

    @Operation(summary = "Analyze sentence", description = "Segments a Japanese sentence into tokens with parts of speech, lemmas, and hiragana readings.")
    @GetMapping("/analyze")
    public ResponseEntity<ApiResponse<List<SentenceAnalysisResponse>>> analyze(
            @RequestParam("sentence") @NotBlank(message = "Sentence parameter must not be blank") String sentence) {

        List<JapaneseTokenResponse> rawTokens = tokenizerService.tokenize(sentence);

        List<SentenceAnalysisResponse> analyzed = rawTokens.stream()
                .map(t -> {
                    boolean isParticle = "particle".equalsIgnoreCase(t.getPartOfSpeech());
                    
                    String lemma = isParticle ? null : t.getLemma();
                    String reading = isParticle ? null : convertKatakanaToHiragana(t.getReading());

                    return SentenceAnalysisResponse.builder()
                            .surface(t.getSurface())
                            .lemma(lemma)
                            .reading(reading)
                            .pos(t.getPartOfSpeech())
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(analyzed));
    }

    private String convertKatakanaToHiragana(String text) {
        if (text == null) return null;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            // Katakana range \u30a1 to \u30f6 maps to Hiragana by subtracting 0x60
            if (c >= '\u30a1' && c <= '\u30f6') {
                sb.append((char) (c - 0x60));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
