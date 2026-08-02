package com.midori.ai.util;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.dto.WritingMode;
import com.midori.entity.Difficulty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Dedicated validator used strictly for isolated WRITING skill generation requests.
 * Evaluates questions against JA_TO_VI_TRANSLATION, VI_TO_JA_TRANSLATION, and SENTENCE_REORDER rules.
 * Does NOT run standard Vocabulary, Grammar, or Reading validators.
 */
public final class WritingQuestionValidator {

    private static final Logger log = LoggerFactory.getLogger(WritingQuestionValidator.class);

    private static final Pattern JAPANESE_CHAR_PATTERN = Pattern.compile("[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]");
    private static final Pattern VIETNAMESE_OR_LATIN_PATTERN = Pattern.compile("[a-zA-Z\u00C0-\u017F\u0102-\u01B0\u1EA0-\u1EF9]");
    private static final Pattern PUNCTUATION_PATTERN = Pattern.compile("[\u3002\u3001\\.,?!\\uFF1F\\uFF01:：\\uFF1A()（）「」『』\\[\\]【】［］<>〈〉/／\\\"\\'\\-\\_\\~\\～\\s]+");

    private static final List<String> PROHIBITED_ANSWERS = List.of(
            "corrected sentence",
            "present continuous form",
            "future tense",
            "future intent",
            "a specific grammar pattern",
            "two specific grammar points",
            "sample answer",
            "student answer may vary",
            "reference answer",
            "placeholder",
            "your answer here",
            "answer text",
            "example answer"
    );

    private static final List<String> MEANINGLESS_BLANKS = List.of(
            "write one sentence using",
            "correct the sentence",
            "include ___ and ___"
    );

    private WritingQuestionValidator() {}

    public static final class ValidationResult {
        public final boolean valid;
        public final String rejectionReason;
        public final WritingMode detectedMode;

        public ValidationResult(boolean valid, String rejectionReason, WritingMode detectedMode) {
            this.valid = valid;
            this.rejectionReason = rejectionReason;
            this.detectedMode = detectedMode;
        }

        public static ValidationResult ok(WritingMode mode) {
            return new ValidationResult(true, null, mode);
        }

        public static ValidationResult fail(String reason) {
            return new ValidationResult(false, reason, null);
        }
    }

    public static ValidationResult validate(AiExamParseResponse.AiQuestionDto q, WritingMode requestedMode) {
        if (q == null) {
            return ValidationResult.fail("null_question");
        }

        String content = q.getContent();
        if (content == null || content.isBlank()) {
            return ValidationResult.fail("blank_question");
        }

        String expectedAnswer = extractExpectedAnswer(q);
        if (expectedAnswer == null || expectedAnswer.isBlank()) {
            return ValidationResult.fail("missing_answer");
        }

        // Check against generic FILL_BLANK conversion & meaningless blanks
        if ("FILL_BLANK".equalsIgnoreCase(q.getType()) || "FILLINTHEBLANK".equalsIgnoreCase(q.getType()) ||
            "FILL_IN_BLANK".equalsIgnoreCase(q.getType()) || "MULTIPLE_CHOICE".equalsIgnoreCase(q.getType()) ||
            (q.getAnswers() != null && q.getAnswers().size() > 1)) {
            return ValidationResult.fail("converted_to_fill_blank_or_mcq");
        }
        String contentLower = content.toLowerCase();
        for (String blankPhrase : MEANINGLESS_BLANKS) {
            if (contentLower.contains(blankPhrase)) {
                return ValidationResult.fail("converted_to_fill_blank_or_mcq");
            }
        }
        if (contentLower.contains("(blank)") || content.contains("___") || (content.contains("A.") && content.contains("B."))) {
            return ValidationResult.fail("converted_to_fill_blank_or_mcq");
        }

        // Check against generic placeholder answers & descriptions of grammar concepts
        String answerLower = expectedAnswer.toLowerCase().trim();
        for (String prohibited : PROHIBITED_ANSWERS) {
            if (answerLower.contains(prohibited)) {
                return ValidationResult.fail("placeholder_answer");
            }
        }
        if (answerLower.startsWith("use ") || answerLower.startsWith("using ") || answerLower.startsWith("an answer that ")) {
            return ValidationResult.fail("grammar_concept_description");
        }

        // Determine target evaluation mode
        WritingMode modeToValidate = requestedMode != null ? requestedMode : WritingMode.MIXED_WRITING;
        if (modeToValidate == WritingMode.MIXED_WRITING) {
            modeToValidate = detectMode(content, expectedAnswer);
        }

        switch (modeToValidate) {
            case JA_TO_VI_TRANSLATION:
                return validateJaToVi(content, expectedAnswer);
            case VI_TO_JA_TRANSLATION:
                return validateViToJa(content, expectedAnswer);
            case SENTENCE_REORDER:
                return validateSentenceReorder(content, expectedAnswer);
            default:
                return validateJaToVi(content, expectedAnswer);
        }
    }

