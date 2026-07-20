package com.midori.service;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class WERCalculator {

    public double wer(String reference, String candidate) {
        if (reference == null || candidate == null) {
            return 1.0;
        }
        List<String> ref = tokenize(reference);
        List<String> hyp = tokenize(candidate);
        if (ref.isEmpty() && hyp.isEmpty()) {
            return 0.0;
        }
        int distance = levenshtein(ref, hyp);
        return ref.isEmpty() ? 1.0 : (distance * 1.0) / ref.size();
    }

    private List<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return new ArrayList<>(List.of(value.split(" ")));
    }

    private int levenshtein(List<String> a, List<String> b) {
        int m = a.size();
        int n = b.size();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= n; j++) {
            dp[0][j] = j;
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                int cost = Objects.equals(a.get(i - 1), b.get(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[m][n];
    }
}
