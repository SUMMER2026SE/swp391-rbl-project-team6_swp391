package com.midori.ai.util;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.entity.QuestionType;

import java.util.ArrayList;
import java.util.List;

/**
 * Strict question-type validation for AI-generated and AI-imported questions.
 *
 * <p>Centralizes the rules that guarantee a question matches its declared type
 * at preview time, so the FE renderer can rely on the structure and the BE
 * save layer never receives a mismatched record.
 *
 * <p>Type contracts:
 * <ul>
 *   <li>{@code MULTIPLE_CHOICE} — at least 2 options, exactly one correct
 *       option, all options distinct.</li>
 *   <li>{@code TRUE_FALSE} — exactly 2 options, exactly one correct,
 *       option texts equivalent to True/False (case-insensitive).</li>
 *   <li>{@code FILL_BLANK} — question text must contain a blank marker
 *       ({@code ___}, {@code (blank)}, or the {@code 【答え】}
 *       Japanese bracket); the answer is a single text value.</li>
 *   <li>{@code SHORT_ANSWER} — question text is required; the answer is a
 *       single text value (no options).</li>
 *   <li>{@code MATCHING} — leftItems, rightItems, correctPairs metadata.</li>
 *   <li>{@code TRANSLATION} — translationMetadata with direction, sourceText,
 *       referenceAnswer.</li>
 *   <li>{@code SENTENCE_WRITING} — sentenceWritingMetadata with requiredVocabulary
 *       or requiredGrammar or referenceAnswer.</li>
 *   <li>{@code ERROR_CORRECTION} — errorCorrectionMetadata with incorrectText,
 *       correctedText, explanation.</li>
 * </ul>
 */
public final class QuestionTypeValidator {

    private QuestionTypeValidator() {}

    /** Returns {@code true} when the question satisfies its declared type contract. */
    public static boolean isValid(AiExamParseResponse.AiQuestionDto q) {
        if (q == null || q.getType() == null) return false;
        QuestionType type = normalize(q.getType());
        if (type == null) return false;
        String content = q.getContent() == null ? "" : q.getContent();
        List<AiExamParseResponse.AiAnswerDto> answers = q.getAnswers();
        switch (type) {
            case MULTIPLE_CHOICE:
                return validateMultipleChoice(answers);
            case TRUE_FALSE:
                return validateTrueFalse(answers);
            case FILL_BLANK:
                return validateFillBlank(content, answers);
            case SHORT_ANSWER:
                return validateShortAnswer(content, answers);
            case MATCHING:
                return validateMatching(answers);
            case TRANSLATION:
                return validateTranslation(q);
            case SENTENCE_WRITING:
                return validateSentenceWriting(q);
            case ERROR_CORRECTION:
                return validateErrorCorrection(q);
            default:
                return false;
        }
    }

