package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Data
@Builder
@AllArgsConstructor
public class GenerateQuestionsResponse {

    private String materialId;
    private String materialTitle;
    private List<GeneratedQuestionDto> questions;
    private String errorMessage;
    private Boolean isFallback;
    private String source;

    /**
     * Blank marker pattern shared with the parser so the response mapper
     * applies the same structural rules as {@code AiServiceImpl.parseQuestionsFromJson}.
     */
    private static final Pattern BLANK_MARKER_PATTERN = Pattern.compile(
            "_{3,}|\\[BLANK\\]|\\{\\{\\s*blank\\s*\\}\\}",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Get questions mapped to frontend format (QuizQuestion).
     * Frontend expects: id, type, question, options, correctAnswer, explanation
     */
    public List<QuizQuestionResponse> getQuestionsForFrontend() {
        if (questions == null) return List.of();
        return questions.stream()
                .filter(q -> q.getQuestionText() != null && !q.getQuestionText().isBlank())
                .map(q -> {
                    String questionText = q.getQuestionText();
                    if (questionText == null || questionText.isBlank()) {
                        return null; // skip invalid
                    }

                    String correctAnswerText = q.getCorrectAnswer();
                    if ((correctAnswerText == null || correctAnswerText.isBlank())
                            && q.getOptions() != null && q.getCorrectAnswerIndex() != null
                            && q.getCorrectAnswerIndex() >= 0
                            && q.getCorrectAnswerIndex() < q.getOptions().size()) {
                        correctAnswerText = q.getOptions().get(q.getCorrectAnswerIndex());
                    }
                    if (correctAnswerText == null) correctAnswerText = "";
                    correctAnswerText = correctAnswerText.trim();
                    if (correctAnswerText.isEmpty()) {
                        // No usable answer — skip rather than ship an unanswerable question.
                        return null;
                    }

                    String explanation = q.getExplanation();
                    if (explanation == null) explanation = "";

                    // Normalize the per-question type using the full question
                    // payload (not just the type string). A MULTIPLE_CHOICE
                    // label with no options must never reach the frontend —
                    // either promote it to FILL_BLANK if the question has a
                    // blank marker, or drop it.
                    List<String> rawOptions = q.getOptions() == null ? List.of() : q.getOptions();
                    List<String> options = rawOptions.stream()
                            .filter(o -> o != null && !o.isBlank())
                            .map(String::trim)
                            .toList();
                    String type = AiServiceTypeResolver.resolve(
                            q.getType(), questionText, options, correctAnswerText);
                    if (type == null) {
                        // Cannot render this question safely.
                        return null;
                    }

                    // For TRUE_FALSE, ensure options are exactly ["Đúng", "Sai"]
                    if ("TRUE_FALSE".equals(type)) {
                        options = List.of("Đúng", "Sai");
                    }

                    // For FILL_BLANK, options must be empty.
                    if ("FILL_BLANK".equals(type)) {
                        options = List.of();
                    }

                    return QuizQuestionResponse.builder()
                            .id(q.getId() != null ? q.getId() : "q_" + questions.indexOf(q))
                            .type(type)
                            .question(questionText)
                            .options(options)
                            .correctAnswer(correctAnswerText)
                            .explanation(explanation)
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }
}

/**
 * Static helper that mirrors {@code AiServiceImpl.resolveQuestionType} so
 * the response mapper and the parser enforce the same structural rules.
 *
 * <p>Keep this in sync with the parser; any divergence between the two
 * would allow malformed questions to leak to the frontend.
 */
final class AiServiceTypeResolver {
    private static final Pattern BLANK_MARKER_PATTERN_LOCAL = Pattern.compile(
            "_{3,}|\\[BLANK\\]|\\{\\{\\s*blank\\s*\\}\\}",
            Pattern.CASE_INSENSITIVE
    );

    private AiServiceTypeResolver() {}

    private static boolean hasBlankMarker(String questionText) {
        if (questionText == null || questionText.isBlank()) {
            return false;
        }
        return BLANK_MARKER_PATTERN_LOCAL.matcher(questionText).find();
    }

    /**
     * Returns a canonical per-question type or {@code null} when the
     * question is unrecoverable and must be dropped.
     */
    static String resolve(String rawType, String questionText, List<String> options, String correctAnswer) {
        String upperType = rawType == null ? "" : rawType.trim().toUpperCase();
        boolean hasMarker = hasBlankMarker(questionText);
        boolean hasFillInstruction = questionText != null
                && (questionText.contains("Điền")
                || questionText.toLowerCase().contains("điền")
                || questionText.toLowerCase().contains("fill in")
                || questionText.toLowerCase().contains("hoàn thành"));
        boolean hasOptions = options != null && !options.isEmpty();
        boolean looksTrueFalse = hasOptions && options.size() == 2
                && ("Đúng".equalsIgnoreCase(options.get(0)) || "True".equalsIgnoreCase(options.get(0))
                || "T".equalsIgnoreCase(options.get(0)))
                && ("Sai".equalsIgnoreCase(options.get(1)) || "False".equalsIgnoreCase(options.get(1))
                || "F".equalsIgnoreCase(options.get(1)));

        switch (upperType) {
            case "MULTIPLE_CHOICE":
                if (hasOptions && options.size() >= 2) {
                    if (correctAnswer != null && !correctAnswer.isBlank()) {
                        for (String opt : options) {
                            if (opt != null && opt.equals(correctAnswer)) {
                                return "MULTIPLE_CHOICE";
                            }
                        }
                    }
                    if (hasMarker || hasFillInstruction) {
                        return "FILL_BLANK";
                    }
                    return null;
                }
                if (hasMarker || hasFillInstruction) {
                    return "FILL_BLANK";
                }
                return null;
            case "TRUE_FALSE":
                if (looksTrueFalse) {
                    return "TRUE_FALSE";
                }
                if (correctAnswer != null
                        && (correctAnswer.equalsIgnoreCase("Đúng")
                        || correctAnswer.equalsIgnoreCase("Sai")
                        || correctAnswer.equalsIgnoreCase("True")
                        || correctAnswer.equalsIgnoreCase("False"))) {
                    return "TRUE_FALSE";
                }
                return null;
            case "FILL_BLANK":
                return "FILL_BLANK";
            case "":
                if (looksTrueFalse) return "TRUE_FALSE";
                if (hasMarker || hasFillInstruction) return "FILL_BLANK";
                if (hasOptions && options.size() >= 2) return "MULTIPLE_CHOICE";
                return null;
            default:
                if (looksTrueFalse) return "TRUE_FALSE";
                if (hasMarker || hasFillInstruction) return "FILL_BLANK";
                if (hasOptions && options.size() >= 2) return "MULTIPLE_CHOICE";
                return null;
        }
    }
}

/**
 * Response DTO sent to frontend — see {@link QuizQuestionResponse}.
 *
 * <p>{@code QuizQuestionResponse} lives in its own file (it is a public
 * type so service-layer tests can reference it directly). The class is
 * still considered an implementation detail of
 * {@link GenerateQuestionsResponse#getQuestionsForFrontend()}.
 */
