package com.midori.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class SimilarityEngine {

    private final CharacterSimilarityCalculator characterSimilarityCalculator;
    private final WordSimilarityCalculator wordSimilarityCalculator;
    private final TokenSimilarityCalculator tokenSimilarityCalculator;
    private final LevenshteinCalculator levenshteinCalculator;
    private final WERCalculator werCalculator;
    private final CERCalculator cerCalculator;

    public SimilarityEngine(CharacterSimilarityCalculator characterSimilarityCalculator,
                            WordSimilarityCalculator wordSimilarityCalculator,
                            TokenSimilarityCalculator tokenSimilarityCalculator,
                            LevenshteinCalculator levenshteinCalculator,
                            WERCalculator werCalculator,
                            CERCalculator cerCalculator) {
        this.characterSimilarityCalculator = characterSimilarityCalculator;
        this.wordSimilarityCalculator = wordSimilarityCalculator;
        this.tokenSimilarityCalculator = tokenSimilarityCalculator;
        this.levenshteinCalculator = levenshteinCalculator;
        this.werCalculator = werCalculator;
        this.cerCalculator = cerCalculator;
    }

    public SimilarityResult calculate(String reference, String student) {
        if (reference == null || student == null) {
            return new SimilarityResult(0, List.of(), List.of(), List.of(), SimilarityMetrics.builder().build());
        }

        String normalizedReference = normalize(reference);
        String normalizedStudent = normalize(student);

        if (normalizedReference.equalsIgnoreCase(normalizedStudent)) {
            return new SimilarityResult(100, List.of(), List.of(), List.of(), SimilarityMetrics.builder().build());
        }

        double characterSimilarity = characterSimilarityCalculator.similarity(normalizedReference, normalizedStudent);
        double wordSimilarity = wordSimilarityCalculator.similarity(normalizedReference, normalizedStudent);
        double tokenSimilarity = tokenSimilarityCalculator.similarity(normalizedReference, normalizedStudent);
        int levenshteinDistance = levenshteinCalculator.distance(normalizedReference, normalizedStudent);
        double cer = cerCalculator.cer(normalizedReference, normalizedStudent);
        double wer = werCalculator.wer(normalizedReference, normalizedStudent);

        List<String> refWords = toWords(normalizedReference);
        List<String> studentWords = toWords(normalizedStudent);
        List<String> missing = new ArrayList<>();
        List<String> extra = new ArrayList<>();
        List<String> wrong = new ArrayList<>();

        Set<String> studentWordSet = new HashSet<>(studentWords);
        for (String word : refWords) {
            if (!studentWordSet.contains(word)) {
                missing.add(word);
            }
        }

        Set<String> refWordSet = new HashSet<>(refWords);
        for (String word : studentWords) {
            if (!refWordSet.contains(word)) {
                extra.add(word);
            }
        }

        int wordIndex = 0;
        for (String refWord : refWords) {
            if (wordIndex < studentWords.size() && !refWord.equals(studentWords.get(wordIndex))) {
                wrong.add(refWord);
            }
            if (wordIndex < studentWords.size()) {
                wordIndex++;
            } else {
                wrong.add(refWord);
            }
        }

        int similarity = (int) Math.round(Math.max(0, Math.min(100, characterSimilarity)));
        return new SimilarityResult(
                similarity,
                missing,
                extra,
                wrong,
                SimilarityMetrics.builder()
                        .characterSimilarity(characterSimilarity)
                        .wordSimilarity(wordSimilarity)
                        .tokenSimilarity(tokenSimilarity)
                        .levenshteinDistance(levenshteinDistance)
                        .cer(cer)
                        .wer(wer)
                        .missingWordsCount(missing.size())
                        .extraWordsCount(extra.size())
                        .wrongWordsCount(wrong.size())
                        .build()
        );
    }

    private String normalize(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", " ").trim();
    }

    private List<String> toWords(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return new ArrayList<>(List.of(value.split(" ")));
    }
}