    /** Return a list of repair actions needed to satisfy the declared type.
     *  The repair layer applies these in order. */
    public static List<String> repair(AiExamParseResponse.AiQuestionDto q) {
        List<String> actions = new ArrayList<>();
        if (q == null || q.getType() == null) return actions;
        QuestionType type = normalize(q.getType());
        if (type == null) return actions;
        String content = q.getContent() == null ? "" : q.getContent();
        List<AiExamParseResponse.AiAnswerDto> answers = q.getAnswers();

        switch (type) {
            case MULTIPLE_CHOICE: {
                if (answers == null || answers.size() < 2) {
                    actions.add("suppress");
                }
                long correct = answers == null ? 0 : answers.stream()
                        .filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect())).count();
                if (correct == 0 && answers != null && !answers.isEmpty()) {
                    actions.add("force_first_correct");
                }
                break;
            }
            case TRUE_FALSE: {
                if (answers == null || answers.size() != 2) {
                    actions.add("reset_true_false");
                } else {
                    String a = answers.get(0).getContent() == null ? "" : answers.get(0).getContent().trim();
                    String b = answers.get(1).getContent() == null ? "" : answers.get(1).getContent().trim();
                    if (!isTrue(a) || !isFalse(b)) {
                        actions.add("normalize_true_false_labels");
                    }
                    long correct = answers.stream()
                            .filter(x -> x != null && Boolean.TRUE.equals(x.getIsCorrect())).count();
                    if (correct != 1) {
                        actions.add("force_first_correct");
                    }
                }
                break;
            }
            case FILL_BLANK: {
                if (!hasBlankMarker(content)) {
                    actions.add("append_blank_marker");
                }
                if (answers != null && !answers.isEmpty()) {
                    actions.add("keep_first_answer_as_text");
                }
                break;
            }
            case SHORT_ANSWER: {
                if (answers != null && answers.size() > 1) {
                    actions.add("keep_first_answer_as_text");
                }
                break;
            }
            case MATCHING: {
                if (answers != null && answers.size() < 2) {
                    actions.add("suppress");
                }
                break;
            }
            case TRANSLATION: {
                if (q.getTranslationMetadata() == null) {
                    actions.add("suppress_translation_no_metadata");
                }
                break;
            }
            case SENTENCE_WRITING: {
                if (q.getSentenceWritingMetadata() == null) {
                    actions.add("suppress_sentence_writing_no_metadata");
                }
                break;
            }
            case ERROR_CORRECTION: {
                if (q.getErrorCorrectionMetadata() == null) {
                    actions.add("suppress_error_correction_no_metadata");
                }
                break;
            }
        }
        return actions;
    }

    /** Apply repair actions to the question in-place. */
    public static void applyRepairs(AiExamParseResponse.AiQuestionDto q, List<String> actions) {
        if (q == null || actions == null) return;
        QuestionType type = normalize(q.getType());
        if (type == null) return;
        List<AiExamParseResponse.AiAnswerDto> answers = q.getAnswers();
        for (String action : actions) {
            switch (action) {
                case "force_first_correct":
                    if (answers != null && !answers.isEmpty()) {
                        for (int i = 0; i < answers.size(); i++) {
                            answers.get(i).setIsCorrect(i == 0);
                        }
                    }
                    break;
                case "reset_true_false":
                case "normalize_true_false_labels": {
                    boolean first = answers != null && !answers.isEmpty() && Boolean.TRUE.equals(answers.get(0).getIsCorrect());
                    List<AiExamParseResponse.AiAnswerDto> tf = new ArrayList<>();
                    AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
                    a.setContent("True");
                    a.setIsCorrect(first);
                    AiExamParseResponse.AiAnswerDto b = new AiExamParseResponse.AiAnswerDto();
                    b.setContent("False");
                    b.setIsCorrect(!first);
                    tf.add(a);
                    tf.add(b);
                    q.setAnswers(tf);
                    break;
                }
                case "keep_first_answer_as_text": {
                    if (answers != null && !answers.isEmpty()) {
                        AiExamParseResponse.AiAnswerDto first = answers.get(0);
                        if (first.getContent() == null || first.getContent().isBlank()) {
                            first.setContent("");
                        }
                        first.setIsCorrect(true);
                        if (answers.size() > 1) {
                            answers.subList(1, answers.size()).clear();
                        }
                    }
                    break;
                }
                case "append_blank_marker": {
                    String content = q.getContent() == null ? "" : q.getContent();
                    if (!hasBlankMarker(content)) {
                        q.setContent(content + " ___");
                    }
                    break;
                }
                case "suppress":
                case "suppress_translation_no_metadata":
                case "suppress_sentence_writing_no_metadata":
                case "suppress_error_correction_no_metadata":
                    if (answers != null) answers.clear();
                    break;
                default:
                    break;
            }
        }
    }

    public static boolean validateMultipleChoice(List<AiExamParseResponse.AiAnswerDto> answers) {
        if (answers == null || answers.size() < 2) return false;
        long correct = answers.stream()
                .filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect())).count();
        if (correct != 1) return false;
        java.util.Set<String> seen = new java.util.HashSet<>();
        for (AiExamParseResponse.AiAnswerDto a : answers) {
            if (a == null || a.getContent() == null || a.getContent().isBlank()) return false;
            String key = a.getContent().trim().toLowerCase();
            if (!seen.add(key)) return false;
        }
        return true;
    }

    public static boolean validateTrueFalse(List<AiExamParseResponse.AiAnswerDto> answers) {
        if (answers == null || answers.size() != 2) return false;
        long correct = answers.stream()
                .filter(a -> a != null && Boolean.TRUE.equals(a.getIsCorrect())).count();
        if (correct != 1) return false;
        String a = answers.get(0).getContent() == null ? "" : answers.get(0).getContent().trim().toLowerCase();
        String b = answers.get(1).getContent() == null ? "" : answers.get(1).getContent().trim().toLowerCase();
        return isTrue(a) && isFalse(b);
    }

    public static boolean validateFillBlank(String content, List<AiExamParseResponse.AiAnswerDto> answers) {
        if (!hasBlankMarker(content)) return false;
        if (answers == null || answers.isEmpty()) return false;
        for (AiExamParseResponse.AiAnswerDto a : answers) {
            if (a == null || a.getContent() == null || a.getContent().isBlank()) return false;
        }
        return true;
    }

    public static boolean validateShortAnswer(String content, List<AiExamParseResponse.AiAnswerDto> answers) {
        if (content == null || content.isBlank()) return false;
        if (answers == null) return true;
        if (answers.size() > 1) return false;
        if (answers.size() == 1) {
            AiExamParseResponse.AiAnswerDto a = answers.get(0);
            if (a == null) return false;
        }
        return true;
    }

    public static boolean validateMatching(List<AiExamParseResponse.AiAnswerDto> answers) {
        return answers != null && answers.size() >= 2;
    }

    public static boolean validateTranslation(AiExamParseResponse.AiQuestionDto q) {
        if (q.getTranslationMetadata() == null) return false;
        var meta = q.getTranslationMetadata();
        if (meta.getDirection() == null || meta.getDirection().isBlank()) return false;
        if (meta.getReferenceAnswer() == null || meta.getReferenceAnswer().isBlank()) return false;
        if (meta.getSourceText() == null || meta.getSourceText().isBlank()) return false;
        return true;
    }

    public static boolean validateSentenceWriting(AiExamParseResponse.AiQuestionDto q) {
        if (q.getSentenceWritingMetadata() == null) return false;
        var meta = q.getSentenceWritingMetadata();
        boolean hasVocabulary = meta.getRequiredVocabulary() != null && !meta.getRequiredVocabulary().isEmpty();
        boolean hasGrammar = meta.getRequiredGrammar() != null && !meta.getRequiredGrammar().isEmpty();
        boolean hasReference = meta.getReferenceAnswer() != null && !meta.getReferenceAnswer().isBlank();
        return hasVocabulary || hasGrammar || hasReference;
    }

    public static boolean validateErrorCorrection(AiExamParseResponse.AiQuestionDto q) {
        if (q.getErrorCorrectionMetadata() == null) return false;
        var meta = q.getErrorCorrectionMetadata();
        if (meta.getIncorrectText() == null || meta.getIncorrectText().isBlank()) return false;
        if (meta.getCorrectedText() == null || meta.getCorrectedText().isBlank()) return false;
        if (meta.getExplanation() == null || meta.getExplanation().isBlank()) return false;
        return !meta.getIncorrectText().trim().equals(meta.getCorrectedText().trim());
    }

    public static boolean hasBlankMarker(String content) {
        if (content == null) return false;
        return content.contains("___")
                || content.toLowerCase().contains("(blank)")
                || content.contains("\u3010\u7b54\u3048\u3011")
                || content.contains("\u7b54\u3048\u3092\u5165\u308c\u3066\u304f\u3060\u3055\u3044")
                || content.toLowerCase().contains("fill in")
                || content.toLowerCase().contains("fill the blank")
                || content.toLowerCase().contains("fill in the blank");
    }

    public static boolean isTrue(String lower) {
        if (lower == null) return false;
        String val = lower.trim().toLowerCase();
        return val.equals("true") || val.equals("\u0111\u00fang") || val.equals("\u6b63")
                || val.equals("t") || val.equals("yes");
    }

    public static boolean isFalse(String lower) {
        if (lower == null) return false;
        String val = lower.trim().toLowerCase();
        return val.equals("false") || val.equals("sai") || val.equals("\u8aa4")
                || val.equals("f") || val.equals("no");
    }

    public static String canonicalizeTrueFalse(String val) {
        if (val == null) return null;
        if (isTrue(val)) {
            return "True";
        }
        if (isFalse(val)) {
            return "False";
        }
        return val;
    }

    /** Normalize the free-form type string to the canonical {@link QuestionType}.
     *  Returns {@code null} when the value is unknown. */
    public static QuestionType normalize(String raw) {
        if (raw == null) return null;
        String norm = raw.trim().toUpperCase().replace('-', '_').replace('/', '_').replace(' ', '_');
        switch (norm) {
            case "MULTIPLE_CHOICE":
            case "MCQ":
            case "MC":
                return QuestionType.MULTIPLE_CHOICE;
            case "TRUE_FALSE":
            case "TRUEFALSE":
            case "TF":
            case "TRUE_OR_FALSE":
                return QuestionType.TRUE_FALSE;
            case "FILL_BLANK":
            case "FILL_IN_BLANK":
            case "FILL_IN_THE_BLANK":
            case "FILLINTHEBLANK":
            case "FILL":
            case "BLANK":
                return QuestionType.FILL_BLANK;
            case "SHORT_ANSWER":
            case "SHORTANSWER":
            case "ESSAY":
            case "OPEN_ENDED":
                return QuestionType.SHORT_ANSWER;
            case "MATCHING":
            case "MATCH":
                return QuestionType.MATCHING;
            case "TRANSLATION":
            case "TRANSLATE":
            case "DICH":
                return QuestionType.TRANSLATION;
            case "SENTENCE_WRITING":
            case "SENTENCEWRITING":
            case "SENTENCE_CONSTRUCTION":
            case "WRITE_SENTENCE":
                return QuestionType.SENTENCE_WRITING;
            case "ERROR_CORRECTION":
            case "ERRORCORRECTION":
            case "CORRECTION":
            case "FIX_THE_ERROR":
                return QuestionType.ERROR_CORRECTION;
            default:
                return null;
        }
    }
}
