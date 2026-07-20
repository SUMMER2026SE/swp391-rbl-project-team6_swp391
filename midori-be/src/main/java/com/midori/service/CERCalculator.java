package com.midori.service;

import org.springframework.stereotype.Component;

@Component
public class CERCalculator {

    public double cer(String reference, String candidate) {
        if (reference == null || candidate == null) {
            return 1.0;
        }
        int distance = levenshtein(reference, candidate);
        return reference.isEmpty() ? 0.0 : (distance * 1.0) / reference.length();
    }

    private int levenshtein(String a, String b) {
        int m = a.length();
        int n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= n; j++) {
            dp[0][j] = j;
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[m][n];
    }
}
