package com.midori.service;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class TokenSimilarityCalculator {

    public double similarity(String a, String b) {
        if (a == null || b == null) {
            return 0;
        }
        List<String> tokensA = tokenize(a);
        List<String> tokensB = tokenize(b);
        if (tokensA.isEmpty() && tokensB.isEmpty()) {
            return 100.0;
        }
        Set<String> intersection = new HashSet<>(tokensA);
        intersection.retainAll(new HashSet<>(tokensB));
        int unionSize = new HashSet<>(tokensA).size() + new HashSet<>(tokensB).size() - intersection.size();
        return unionSize == 0 ? 100.0 : (intersection.size() * 100.0) / unionSize;
    }

    private List<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        String normalized = value.replaceAll("\\s+", " ");
        List<String> tokens = new ArrayList<>();
        int i = 0;
        while (i < normalized.length()) {
            int codePoint = normalized.codePointAt(i);
            int charCount = Character.charCount(codePoint);
            String token = normalized.substring(i, i + charCount);
            tokens.add(token);
            i += charCount;
        }
        return tokens;
    }
}
