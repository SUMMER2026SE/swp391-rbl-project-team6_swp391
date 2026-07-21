package com.midori.service;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.ai.util.DifficultyDistribution;
import com.midori.ai.util.QuestionTypeValidator;
import com.midori.entity.*;
import com.midori.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reusable AI content generation service.
 * Provides building blocks for any AI-powered content generation from lesson material.
 * Used by TeacherExamAiService.
 *
 * <p>Architecture:
 * <ul>
 *   <li>{@link #buildLearningContent(String, Integer, List)} - fetch lesson content from DB</li>
 *   <li>{@link #generateQuestions(String, String, int, String, List)} - call AI</li>
 *   <li>{@link #sanitizeAndWrap(String, AiExistingQuestionParser.GenerateSanitizeResult)} - sanitize + wrap response</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiLearningContentService {

    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final GrammarLessonRepository grammarLessonRepository;
    private final ReadingLessonRepository readingLessonRepository;
    private final ListeningLessonRepository listeningLessonRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final GrammarContentRepository grammarContentRepository;
    private final GrammarExampleRepository grammarExampleRepository;
    private final com.midori.ai.core.AiCoreService aiCoreService;
    private final ObjectMapper objectMapper;

    /**
     * Build a combined learning content string from all relevant lesson types
     * for the given level and lesson number.
     * Uses targeted queries - no findAll() + in-memory filter.
     *
     * <p>Output format includes sections for vocabulary, grammar, reading and
     * listening lessons, each with their content and examples.
     *
     * @param level   JLPT level (N5, N4, ...)
     * @param lessonNumber the lesson number within that level
     * @param skills list of skills to include (VOCABULARY, GRAMMAR, READING, LISTENING)
     * @return formatted learning content string, or blank string if no content found
     */
    @Transactional(readOnly = true)
    public String buildLearningContent(String level, Integer lessonNumber, List<String> skills) {
        StringBuilder sb = new StringBuilder();

        // Header with lesson info
        sb.append("========================================\n");
        sb.append("LESSON INFORMATION\n");
        sb.append("========================================\n");
        sb.append("JLPT Level: ").append(level).append("\n");
        sb.append("Lesson Number: ").append(lessonNumber).append("\n\n");

        // Vocabulary - single targeted query
        if (skillsContains(skills, "VOCABULARY")) {
            vocabularyLessonRepository.findByJlptLevelAndLessonNumber(level, lessonNumber)
                    .ifPresent(vocab -> {
                        sb.append("========================================\n");
                        sb.append("VOCABULARY\n");
                        sb.append("========================================\n");
                        sb.append("Lesson: ").append(vocab.getTitle()).append("\n\n");
                        if (vocab.getDescription() != null && !vocab.getDescription().isBlank()) {
                            sb.append(vocab.getDescription()).append("\n\n");
                        }
                        List<VocabularyItem> items = vocabularyItemRepository
                                .findByVocabularyLessonIdOrderByItemOrderAsc(vocab.getId());
                        if (items.isEmpty()) {
                            sb.append("(No vocabulary items found)\n");
                        }
                        for (VocabularyItem item : items) {
                            sb.append("- ").append(item.getJapanese());
                            if (item.getFurigana() != null && !item.getFurigana().isBlank()) {
                                sb.append(" [").append(item.getFurigana()).append("]");
                            }
                            sb.append(": ").append(item.getMeaning());
                            if (item.getPartOfSpeech() != null && !item.getPartOfSpeech().isBlank()) {
                                sb.append(" [").append(item.getPartOfSpeech()).append("]");
                            }
                            if (item.getExampleSentence() != null && !item.getExampleSentence().isBlank()) {
                                sb.append("\n  Example: ").append(item.getExampleSentence());
                                if (item.getExampleTranslation() != null && !item.getExampleTranslation().isBlank()) {
                                    sb.append(" - ").append(item.getExampleTranslation());
                                }
                            }
                            sb.append("\n");
                        }
                        sb.append("\n");
                    });
        }

        // Grammar - single targeted query
        if (skillsContains(skills, "GRAMMAR")) {
            grammarLessonRepository.findByJlptLevelAndLessonNumber(level, lessonNumber)
                    .ifPresent(grammar -> {
                        sb.append("========================================\n");
                        sb.append("GRAMMAR\n");
                        sb.append("========================================\n");
                        sb.append("Lesson: ").append(grammar.getTitle()).append("\n\n");
                        if (grammar.getDescription() != null && !grammar.getDescription().isBlank()) {
                            sb.append(grammar.getDescription()).append("\n\n");
                        }
                        List<GrammarContent> contents = grammarContentRepository
                                .findByGrammarLessonIdOrderByContentOrderAsc(grammar.getId());
                        if (contents.isEmpty()) {
                            sb.append("(No grammar patterns found)\n");
                        }
                        for (GrammarContent content : contents) {
                            if (content.getPattern() != null && !content.getPattern().isBlank()) {
                                sb.append("- Pattern: ").append(content.getPattern());
                                if (content.getMeaning() != null && !content.getMeaning().isBlank()) {
                                    sb.append(" - Meaning: ").append(content.getMeaning());
                                }
                                sb.append("\n");
                            }
                            if (content.getStructure() != null && !content.getStructure().isBlank()) {
                                sb.append("  Structure: ").append(content.getStructure()).append("\n");
                            }
                            if (content.getUsage() != null && !content.getUsage().isBlank()) {
                                sb.append("  Usage: ").append(content.getUsage()).append("\n");
                            }
                            if (content.getExamples() == null || content.getExamples().isEmpty()) {
                                List<GrammarExample> examples = grammarExampleRepository
                                        .findByGrammarContentIdOrderByExampleOrderAsc(content.getId());
                                for (GrammarExample ex : examples) {
                                    appendExample(sb, ex);
                                }
                            } else {
                                for (GrammarExample ex : content.getExamples()) {
                                    appendExample(sb, ex);
                                }
                            }
                            sb.append("\n");
                        }
                        sb.append("\n");
                    });
        }

        // Reading - single targeted query
        if (skillsContains(skills, "READING")) {
            readingLessonRepository.findByJlptLevelAndLessonNumber(level, lessonNumber)
                    .ifPresent(reading -> {
                        sb.append("========================================\n");
                        sb.append("READING\n");
                        sb.append("========================================\n");
                        sb.append("Lesson: ").append(reading.getTitle()).append("\n\n");
                        if (reading.getPassage() != null && !reading.getPassage().isBlank()) {
                            sb.append("Passage:\n").append(reading.getPassage()).append("\n\n");
                        }
                        if (reading.getVietnameseTranslation() != null &&
                                !reading.getVietnameseTranslation().isBlank()) {
                            sb.append("Translation:\n").append(reading.getVietnameseTranslation()).append("\n\n");
                        }
                    });
        }

        // Listening - single targeted query
        if (skillsContains(skills, "LISTENING")) {
            listeningLessonRepository.findByJlptLevelAndLessonNumber(level, lessonNumber)
                    .ifPresent(listening -> {
                        sb.append("========================================\n");
                        sb.append("LISTENING\n");
                        sb.append("========================================\n");
                        sb.append("Lesson: ").append(listening.getTitle()).append("\n\n");
                        if (listening.getTranscript() != null && !listening.getTranscript().isBlank()) {
                            sb.append("Transcript:\n").append(listening.getTranscript()).append("\n\n");
                        }
                    });
        }

        return sb.toString();
    }

    private void appendExample(StringBuilder sb, GrammarExample ex) {
        if (ex.getJapanese() != null && !ex.getJapanese().isBlank()) {
            sb.append("  Example: ").append(ex.getJapanese());
            if (ex.getVietnameseMeaning() != null && !ex.getVietnameseMeaning().isBlank()) {
                sb.append(" - ").append(ex.getVietnameseMeaning());
            }
            sb.append("\n");
        }
    }

    private boolean skillsContains(List<String> skills, String skill) {
        if (skills == null || skills.isEmpty()) return false;
        return skills.stream()
                .anyMatch(s -> s != null && s.equalsIgnoreCase(skill));
    }

    /**
     * Call AI to generate questions from the provided learning content.
     * Parses and sanitizes the response using the existing infrastructure.
     *
     * @param materialTitle    title for logging
     * @param learningContent  the formatted learning content string
     * @param questionCount   how many questions to generate
     * @param difficulty      EASY, MEDIUM, or HARD
     * @param selectedSkills   skills to include
     * @return AiExamParseResponse with sanitized questions
     */
    public AiExamParseResponse generateQuestions(String materialTitle, String learningContent,
                                                int questionCount, String difficulty,
                                                List<String> selectedSkills) {
        return generateQuestions(materialTitle, learningContent, questionCount, difficulty, selectedSkills, null);
    }

    /**
     * Call AI to generate questions from the provided learning content, with optional source passage.
     */
    public AiExamParseResponse generateQuestions(String materialTitle, String learningContent,
                                                int questionCount, String difficulty,
                                                List<String> selectedSkills, String sourcePassage) {
        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[AiLearningContent] No content to generate questions from");
            return AiExamParseResponse.empty();
        }

        log.info("[AiLearningContent] Generating {} questions for: {}", questionCount, materialTitle);

        List<AiExamParseResponse.AiQuestionDto> merged = new ArrayList<>();
        int attempt = 0;
        int maxAttempts = 5;
        while (attempt < maxAttempts) {
            int needed = questionCount - merged.size();
            if (needed <= 0) break;

            String attemptPromptContent = learningContent;
            if (attempt > 0 && !merged.isEmpty()) {
                StringBuilder sb = new StringBuilder(learningContent);
                sb.append("\n\nGenerate exactly ").append(needed).append(" NEW questions.\n");
                sb.append("Do not repeat or paraphrase any of the following existing questions:\n");
                int limit = Math.min(merged.size(), 15);
                for (int i = 0; i < limit; i++) {
                    sb.append("- ").append(merged.get(i).getContent()).append("\n");
                }
                sb.append("Return only the requested JSON question array.\n");
                attemptPromptContent = sb.toString();
            }

            String rawResponse = aiCoreService.generateQuestions(
                    materialTitle,
                    attemptPromptContent,
                    needed,
                    "MULTIPLE_CHOICE",
                    difficulty,
                    selectedSkills
            );

            AiExamParseResponse parsed = parseAiResponse(rawResponse);

            AiExistingQuestionParser.GenerateSanitizeResult sanitized =
                    AiExistingQuestionParser.sanitizeGeneratedQuestions(
                            parsed.getQuestions(),
                            selectedSkills,
                            sourcePassage
                    );

            Set<String> seen = new HashSet<>();
            for (AiExamParseResponse.AiQuestionDto existing : merged) {
                seen.add(fingerprint(existing));
            }

            int added = 0;
            for (AiExamParseResponse.AiQuestionDto q : sanitized.questions) {
                String fp = fingerprint(q);
                if (!seen.add(fp)) continue;
                merged.add(q);
                added++;
                if (merged.size() >= questionCount) break;
            }

            log.info("[AiDiagnostic] Flow: SINGLE_DIFFICULTY, Attempt: {}, Total Requested: {}, Missing Requested: {}, Raw/Parsed: {}, Sanitized/Validated: {}, Unique New: {}, Merged Total: {}/{}, Rejected By Reason: {}",
                    attempt + 1,
                    questionCount,
                    needed,
                    parsed.getQuestions() != null ? parsed.getQuestions().size() : 0,
                    sanitized.finalCount,
                    added,
                    merged.size(),
                    questionCount,
                    sanitized.droppedByReason);

            if (merged.size() >= questionCount) break;
            attempt++;
        }

        applyBalancedRandomization(merged);

        AiExamParseResponse response = new AiExamParseResponse();
        response.setTitle(materialTitle);
        response.setDescription("AI-generated questions from " + materialTitle);
        response.setQuestions(merged);

        if (merged.size() < questionCount) {
            String msg = "AI generated " + merged.size() + " of " + questionCount
                    + " valid questions. Please retry.";
            if (merged.isEmpty()) {
                response.setErrorMessage(msg);
            }
            log.warn("[AiLearningContent] Shortfall on {}: {}", materialTitle, msg);
        } else {
            log.info("[AiLearningContent] Successfully generated {} questions for {}", merged.size(), materialTitle);
        }
        return response;
    }

    /**
     * Strict distribution-aware generation entry point.
     *
     * <p>Behavior:
     * <ol>
     *   <li>Validates {@code totalCount} (1..{@link DifficultyDistribution#MAX_QUESTIONS})
     *       and {@code easyPct}/{@code mediumPct}/{@code hardPct} (must sum to exactly 100).</li>
     *   <li>Computes the deterministic per-difficulty counts via
     *       {@link DifficultyDistribution#allocate(int, int, int, int)}.</li>
     *   <li>Calls {@link AiCoreService#generateQuestionsWithDistribution} so
     *       the prompt explicitly requests the exact split.</li>
     *   <li>Sanitizes the AI response through
     *       {@link AiExistingQuestionParser#sanitizeGeneratedQuestionsWithTypeAndDistribution}
     *       which enforces the strict question type and the per-difficulty
     *       capacity. Excess questions are dropped; missing questions are
     *       recovered by retrying with the missing bucket counts only.</li>
     *   <li>Stops after {@link #MAX_SUPPLEMENT_ATTEMPTS} attempts and surfaces
     *       a clear error message when the requested total cannot be reached.</li>
     * </ol>
     *
     * @return a response whose {@code questions.size() == totalCount} on success,
     *         or whose {@code errorMessage} explains the shortfall.
     */
    public AiExamParseResponse generateQuestionsWithDistribution(
            String materialTitle,
            String learningContent,
            int totalCount,
            String questionTypeRaw,
            int easyPct, int mediumPct, int hardPct,
            List<String> selectedSkills,
            String sourcePassage) {

        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[AiLearningContent] No content to generate questions from");
            AiExamParseResponse empty = AiExamParseResponse.empty();
            empty.setErrorMessage("Learning content is empty. Please upload a different PDF.");
            return empty;
        }

        DifficultyDistribution.validateCount(totalCount);
        DifficultyDistribution.validatePercentages(easyPct, mediumPct, hardPct);
        QuestionType expectedType = QuestionTypeValidator.normalize(questionTypeRaw);
        if (expectedType == null) {
            throw new IllegalArgumentException("Unsupported question type: " + questionTypeRaw);
        }
        Map<Difficulty, Integer> distribution =
                DifficultyDistribution.allocate(totalCount, easyPct, mediumPct, hardPct);

        log.info("[AiLearningContent] Generating {} questions (type={}, distribution={}) for: {}",
                totalCount, expectedType, DifficultyDistribution.formatForPrompt(distribution),
                materialTitle);

        // Strategy: ask for the full distribution on the first attempt.
        // If we are short, supplement per-difficulty for the missing buckets only.
        Map<Difficulty, Integer> remaining = new java.util.EnumMap<>(Difficulty.class);
        remaining.put(Difficulty.EASY, distribution.getOrDefault(Difficulty.EASY, 0));
        remaining.put(Difficulty.MEDIUM, distribution.getOrDefault(Difficulty.MEDIUM, 0));
        remaining.put(Difficulty.HARD, distribution.getOrDefault(Difficulty.HARD, 0));

        List<AiExamParseResponse.AiQuestionDto> merged = new ArrayList<>();
        int attempt = 0;
        while (attempt <= MAX_SUPPLEMENT_ATTEMPTS) {
            Map<Difficulty, Integer> request = cloneMap(remaining);
            int requestTotal = sumValues(request);
            if (requestTotal <= 0) break;

            String attemptPromptContent = learningContent;
            if (attempt > 0 && !merged.isEmpty()) {
                StringBuilder sb = new StringBuilder(learningContent);
                sb.append("\n\nGenerate exactly ").append(requestTotal).append(" NEW questions.\n");
                sb.append("Do not repeat or paraphrase any of the following existing questions:\n");
                int limit = Math.min(merged.size(), 15);
                for (int i = 0; i < limit; i++) {
                    sb.append("- ").append(merged.get(i).getContent()).append("\n");
                }
                sb.append("Return only the requested JSON question array.\n");
                attemptPromptContent = sb.toString();
            }

            String distributionLine = DifficultyDistribution.formatForPrompt(request);
            String rawResponse = aiCoreService.generateQuestionsWithDistribution(
                    materialTitle,
                    attemptPromptContent,
                    requestTotal,
                    expectedType.name(),
                    distributionLine,
                    selectedSkills);

            AiExamParseResponse parsed = parseAiResponse(rawResponse);
            AiExistingQuestionParser.GenerateSanitizeResult sanitized =
                    AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                            parsed.getQuestions(),
                            selectedSkills,
                            sourcePassage,
                            expectedType,
                            request);

            // Merge while preserving order; dedupe by content+type+correct answer.
            Set<String> seen = new HashSet<>();
            for (AiExamParseResponse.AiQuestionDto existing : merged) {
                seen.add(fingerprint(existing));
            }
            int added = 0;
            for (AiExamParseResponse.AiQuestionDto q : sanitized.questions) {
                String fp = fingerprint(q);
                if (!seen.add(fp)) continue;
                merged.add(q);
                added++;
                Difficulty bucket = bucketOf(q);
                if (bucket != null) {
                    remaining.put(bucket, Math.max(0, remaining.getOrDefault(bucket, 0) - 1));
                }
                if (merged.size() >= totalCount) break;
            }

            log.info("[AiDiagnostic] Flow: DISTRIBUTION, Attempt: {}, Total Requested: {}, Missing Requested: {}, Raw/Parsed: {}, Sanitized/Validated: {}, Unique New: {}, Merged Total: {}/{}, Rejected By Reason: {}",
                    attempt + 1,
                    totalCount,
                    requestTotal,
                    parsed.getQuestions() != null ? parsed.getQuestions().size() : 0,
                    sanitized.finalCount,
                    added,
                    merged.size(),
                    totalCount,
                    sanitized.droppedByReason);

            int shortfall = totalCount - merged.size();
            if (shortfall <= 0) break;
            attempt++;
        }

        // Trim any overflow (defense in depth: should not happen given the
        // per-bucket capacity enforcement in sanitize, but we want a hard
        // guarantee that preview never shows more than the requested total).
        if (merged.size() > totalCount) {
            merged = new ArrayList<>(merged.subList(0, totalCount));
        }

        applyBalancedRandomization(merged);

        AiExamParseResponse response = new AiExamParseResponse();
        response.setTitle(materialTitle);
        response.setDescription("AI-generated questions from " + materialTitle);
        response.setQuestions(merged);

        if (merged.size() < totalCount) {
            String msg = "AI generated " + merged.size() + " of " + totalCount
                    + " valid questions. Please retry.";
            if (merged.isEmpty()) {
                response.setErrorMessage(msg);
            }
            log.warn("[AiLearningContent] Shortfall on {}: {}", materialTitle, msg);
        } else {
            log.info("[AiLearningContent] Successfully generated {} questions for {}", merged.size(), materialTitle);
        }
        return response;
    }

    /** Hard upper bound on the number of retry/supplementation rounds. */
    private static final int MAX_SUPPLEMENT_ATTEMPTS = 4;

    private static Map<Difficulty, Integer> cloneMap(Map<Difficulty, Integer> src) {
        Map<Difficulty, Integer> out = new java.util.EnumMap<>(Difficulty.class);
        out.put(Difficulty.EASY,   src.getOrDefault(Difficulty.EASY, 0));
        out.put(Difficulty.MEDIUM, src.getOrDefault(Difficulty.MEDIUM, 0));
        out.put(Difficulty.HARD,   src.getOrDefault(Difficulty.HARD, 0));
        return out;
    }

    private static int sumValues(Map<Difficulty, Integer> m) {
        int s = 0;
        for (Integer v : m.values()) if (v != null && v > 0) s += v;
        return s;
    }

    private static String fingerprint(AiExamParseResponse.AiQuestionDto q) {
        if (q == null) return "";
        StringBuilder sb = new StringBuilder();
        sb.append(q.getType() == null ? "" : q.getType().trim().toUpperCase());
        sb.append('|');
        sb.append(q.getContent() == null ? "" : q.getContent().trim().toLowerCase());
        sb.append('|');
        if (q.getAnswers() != null) {
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a == null) continue;
                sb.append(a.getContent() == null ? "" : a.getContent().trim().toLowerCase());
                if (Boolean.TRUE.equals(a.getIsCorrect())) sb.append('*');
                sb.append(';');
            }
        }
        return sb.toString();
    }

    private static Difficulty bucketOf(AiExamParseResponse.AiQuestionDto q) {
        if (q == null || q.getDifficulty() == null) return null;
        String d = q.getDifficulty().trim().toLowerCase();
        switch (d) {
            case "easy":   return Difficulty.EASY;
            case "medium": return Difficulty.MEDIUM;
            case "hard":   return Difficulty.HARD;
            default: return null;
        }
    }

    /**
     * Wrap sanitized questions into an AiExamParseResponse.
     * @param materialTitle title for the response
     * @param sanitized   the sanitized result
     * @return populated AiExamParseResponse
     */
    public AiExamParseResponse sanitizeAndWrap(String materialTitle,
                                              AiExistingQuestionParser.GenerateSanitizeResult sanitized) {
        AiExamParseResponse result = new AiExamParseResponse();
        result.setTitle(materialTitle);
        result.setDescription("AI-generated questions from " + materialTitle);
        result.setQuestions(sanitized.questions);
        return result;
    }

    private void applyBalancedRandomization(List<AiExamParseResponse.AiQuestionDto> questions) {
        if (questions == null || questions.isEmpty()) return;

        List<Integer> targetPositions = new java.util.ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            targetPositions.add(i % 4);
        }
        java.util.Collections.shuffle(targetPositions, new java.util.Random());

        for (int i = 0; i < questions.size(); i++) {
            AiExamParseResponse.AiQuestionDto q = questions.get(i);
            if (q.getAnswers() == null || q.getAnswers().size() < 4) continue;

            int targetCorrectIndex = targetPositions.get(i);

            AiExamParseResponse.AiAnswerDto correctOpt = null;
            List<AiExamParseResponse.AiAnswerDto> incorrectOpts = new java.util.ArrayList<>();
            for (AiExamParseResponse.AiAnswerDto opt : q.getAnswers()) {
                if (Boolean.TRUE.equals(opt.getIsCorrect())) {
                    if (correctOpt == null) correctOpt = opt;
                    else {
                        opt.setIsCorrect(false);
                        incorrectOpts.add(opt);
                    }
                } else {
                    incorrectOpts.add(opt);
                }
            }

            if (correctOpt == null) {
                correctOpt = q.getAnswers().get(0);
                correctOpt.setIsCorrect(true);
                incorrectOpts = new java.util.ArrayList<>(q.getAnswers().subList(1, q.getAnswers().size()));
            }

            java.util.Collections.shuffle(incorrectOpts, new java.util.Random());

            List<AiExamParseResponse.AiAnswerDto> newAnswers = new java.util.ArrayList<>(4);
            for(int j = 0; j < 4; j++) newAnswers.add(null);

            newAnswers.set(targetCorrectIndex, correctOpt);
            int incIdx = 0;
            for(int j = 0; j < 4; j++) {
                if (j != targetCorrectIndex) {
                    if (incIdx < incorrectOpts.size()) {
                        newAnswers.set(j, incorrectOpts.get(incIdx++));
                    }
                }
            }

            q.setAnswers(newAnswers);
        }
    }

    private AiExamParseResponse parseAiResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            log.warn("[AiLearningContent] AI returned empty response");
            return AiExamParseResponse.empty();
        }
        try {
            String cleaned = AiExistingQuestionParser.cleanJsonResponse(raw);
            return AiExistingQuestionParser.parseAndNormalize(cleaned, objectMapper);
        } catch (Exception e) {
            log.error("[AiLearningContent] Failed to parse AI response: {}. First 200 chars: {}",
                    e.getMessage(),
                    raw.length() > 200 ? raw.substring(0, 200) + "..." : raw);
            return AiExamParseResponse.empty();
        }
    }
}

