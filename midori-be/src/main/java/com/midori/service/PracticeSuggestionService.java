package com.midori.service;

import com.midori.config.ShadowingEvaluationConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service that generates intelligent practice suggestions based on evaluation metrics.
 *
 * <p>This service provides rule-based suggestions when AI (Gemini) is not available
 * or has failed, ensuring students always receive actionable feedback.
 *
 * <p>Suggestion priority:
 * <ol>
 *   <li>AI suggestions (from Gemini)</li>
 *   <li>Rule-based suggestions (from this service)</li>
 *   <li>Generic default suggestions</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PracticeSuggestionService {

    private final ShadowingEvaluationConfig config;

    // ============================================================
    // Suggestion Thresholds (configurable)
    // ============================================================

    private static final int HIGH_SCORE_THRESHOLD = 90;
    private static final int GOOD_SIMILARITY_THRESHOLD = 85;
    private static final int ACCEPTABLE_SIMILARITY_THRESHOLD = 70;
    private static final int LOW_SIMILARITY_THRESHOLD = 60;
    private static final int GOOD_ACCURACY_THRESHOLD = 85;
    private static final int ACCEPTABLE_ACCURACY_THRESHOLD = 75;
    private static final double HIGH_CER_THRESHOLD = 0.35;
    private static final double VERY_HIGH_CER_THRESHOLD = 0.50;
    private static final double HIGH_WER_THRESHOLD = 0.45;
    private static final double VERY_HIGH_WER_THRESHOLD = 0.60;
    private static final int MANY_MISSING_WORDS_THRESHOLD = 2;
    private static final int MANY_WRONG_WORDS_THRESHOLD = 2;
    private static final int MANY_EXTRA_WORDS_THRESHOLD = 2;

    // ============================================================
    // Main Entry Point
    // ============================================================

    /**
     * Generate practice suggestions based on evaluation result.
     *
     * <p>This method should be called when:
     * <ul>
     *   <li>AI (Gemini) is not configured</li>
     *   <li>AI call failed or timed out</li>
     *   <li>needsAI is false but suggestions are still needed</li>
     * </ul>
     *
     * @param evaluated The evaluated sentence with all metrics
     * @return List of practice suggestions (never empty)
     */
    public List<String> generateSuggestions(EvaluatedSentence evaluated) {
        if (evaluated == null) {
            return getGenericSuggestions();
        }

        List<String> suggestions = new ArrayList<>();

        // Collect all metrics
        int overall = evaluated.getOverallScore();
        int accuracy = evaluated.getAccuracy();
        int similarity = evaluated.getSimilarity();
        double cer = evaluated.getCer();
        double wer = evaluated.getWer();
        List<String> missingWords = evaluated.getMissingWords();
        List<String> wrongWords = evaluated.getWrongWords();
        List<String> extraWords = evaluated.getExtraWords();

        int missingCount = missingWords != null ? missingWords.size() : 0;
        int wrongCount = wrongWords != null ? wrongWords.size() : 0;
        int extraCount = extraWords != null ? extraWords.size() : 0;

        // Priority 1: High score - acknowledge success
        if (overall >= HIGH_SCORE_THRESHOLD) {
            suggestions.addAll(getHighScoreSuggestions());
        }
        // Priority 2: Very low similarity - major issues
        else if (similarity < LOW_SIMILARITY_THRESHOLD) {
            suggestions.addAll(getLowSimilaritySuggestions());
        }
        // Priority 3: Low similarity - moderate issues
        else if (similarity < ACCEPTABLE_SIMILARITY_THRESHOLD) {
            suggestions.addAll(getModerateSimilaritySuggestions());
        }
        // Priority 4: Acceptable similarity but needs work
        else if (similarity < GOOD_SIMILARITY_THRESHOLD) {
            suggestions.addAll(getGoodSimilaritySuggestions(accuracy));
        }
        // Priority 5: Good performance
        else {
            suggestions.addAll(getExcellentPerformanceSuggestions(accuracy));
        }

        // Priority 6: Add metric-specific suggestions
        suggestions.addAll(getMetricSpecificSuggestions(
                cer, wer, missingCount, wrongCount, extraCount, accuracy
        ));

        // Remove duplicates while preserving order
        List<String> uniqueSuggestions = suggestions.stream()
                .distinct()
                .limit(5) // Max 5 suggestions
                .collect(Collectors.toList());

        // Ensure we always have at least one suggestion
        if (uniqueSuggestions.isEmpty()) {
            return getGenericSuggestions();
        }

        log.debug("[PracticeSuggestionService] Generated {} suggestions for overall={}", 
                uniqueSuggestions.size(), overall);

        return uniqueSuggestions;
    }

    /**
     * Generate suggestions when AI feedback is available.
     * Merges AI suggestions with rule-based suggestions for comprehensive feedback.
     *
     * @param evaluated The evaluated sentence
     * @param aiSuggestions Suggestions from Gemini (can be null or empty)
     * @return Combined list of suggestions, with AI suggestions taking priority
     */
    public List<String> generateWithAI(EvaluatedSentence evaluated, List<String> aiSuggestions) {
        List<String> suggestions = new ArrayList<>();

        // Add AI suggestions first (highest priority)
        if (aiSuggestions != null && !aiSuggestions.isEmpty()) {
            suggestions.addAll(aiSuggestions);
        }

        // Add supplementary rule-based suggestions
        List<String> ruleBased = generateSuggestions(evaluated);
        for (String suggestion : ruleBased) {
            if (!suggestions.contains(suggestion)) {
                suggestions.add(suggestion);
            }
        }

        // Limit to 5 total suggestions
        return suggestions.stream()
                .distinct()
                .limit(5)
                .collect(Collectors.toList());
    }

    // ============================================================
    // Suggestion Groups by Performance Level
    // ============================================================

    private List<String> getHighScoreSuggestions() {
        return Arrays.asList(
                "Phát âm xuất sắc! Hãy thử nói một cách tự nhiên hơn.",
                "Bạn đã rất gần với mẫu chuẩn. Hãy tiếp tục duy trì!",
                "Kỹ năng phát âm của bạn rất tốt. Thử tốc độ nhanh hơn một chút."
        );
    }

    private List<String> getLowSimilaritySuggestions() {
        return Arrays.asList(
                "Hãy phát âm chậm rãi và rõ ràng hơn.",
                "Nghe lại mẫu phát âm từ từ, từng câu một.",
                "Tập trung vào từng cụm từ một thay vì nói nhanh."
        );
    }

    private List<String> getModerateSimilaritySuggestions() {
        return Arrays.asList(
                "Phát âm của bạn đã dễ hiểu hơn, nhưng cần mượt mà hơn.",
                "Hãy nghe lại mẫu và chú ý đến ngữ điệu.",
                "Luyện tập từng câu 3-5 lần để cải thiện."
        );
    }

    private List<String> getGoodSimilaritySuggestions(int accuracy) {
        if (accuracy >= GOOD_ACCURACY_THRESHOLD) {
            return Arrays.asList(
                    "Phát âm của bạn khá tốt! Hãy tập trung vào sự liền mạch.",
                    "Thử nói với ngữ điệu tự nhiên hơn.",
                    "Lặp lại câu này thêm vài lần để hoàn thiện."
            );
        } else {
            return Arrays.asList(
                    "Chú ý đến cách phát âm từng từ một.",
                    "Hãy nghe và bắt chước từng âm tiết.",
                    "Luyện tập chậm rãi trước, sau đó tăng tốc độ."
            );
        }
    }

    private List<String> getExcellentPerformanceSuggestions(int accuracy) {
        if (accuracy >= GOOD_ACCURACY_THRESHOLD) {
            return Arrays.asList(
                    "Xuất sắc! Hãy thử phát âm một cách tự nhiên hơn.",
                    "Bạn đã rất gần với người bản ngữ. Tiếp tục phát huy!",
                    "Thử nói với cảm xúc tự nhiên hơn."
            );
        } else {
            return Arrays.asList(
                    "Phát âm tốt! Hãy chú ý đến từng âm tiết cụ thể.",
                    "Nghe lại và so sánh với mẫu chuẩn.",
                    "Lặp lại câu này thêm vài lần nữa."
            );
        }
    }

    // ============================================================
    // Metric-Specific Suggestions
    // ============================================================

    private List<String> getMetricSpecificSuggestions(
            double cer, double wer,
            int missingCount, int wrongCount, int extraCount,
            int accuracy) {
        
        List<String> suggestions = new ArrayList<>();

        // CER (Character Error Rate) - indicates character-level mistakes
        if (cer > VERY_HIGH_CER_THRESHOLD) {
            suggestions.add("Bạn đã phát âm sai nhiều ký tự. Hãy đọc lại từng âm tiết cẩn thận.");
            suggestions.add("Chú ý đến âm dài (long vowels) và thanh điệu.");
        } else if (cer > HIGH_CER_THRESHOLD) {
            suggestions.add("Một số ký tự chưa chính xác. Hãy nghe và phát âm lại.");
        }

        // WER (Word Error Rate) - indicates word-level mistakes
        if (wer > VERY_HIGH_WER_THRESHOLD) {
            suggestions.add("Bạn đã bỏ qua hoặc thêm nhiều từ không đúng. Hãy nghe lại toàn bộ câu.");
            suggestions.add("Đọc lại câu mà không bỏ qua bất kỳ từ nào.");
        } else if (wer > HIGH_WER_THRESHOLD) {
            suggestions.add("Một số từ chưa chính xác. Hãy chú ý đến từng từ.");
        }

        // Missing words
        if (missingCount >= MANY_MISSING_WORDS_THRESHOLD) {
            suggestions.add("Bạn đã bỏ qua " + missingCount + " từ. Hãy đọc lại toàn bộ câu mà không bỏ sót từ nào.");
            suggestions.add("Chú ý đến các từ bạn thường bỏ qua.");
        } else if (missingCount > 0) {
            suggestions.add("Hãy chú ý đến các từ bạn đã bỏ qua trong câu.");
        }

        // Wrong words
        if (wrongCount >= MANY_WRONG_WORDS_THRESHOLD) {
            suggestions.add("Có " + wrongCount + " từ phát âm chưa đúng. Hãy tập trung vào từ khó trước.");
            suggestions.add("Nghe từng từ một và bắt chước chính xác.");
        } else if (wrongCount > 0) {
            suggestions.add("Hãy chú ý đến những từ phát âm chưa chính xác.");
        }

        // Extra words
        if (extraCount >= MANY_EXTRA_WORDS_THRESHOLD) {
            suggestions.add("Bạn đã thêm " + extraCount + " từ không có trong câu gốc. Hãy nghe lại và chỉ phát âm đúng những từ trong mẫu.");
        } else if (extraCount > 0) {
            suggestions.add("Hãy chỉ phát âm đúng những từ có trong câu mẫu.");
        }

        // Low accuracy
        if (accuracy < ACCEPTABLE_ACCURACY_THRESHOLD) {
            if (!suggestions.stream().anyMatch(s -> s.contains("từng"))) {
                suggestions.add("Tập trung vào việc phát âm chính xác từng từ một.");
            }
        }

        return suggestions;
    }

    // ============================================================
    // Generic Fallback Suggestions
    // ============================================================

    private List<String> getGenericSuggestions() {
        return Arrays.asList(
                "Nghe lại mẫu phát âm và nhắm mắt theo dõi.",
                "Luyện tập câu này thêm 3-5 lần.",
                "Chú ý đến âm dài (long vowels) và thanh điệu.",
                "Hãy nói với tốc độ đều đặn và rõ ràng."
        );
    }
}