    public static WritingMode detectMode(String content, String expectedAnswer) {
        String contentLower = content != null ? content.toLowerCase() : "";
        if (content != null && (content.contains("/") || content.contains("／") || contentLower.contains("sắp xếp") || contentLower.contains("reorder") || contentLower.contains("thành một câu đúng"))) {
            return WritingMode.SENTENCE_REORDER;
        }
        if (contentLower.contains("sang tiếng việt") || contentLower.contains("to vietnamese") || contentLower.contains("sang việt")) {
            return WritingMode.JA_TO_VI_TRANSLATION;
        }
        if (contentLower.contains("sang tiếng nhật") || contentLower.contains("to japanese") || contentLower.contains("sang nhật")) {
            return WritingMode.VI_TO_JA_TRANSLATION;
        }
        // Fallback based on characters in expectedAnswer and content
        boolean answerHasJapanese = expectedAnswer != null && JAPANESE_CHAR_PATTERN.matcher(expectedAnswer).find();
        boolean contentHasJapanese = content != null && JAPANESE_CHAR_PATTERN.matcher(content).find();
        if (answerHasJapanese && !contentHasJapanese) {
            return WritingMode.VI_TO_JA_TRANSLATION;
        }
        if (!answerHasJapanese && contentHasJapanese) {
            return WritingMode.JA_TO_VI_TRANSLATION;
        }
        return WritingMode.JA_TO_VI_TRANSLATION;
    }

    private static ValidationResult validateJaToVi(String content, String expectedAnswer) {
        if (!JAPANESE_CHAR_PATTERN.matcher(content).find()) {
            return ValidationResult.fail("ja_to_vi_source_no_japanese");
        }
        if (!VIETNAMESE_OR_LATIN_PATTERN.matcher(expectedAnswer).find()) {
            return ValidationResult.fail("translation_direction_mismatch");
        }
        String cleanAnswer = PUNCTUATION_PATTERN.matcher(expectedAnswer).replaceAll("").trim();
        if (cleanAnswer.length() > 0 && !VIETNAMESE_OR_LATIN_PATTERN.matcher(cleanAnswer).find()) {
            return ValidationResult.fail("translation_direction_mismatch");
        }
        return ValidationResult.ok(WritingMode.JA_TO_VI_TRANSLATION);
    }

    private static ValidationResult validateViToJa(String content, String expectedAnswer) {
        if (!VIETNAMESE_OR_LATIN_PATTERN.matcher(content).find()) {
            return ValidationResult.fail("vi_to_ja_source_no_vietnamese");
        }
        if (!JAPANESE_CHAR_PATTERN.matcher(expectedAnswer).find()) {
            if (VIETNAMESE_OR_LATIN_PATTERN.matcher(expectedAnswer).find()) {
                return ValidationResult.fail("romaji_content");
            }
            return ValidationResult.fail("translation_direction_mismatch");
        }
        return ValidationResult.ok(WritingMode.VI_TO_JA_TRANSLATION);
    }

    private static ValidationResult validateSentenceReorder(String content, String expectedAnswer) {
        if (!JAPANESE_CHAR_PATTERN.matcher(expectedAnswer).find()) {
            return ValidationResult.fail("reorder_answer_not_japanese");
        }

        List<String> rawTokens = extractReorderTokens(content);
        if (rawTokens.size() < 2) {
            return ValidationResult.fail("reorder_insufficient_tokens");
        }

        List<String> cleanTokens = new ArrayList<>();
        for (String tok : rawTokens) {
            String c = PUNCTUATION_PATTERN.matcher(tok).replaceAll("").trim();
            if (!c.isEmpty()) {
                cleanTokens.add(c);
            }
        }
        if (cleanTokens.size() < 2) {
            return ValidationResult.fail("reorder_insufficient_tokens");
        }

        String cleanAnswer = PUNCTUATION_PATTERN.matcher(expectedAnswer).replaceAll("").trim();

        // Check all tokens are present in answer
        for (String tok : cleanTokens) {
            if (!cleanAnswer.contains(tok)) {
                return ValidationResult.fail("reorder_missing_tokens");
            }
        }

        // Check for duplicates or extra tokens by removing tokens longest-first
        List<String> sortedTokens = new ArrayList<>(cleanTokens);
        sortedTokens.sort((a, b) -> Integer.compare(b.length(), a.length()));

        String temp = cleanAnswer;
        for (String tok : sortedTokens) {
            int idx = temp.indexOf(tok);
            if (idx == -1) {
                return ValidationResult.fail("reorder_duplicated_tokens");
            }
            temp = temp.substring(0, idx) + temp.substring(idx + tok.length());
        }

        if (!temp.isBlank()) {
            return ValidationResult.fail("reorder_duplicated_tokens");
        }

        return ValidationResult.ok(WritingMode.SENTENCE_REORDER);
    }

