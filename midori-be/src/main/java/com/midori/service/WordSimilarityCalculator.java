package com.midori.service;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class WordSimilarityCalculator {

    public double similarity(String a, String b) {
        if (a == null || b == null) {
            return 0;
        }
        List<String> wordsA = tokenize(a);
        List<String> wordsB = tokenize(b);
        if (wordsA.isEmpty() && wordsB.isEmpty()) {
            return 100.0;
        }
        Set<String> intersection = new HashSet<>(wordsA);
        intersection.retainAll(new HashSet<>(wordsB));
        int unionSize = new HashSet<>(wordsA).size() + new HashSet<>(wordsB).size() - intersection.size();
        return unionSize == 0 ? 100.0 : (intersection.size() * 100.0) / unionSize;
    }

    private List<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return new ArrayList<>(List.of(value.split(" ")));
    }
}