    private static List<String> extractReorderTokens(String content) {
        List<String> tokens = new ArrayList<>();
        if (content == null) return tokens;

        String[] lines = content.split("\\r?\\n");
        String targetLine = null;
        for (String line : lines) {
            if (line.contains("/") || line.contains("／")) {
                targetLine = line;
                break;
            }
        }
        if (targetLine == null) {
            targetLine = content;
        }

        if (targetLine.contains(":") || targetLine.contains("：")) {
            int idx = Math.max(targetLine.lastIndexOf(':'), targetLine.lastIndexOf('：'));
            targetLine = targetLine.substring(idx + 1);
        }

        String[] parts = targetLine.split("[/／]");
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i].trim();
            if (i == 0) {
                Matcher matcher = JAPANESE_CHAR_PATTERN.matcher(p);
                if (matcher.find()) {
                    int firstJa = matcher.start();
                    if (firstJa > 0) {
                        p = p.substring(firstJa);
                    }
                }
            }
            if (!p.isEmpty()) {
                tokens.add(p);
            }
        }
        return tokens;
    }

    public static String extractExpectedAnswer(AiExamParseResponse.AiQuestionDto q) {
        if (q == null) return null;
        if (q.getAnswers() != null && !q.getAnswers().isEmpty()) {
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (Boolean.TRUE.equals(a.getIsCorrect()) && a.getContent() != null && !a.getContent().isBlank()) {
                    return a.getContent().trim();
                }
            }
            AiExamParseResponse.AiAnswerDto first = q.getAnswers().get(0);
            if (first != null && first.getContent() != null && !first.getContent().isBlank()) {
                return first.getContent().trim();
            }
        }
        if (q.getSentenceWritingMetadata() != null && q.getSentenceWritingMetadata().getReferenceAnswer() != null) {
            return q.getSentenceWritingMetadata().getReferenceAnswer().trim();
        }
        if (q.getTranslationMetadata() != null && q.getTranslationMetadata().getReferenceAnswer() != null) {
            return q.getTranslationMetadata().getReferenceAnswer().trim();
        }
        return null;
    }

    public static AiExistingQuestionParser.GenerateSanitizeResult sanitizeWritingQuestions(
            List<AiExamParseResponse.AiQuestionDto> rawQuestions,
            WritingMode requestedMode,
            String sourcePassage,
            Map<Difficulty, Integer> targetDistribution) {

        List<AiExamParseResponse.AiQuestionDto> input = rawQuestions == null ? Collections.emptyList() : rawQuestions;
        int rawCount = input.size();
        List<AiExamParseResponse.AiQuestionDto> accepted = new ArrayList<>();
        Map<String, Integer> droppedByReason = new LinkedHashMap<>();

        for (AiExamParseResponse.AiQuestionDto q : input) {
            if (q == null) continue;

            ValidationResult res = validate(q, requestedMode);
            if (!res.valid) {
                String reason = res.rejectionReason != null ? res.rejectionReason : "invalid_writing_question";
                droppedByReason.merge(reason, 1, Integer::sum);
                log.debug("[WritingValidator] Rejected question '{}': {}", q.getContent(), reason);
                continue;
            }

            // Ensure single text answer format with SHORT_ANSWER type
            String answerText = extractExpectedAnswer(q);
            List<AiExamParseResponse.AiAnswerDto> formattedAnswers = new ArrayList<>();
            AiExamParseResponse.AiAnswerDto ans = new AiExamParseResponse.AiAnswerDto();
            ans.setContent(answerText);
            ans.setIsCorrect(true);
            formattedAnswers.add(ans);
            q.setAnswers(formattedAnswers);
            q.setType("SHORT_ANSWER");
            q.setCategory("Writing");

            accepted.add(q);
        }

        Map<String, Integer> catCounts = Map.of("Writing", accepted.size());
        return new AiExistingQuestionParser.GenerateSanitizeResult(
                accepted, rawCount, accepted.size(), droppedByReason, catCounts, catCounts, sourcePassage);
    }
}
