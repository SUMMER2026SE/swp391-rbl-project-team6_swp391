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

    public static class SourceRecord {
        private String id;
        private String kanji;
        private String reading;
        private String meaning;
        private String example;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getKanji() { return kanji; }
        public void setKanji(String kanji) { this.kanji = kanji; }
        public String getReading() { return reading; }
        public void setReading(String reading) { this.reading = reading; }
        public String getMeaning() { return meaning; }
        public void setMeaning(String meaning) { this.meaning = meaning; }
        public String getExample() { return example; }
        public void setExample(String example) { this.example = example; }
    }

    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final GrammarLessonRepository grammarLessonRepository;
    private final ReadingLessonRepository readingLessonRepository;
    private final ListeningLessonRepository listeningLessonRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final GrammarContentRepository grammarContentRepository;
    private final GrammarExampleRepository grammarExampleRepository;
    private final com.midori.ai.core.AiCoreService aiCoreService;
    private final ObjectMapper objectMapper;
    private final com.midori.ai.util.QuestionSemanticValidator semanticValidator;

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

    public AiExamParseResponse generateQuestions(String materialTitle, String learningContent,
                                                List<SourceRecord> sourceRecords,
                                                int questionCount, String difficulty,
                                                List<String> selectedSkills, String sourcePassage) {
        // Source records path: delegate to main 6-param implementation
        return generateQuestions(materialTitle, learningContent, questionCount, difficulty, selectedSkills, sourcePassage);
    }

    /**
     * Call AI to generate questions from the provided learning content, with optional source passage.
     * Always uses MULTIPLE_CHOICE (backward-compatible default).
     */
    public AiExamParseResponse generateQuestions(String materialTitle, String learningContent,
                                                 int questionCount, String difficulty,
                                                 List<String> selectedSkills, String sourcePassage) {
        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[AiLearningContent] No content to generate questions from");
            return AiExamParseResponse.empty();
        }

        validateSkillSelection(selectedSkills);
        if (isWritingRequest(selectedSkills, null)) {
            return generateWritingFlow(materialTitle, learningContent, questionCount, null, 0, 0, 0, sourcePassage);
        }

        return generateQuestions(materialTitle, learningContent, questionCount, difficulty, selectedSkills, sourcePassage, "MULTIPLE_CHOICE");
    }

    /**
     * Call AI to generate questions from the provided learning content, with optional source passage
     * and a specific question type/format.
     *
     * @param materialTitle    title for logging
     * @param learningContent the formatted learning content string
     * @param questionCount   how many questions to generate
     * @param difficulty      EASY, MEDIUM, or HARD
     * @param selectedSkills  skills to include
     * @param sourcePassage   optional source passage for passage-based questions
     * @param questionType    specific question type (e.g. MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK,
     *                        SHORT_ANSWER, MATCHING, TRANSLATION, SENTENCE_WRITING, ERROR_CORRECTION).
     *                        Null means MULTIPLE_CHOICE (backward-compatible default).
     * @return AiExamParseResponse with sanitized questions
     */
    public AiExamParseResponse generateQuestions(String materialTitle, String learningContent,
                                                 int questionCount, String difficulty,
                                                 List<String> selectedSkills, String sourcePassage,
                                                 String questionType) {
        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[AiLearningContent] No content to generate questions from");
            return AiExamParseResponse.empty();
        }

        validateSkillSelection(selectedSkills);
        if (isWritingRequest(selectedSkills, null)) {
            return generateWritingFlow(materialTitle, learningContent, questionCount, null, 0, 0, 0, sourcePassage);
        }

        // Determine the question type: use provided type or default to MULTIPLE_CHOICE
        String effectiveQuestionType = questionType;
        if (effectiveQuestionType == null || effectiveQuestionType.isBlank()) {
            effectiveQuestionType = "MULTIPLE_CHOICE";
        }
        // Normalize to canonical enum name so aliases (MCQ, FILL_IN_BLANK, etc.) work
        com.midori.entity.QuestionType normalized =
                com.midori.ai.util.QuestionTypeValidator.normalize(effectiveQuestionType);
        if (normalized != null) {
            effectiveQuestionType = normalized.name();
        }

        log.info("[AiLearningContent] Generating {} questions (type={}) for: {}", questionCount, effectiveQuestionType, materialTitle);
        com.midori.ai.core.AiCoreService.setRequestQuestionCount(questionCount);
        if (selectedSkills != null && selectedSkills.contains("READING")) {
            com.midori.ai.core.AiCoreService.setReadingTask(true);
        }

        List<AiExamParseResponse.AiQuestionDto> merged = new ArrayList<>();
        int attempt = 0;
        int maxAttempts = Math.max(MAX_SUPPLEMENT_ATTEMPTS, (int) Math.ceil((double) questionCount / com.midori.ai.util.AiQuestionBatcher.MAX_QUESTIONS_PER_AI_CALL) + 3);
        while (attempt < maxAttempts) {
            int needed = Math.min(questionCount - merged.size(), com.midori.ai.util.AiQuestionBatcher.MAX_QUESTIONS_PER_AI_CALL);
            if (needed <= 0) break;

            try {
                com.midori.ai.core.AiCoreService.checkTimeout();
                com.midori.ai.core.AiCoreService.currentRound.set(attempt + 1);
                com.midori.ai.core.AiCoreService.currentBatchQuestionCount.set(needed);

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
                        effectiveQuestionType,
                        difficulty,
                        selectedSkills
                );

                AiExamParseResponse parsed = parseAiResponse(rawResponse);

                // Use the type-aware sanitizer so FILL_BLANK, SHORT_ANSWER, and TRUE_FALSE
                // questions are validated according to their own structural rules instead of
                // the MCQ ≥2-options rule that the legacy 3-param sanitizer enforces.
                com.midori.entity.QuestionType sanitizeExpectedType =
                        com.midori.ai.util.QuestionTypeValidator.normalize(effectiveQuestionType);
                AiExistingQuestionParser.GenerateSanitizeResult sanitized =
                        AiExistingQuestionParser.sanitizeGeneratedQuestionsWithTypeAndDistribution(
                                parsed.getQuestions(),
                                selectedSkills,
                                sourcePassage,
                                sanitizeExpectedType,
                                null   // no per-bucket cap for single-difficulty path
                        );

                Set<String> seen = new HashSet<>();
                for (AiExamParseResponse.AiQuestionDto existing : merged) {
                    seen.add(fingerprint(existing));
                }

                int added = 0;
                int duplicates = 0;
                for (AiExamParseResponse.AiQuestionDto q : sanitized.questions) {
                    String fp = fingerprint(q);
                    if (!seen.add(fp)) {
                        duplicates++;
                        continue;
                    }
                    merged.add(q);
                    added++;
                    if (merged.size() >= questionCount) break;
                }
                recordSuccessfulGeneration(added);

                log.info("[AiLearningContent] Attempt: {}, Requested Remaining: {}, Accepted This Attempt: {}, Accepted Total: {}, Duplicates Removed: {}, Validation Reject Counts: {}, Termination Reason: None",
                        attempt + 1,
                        needed,
                        added,
                        merged.size(),
                        duplicates,
                        sanitized.droppedByReason);

                if (merged.size() >= questionCount) break;

                // Determine if all questions were rejected due to the same deterministic validation reason
                if (sanitized.finalCount == 0 && sanitized.rawGeneratedCount > 0) {
                    boolean allDeterministic = com.midori.ai.util.AiExistingQuestionParser.isDeterministicValidationRound(sanitized.droppedByReason);
                    if (allDeterministic) {
                        log.warn("[AiLearningContent] Attempt: {}, Requested Remaining: {}, Accepted This Attempt: {}, Accepted Total: {}, Duplicates Removed: {}, Validation Reject Counts: {}, Termination Reason: Deterministic validation failure",
                                attempt + 1, needed, added, merged.size(), duplicates, sanitized.droppedByReason);
                        break;
                    }
                }

                attempt++;
            } catch (com.midori.exception.AiException.RequestTimeoutException e) {
                // Hard deadline reached — stop immediately and return what we have.
                log.warn("[AiLearningContent] Request deadline reached during single-difficulty generation, attempt: {}, merged size: {}, error: {}",
                         attempt + 1, merged.size(), e.getMessage());
                if (merged.isEmpty()) throw e;
                break;
            } catch (com.midori.exception.AiException e) {
                log.warn("[AiLearningContent] AI exception during single-difficulty generation, attempt: {}, merged size: {}, error: {}",
                         attempt + 1, merged.size(), e.getMessage());
                if (!isRetryableException(e)) {
                    log.warn("[AiLearningContent] Non-retryable AI exception, stopping immediately.");
                    if (!merged.isEmpty()) {
                        break;
                    }
                    throw e;
                }
                attempt++;
                if (attempt >= maxAttempts) {
                    if (!merged.isEmpty()) {
                        break;
                    }
                    throw e;
                }
            }
        }

        // Trim any overflow to requestedCount to ensure we never return more than requested
        if (merged.size() > questionCount) {
            merged = new ArrayList<>(merged.subList(0, questionCount));
        }

        applyBalancedRandomization(merged);

        AiExamParseResponse response = new AiExamParseResponse();
        response.setTitle(materialTitle);
        response.setDescription("AI-generated questions from " + materialTitle);
        response.setQuestions(merged);
        response.setRequestedCount(questionCount);
        response.setGeneratedCount(merged.size());

        if (merged.size() < questionCount) {
            response.setSuccess(true);
            response.setPartial(true);
            response.setCode("AI_PARTIAL_RESULT");
            String msg = merged.size() + " of " + questionCount
                    + " questions were generated. Please try again.";
            response.setErrorMessage(msg);
            log.warn("[AiLearningContent] Shortfall on {}: {}", materialTitle, msg);
        } else {
            response.setSuccess(true);
            response.setPartial(false);
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
        return generateQuestionsWithDistribution(materialTitle, learningContent, new ArrayList<>(), totalCount, questionTypeRaw, easyPct, mediumPct, hardPct, selectedSkills, sourcePassage);
    }

    public AiExamParseResponse generateQuestionsWithDistribution(
            String materialTitle,
            String learningContent,
            List<SourceRecord> sourceRecords,
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

        validateSkillSelection(selectedSkills);
        if (isWritingRequest(selectedSkills, questionTypeRaw)) {
            return generateWritingFlow(materialTitle, learningContent, totalCount, questionTypeRaw, easyPct, mediumPct, hardPct, sourcePassage);
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

        com.midori.ai.core.AiCoreService.setRequestQuestionCount(totalCount);
        if (selectedSkills != null && selectedSkills.contains("READING")) {
            com.midori.ai.core.AiCoreService.setReadingTask(true);
        }
        List<AiExamParseResponse.AiQuestionDto> merged = new ArrayList<>();
        int attempt = 0;
        int maxAttempts = Math.max(MAX_SUPPLEMENT_ATTEMPTS, (int) Math.ceil((double) totalCount / com.midori.ai.util.AiQuestionBatcher.MAX_QUESTIONS_PER_AI_CALL) + 3);
        while (attempt < maxAttempts) {
            Map<Difficulty, Integer> request = capDistributionToBatchLimit(remaining);
            int requestTotal = sumValues(request);
            if (requestTotal <= 0) break;

            try {
                com.midori.ai.core.AiCoreService.checkTimeout();
                com.midori.ai.core.AiCoreService.currentRound.set(attempt + 1);
                com.midori.ai.core.AiCoreService.currentBatchQuestionCount.set(requestTotal);

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
                int duplicates = 0;
                for (AiExamParseResponse.AiQuestionDto q : sanitized.questions) {
                    String fp = fingerprint(q);
                    if (!seen.add(fp)) {
                        duplicates++;
                        continue;
                    }
                    merged.add(q);
                    added++;
                    Difficulty bucket = bucketOf(q);
                    if (bucket != null) {
                        remaining.put(bucket, Math.max(0, remaining.getOrDefault(bucket, 0) - 1));
                    }
                    if (merged.size() >= totalCount) break;
                }
                recordSuccessfulGeneration(added);

                log.info("[AiLearningContent] Attempt: {}, Requested Remaining: {}, Accepted This Attempt: {}, Accepted Total: {}, Duplicates Removed: {}, Validation Reject Counts: {}, Termination Reason: None",
                        attempt + 1,
                        requestTotal,
                        added,
                        merged.size(),
                        duplicates,
                        sanitized.droppedByReason);

                if (merged.size() >= totalCount) break;

                // Determine if all questions were rejected due to the same deterministic validation reason
                if (sanitized.finalCount == 0 && sanitized.rawGeneratedCount > 0) {
                    boolean allDeterministic = com.midori.ai.util.AiExistingQuestionParser.isDeterministicValidationRound(sanitized.droppedByReason);
                    if (allDeterministic) {
                        log.warn("[AiLearningContent] Attempt: {}, Requested Remaining: {}, Accepted This Attempt: {}, Accepted Total: {}, Duplicates Removed: {}, Validation Reject Counts: {}, Termination Reason: Deterministic validation failure",
                                attempt + 1, requestTotal, added, merged.size(), duplicates, sanitized.droppedByReason);
                        break;
                    }
                }

                int shortfall = totalCount - merged.size();
                if (shortfall <= 0) break;
                attempt++;
            } catch (com.midori.exception.AiException.RequestTimeoutException e) {
                // Hard deadline reached — stop the loop immediately.
                // Return whatever questions we have so far (may be 0 on first round).
                log.warn("[AiLearningContent] Request deadline reached during distribution generation, attempt: {}, merged size: {}, error: {}",
                         attempt + 1, merged.size(), e.getMessage());
                if (merged.isEmpty()) throw e;
                break;
            } catch (com.midori.exception.AiException e) {
                log.warn("[AiLearningContent] AI exception during distribution generation, attempt: {}, merged size: {}, error: {}",
                         attempt + 1, merged.size(), e.getMessage());
                if (!isRetryableException(e)) {
                    log.warn("[AiLearningContent] Non-retryable AI exception, stopping immediately.");
                    if (!merged.isEmpty()) {
                        break;
                    }
                    throw e;
                }
                attempt++;
                if (attempt >= maxAttempts) {
                    if (!merged.isEmpty()) {
                        break;
                    }
                    throw e;
                }
            }
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
        response.setRequestedCount(totalCount);
        response.setGeneratedCount(merged.size());

        if (merged.size() < totalCount) {
            response.setSuccess(true);
            response.setPartial(true);
            response.setCode("AI_PARTIAL_RESULT");
            String msg = merged.size() + " of " + totalCount
                    + " questions were generated. Please try again.";
            response.setErrorMessage(msg);
            log.warn("[AiLearningContent] Shortfall on {}: {}", materialTitle, msg);
        } else {
            response.setSuccess(true);
            response.setPartial(false);
            log.info("[AiLearningContent] Successfully generated {} questions for {}", merged.size(), materialTitle);
        }
        return response;
    }

    private void validateSkillSelection(List<String> selectedSkills) {
        if (selectedSkills == null || selectedSkills.isEmpty()) return;
        boolean hasWriting = selectedSkills.stream().anyMatch(s -> s != null && "WRITING".equalsIgnoreCase(s));
        if (hasWriting && selectedSkills.size() > 1) {
            throw new IllegalArgumentException("WRITING must be generated separately from Vocabulary, Grammar, and Reading.");
        }
    }

    private boolean isWritingRequest(List<String> selectedSkills, String questionTypeRaw) {
        if (selectedSkills != null && selectedSkills.stream().anyMatch(s -> s != null && "WRITING".equalsIgnoreCase(s))) {
            return true;
        }
        if (questionTypeRaw != null && com.midori.ai.dto.WritingMode.parse(questionTypeRaw) != null &&
            com.midori.ai.util.QuestionTypeValidator.normalize(questionTypeRaw) == null) {
            return true;
        }
        return false;
    }

    private AiExamParseResponse generateWritingFlow(
            String materialTitle,
            String learningContent,
            int totalCount,
            String writingModeRaw,
            int easyPct, int mediumPct, int hardPct,
            String sourcePassage) {

        DifficultyDistribution.validateCount(totalCount);
        if (easyPct + mediumPct + hardPct > 0) {
            DifficultyDistribution.validatePercentages(easyPct, mediumPct, hardPct);
        }
        Map<Difficulty, Integer> distribution = (easyPct + mediumPct + hardPct > 0)
                ? DifficultyDistribution.allocate(totalCount, easyPct, mediumPct, hardPct)
                : Map.of(Difficulty.MEDIUM, totalCount);

        com.midori.ai.dto.WritingMode mode = com.midori.ai.dto.WritingMode.parse(writingModeRaw);

        log.info("[AiLearningContent] Generating {} WRITING questions (mode={}, distribution={}) for: {}",
                totalCount, mode, DifficultyDistribution.formatForPrompt(distribution), materialTitle);

        com.midori.ai.core.AiCoreService.setRequestQuestionCount(totalCount);
        List<AiExamParseResponse.AiQuestionDto> merged = new ArrayList<>();
        int attempt = 0;
        int maxAttempts = Math.max(MAX_SUPPLEMENT_ATTEMPTS, (int) Math.ceil((double) totalCount / com.midori.ai.util.AiQuestionBatcher.MAX_QUESTIONS_PER_AI_CALL) + 3);

        while (attempt < maxAttempts) {
            int needed = Math.min(totalCount - merged.size(), com.midori.ai.util.AiQuestionBatcher.MAX_QUESTIONS_PER_AI_CALL);
            if (needed <= 0) break;

            try {
                com.midori.ai.core.AiCoreService.checkTimeout();
                com.midori.ai.core.AiCoreService.currentRound.set(attempt + 1);
                com.midori.ai.core.AiCoreService.currentBatchQuestionCount.set(needed);

                String distLine = DifficultyDistribution.formatForPrompt(distribution);
                String attemptPromptContent = learningContent;
                if (attempt > 0 && !merged.isEmpty()) {
                    StringBuilder sb = new StringBuilder(learningContent);
                    sb.append("\n\nGenerate exactly ").append(needed).append(" NEW writing questions.\n");
                    sb.append("Do not repeat any of these existing questions:\n");
                    int limit = Math.min(merged.size(), 15);
                    for (int i = 0; i < limit; i++) {
                        sb.append("- ").append(merged.get(i).getContent()).append("\n");
                    }
                    attemptPromptContent = sb.toString();
                }

                String rawResponse = aiCoreService.generateWritingQuestions(
                        attemptPromptContent, needed, "Any", distLine, mode
                );

                AiExamParseResponse parsed = parseAiResponse(rawResponse);

                com.midori.ai.util.AiExistingQuestionParser.GenerateSanitizeResult sanitized =
                        com.midori.ai.util.WritingQuestionValidator.sanitizeWritingQuestions(
                                parsed.getQuestions(), mode, sourcePassage, distribution
                        );

                Set<String> seen = new HashSet<>();
                for (AiExamParseResponse.AiQuestionDto existing : merged) {
                    seen.add(fingerprint(existing));
                }

                int added = 0;
                int duplicates = 0;
                for (AiExamParseResponse.AiQuestionDto q : sanitized.questions) {
                    String fp = fingerprint(q);
                    if (!seen.add(fp)) {
                        duplicates++;
                        continue;
                    }
                    merged.add(q);
                    added++;
                    if (merged.size() >= totalCount) break;
                }
                recordSuccessfulGeneration(added);

                log.info("[AiLearningContent] WRITING Attempt {}: requested {}, added {}, total {}, duplicates {}, rejected {}",
                        attempt + 1, needed, added, merged.size(), duplicates, sanitized.droppedByReason);

                if (merged.size() >= totalCount) break;
                if (sanitized.finalCount == 0 && sanitized.rawGeneratedCount > 0) {
                    boolean allDeterministic = com.midori.ai.util.AiExistingQuestionParser.isDeterministicValidationRound(sanitized.droppedByReason);
                    if (allDeterministic) {
                        break;
                    }
                }

                attempt++;
            } catch (com.midori.exception.AiException.RequestTimeoutException e) {
                log.warn("[AiLearningContent] Request deadline reached during writing generation, attempt: {}, merged size: {}", attempt + 1, merged.size());
                if (merged.isEmpty()) throw e;
                break;
            } catch (com.midori.exception.AiException e) {
                log.error("[AiLearningContent] Error on attempt {} for WRITING: {}", attempt + 1, e.getMessage(), e);
                if (merged.isEmpty() && (attempt >= maxAttempts - 1 || !isRetryableException(e))) {
                    throw e;
                }
                if (merged.isEmpty()) {
                    attempt++;
                    continue;
                }
                break;
            } catch (Exception e) {
                log.error("[AiLearningContent] Unexpected error on attempt {} for WRITING: {}", attempt + 1, e.getMessage(), e);
                if (merged.isEmpty()) {
                    if (e instanceof RuntimeException re) throw re;
                    throw new RuntimeException(e);
                }
                break;
            }
        }

        if (merged.size() > totalCount) {
            merged = new ArrayList<>(merged.subList(0, totalCount));
        }
        applyBalancedRandomization(merged);

        AiExamParseResponse response = new AiExamParseResponse();
        response.setTitle(materialTitle);
        response.setDescription("AI-generated questions from " + materialTitle);
        response.setQuestions(merged);
        response.setRequestedCount(totalCount);
        response.setGeneratedCount(merged.size());

        if (merged.size() < totalCount) {
            response.setSuccess(true);
            response.setPartial(true);
            response.setCode("AI_PARTIAL_RESULT");
            String msg = merged.size() + " of " + totalCount + " questions were generated. Please try again.";
            response.setErrorMessage(msg);
            log.warn("[AiLearningContent] Shortfall on {}: {}", materialTitle, msg);
        } else {
            response.setSuccess(true);
            response.setPartial(false);
            log.info("[AiLearningContent] Successfully generated {} WRITING questions for {}", merged.size(), materialTitle);
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

    public static String fingerprint(AiExamParseResponse.AiQuestionDto q) {
        if (q == null) return "";
        StringBuilder sb = new StringBuilder();
        sb.append(q.getType() == null ? "" : q.getType().trim().toUpperCase());
        sb.append('|');
        sb.append(q.getCategory() == null ? "" : q.getCategory().trim().toLowerCase());
        sb.append('|');
        sb.append(q.getContent() == null ? "" : q.getContent().trim().toLowerCase().replaceAll("\\s+", " "));
        sb.append('|');
        if (q.getAnswers() != null) {
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                if (a == null) continue;
                sb.append(a.getContent() == null ? "" : a.getContent().trim().toLowerCase().replaceAll("\\s+", " "));
                if (Boolean.TRUE.equals(a.getIsCorrect())) sb.append('*');
                sb.append(';');
            }
        }
        if (q.getTranslationMetadata() != null) {
            sb.append("|trans:").append(q.getTranslationMetadata().getSourceText() == null ? "" : q.getTranslationMetadata().getSourceText().trim().toLowerCase().replaceAll("\\s+", " "));
            sb.append(";").append(q.getTranslationMetadata().getReferenceAnswer() == null ? "" : q.getTranslationMetadata().getReferenceAnswer().trim().toLowerCase().replaceAll("\\s+", " "));
        }
        if (q.getSentenceWritingMetadata() != null) {
            sb.append("|sent:").append(q.getSentenceWritingMetadata().getPrompt() == null ? "" : q.getSentenceWritingMetadata().getPrompt().trim().toLowerCase().replaceAll("\\s+", " "));
            sb.append(";").append(q.getSentenceWritingMetadata().getReferenceAnswer() == null ? "" : q.getSentenceWritingMetadata().getReferenceAnswer().trim().toLowerCase().replaceAll("\\s+", " "));
        }
        if (q.getErrorCorrectionMetadata() != null) {
            sb.append("|err:").append(q.getErrorCorrectionMetadata().getIncorrectText() == null ? "" : q.getErrorCorrectionMetadata().getIncorrectText().trim().toLowerCase().replaceAll("\\s+", " "));
            sb.append(";").append(q.getErrorCorrectionMetadata().getCorrectedText() == null ? "" : q.getErrorCorrectionMetadata().getCorrectedText().trim().toLowerCase().replaceAll("\\s+", " "));
        }
        if (q.getMatchingMetadata() != null) {
            sb.append("|match:");
            if (q.getMatchingMetadata().getLeftItems() != null) {
                sb.append(String.join(",", q.getMatchingMetadata().getLeftItems()).trim().toLowerCase().replaceAll("\\s+", " "));
            }
            sb.append(";");
            if (q.getMatchingMetadata().getRightItems() != null) {
                sb.append(String.join(",", q.getMatchingMetadata().getRightItems()).trim().toLowerCase().replaceAll("\\s+", " "));
            }
        }
        return sb.toString();
    }

    public static boolean isRetryableException(com.midori.exception.AiException e) {
        if (e instanceof com.midori.exception.AiException.RequestTimeoutException) {
            return false;
        }
        if (e instanceof com.midori.exception.AiException.InvalidApiKeyException) {
            return false;
        }
        if (e instanceof com.midori.exception.AiException.ProviderForbiddenException) {
            return false;
        }
        String code = e.getCode();
        if (code != null) {
            switch (code) {
                case "AI_REQUEST_TIMEOUT":
                case "AI_INVALID_API_KEY":
                case "AI_PROVIDER_FORBIDDEN":
                    return false;
                default:
                    break;
            }
        }
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (msg.contains("bad request") || msg.contains("400") 
                || msg.contains("invalid request") || msg.contains("malformed")
                || msg.contains("unsupported model") || msg.contains("model not found")
                || msg.contains("authentication") || msg.contains("forbidden") || msg.contains("401") || msg.contains("403")) {
            return false;
        }
        return true;
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
            return AiExistingQuestionParser.parseAndNormalize(raw, objectMapper);
        } catch (Exception e) {
            log.error("[AiLearningContent] Failed to parse AI response: {}. First 200 chars: {}",
                    e.getMessage(),
                    raw.length() > 200 ? raw.substring(0, 200) + "..." : raw);
            return AiExamParseResponse.empty();
        }
    }

    public List<SourceRecord> extractSourceRecords(String text) {
        List<SourceRecord> records = new ArrayList<>();
        if (text == null || text.isBlank()) return records;

        String[] lines = text.split("\\r?\\n");
        int idCounter = 1;

        int i = 0;
        while (i < lines.length) {
            String line = lines[i].trim();
            if (line.startsWith("- ") && line.contains("[") && line.contains("]")) {
                try {
                    int dashIdx = line.indexOf('-');
                    int openIdx = line.indexOf('[');
                    int closeIdx = line.indexOf(']');
                    int colonIdx = line.indexOf(':');

                    if (openIdx > dashIdx && closeIdx > openIdx && colonIdx > closeIdx) {
                        String kanji = line.substring(dashIdx + 1, openIdx).trim();
                        String reading = line.substring(openIdx + 1, closeIdx).trim();
                        String meaning = line.substring(colonIdx + 1).trim();
                        String example = "";

                        if (i + 1 < lines.length && lines[i + 1].trim().startsWith("Example:")) {
                            example = lines[i + 1].trim().substring(8).trim();
                            i++;
                        }

                        SourceRecord record = new SourceRecord();
                        record.setId("rec_" + idCounter++);
                        record.setKanji(kanji);
                        record.setReading(reading);
                        record.setMeaning(meaning);
                        record.setExample(example);
                        records.add(record);
                    }
                } catch (Exception e) {
                    log.warn("[extractSourceRecords] Error parsing line: {}", line);
                }
            } else if (line.contains("(") && line.contains(")")) {
                try {
                    int openIdx = line.indexOf('(');
                    int closeIdx = line.indexOf(')');
                    if (openIdx > 0 && closeIdx > openIdx) {
                        String kanji = line.substring(0, openIdx).trim();
                        String reading = line.substring(openIdx + 1, closeIdx).trim();

                        String romaji = "";
                        if (i + 1 < lines.length && lines[i + 1].trim().startsWith("[") && lines[i + 1].trim().endsWith("]")) {
                            romaji = lines[i + 1].trim().substring(1, lines[i + 1].trim().length() - 1);
                            i++;
                        }

                        String meaning = "";
                        if (i + 1 < lines.length && !lines[i + 1].trim().isBlank()) {
                            meaning = lines[i + 1].trim();
                            i++;
                        }

                        SourceRecord record = new SourceRecord();
                        record.setId("rec_" + idCounter++);
                        record.setKanji(kanji);
                        record.setReading(reading);
                        record.setMeaning(meaning);
                        record.setExample("");
                        records.add(record);
                    }
                } catch (Exception e) {
                    log.warn("[extractSourceRecords] Error parsing line: {}", line);
                }
            }
            i++;
        }
        return records;
    }

    public String formatSourceRecords(List<SourceRecord> records) {
        if (records == null || records.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        sb.append("STRUCTURED SOURCE RECORDS (every question MUST target exactly ONE source record by including its id in the \"sourceRecordId\" field. Do not mix details between records):\n");
        for (var rec : records) {
            sb.append("- id: ").append(rec.getId())
              .append(", kanji: ").append(rec.getKanji())
              .append(", reading: ").append(rec.getReading())
              .append(", meaning: ").append(rec.getMeaning());
            if (rec.getExample() != null && !rec.getExample().isBlank()) {
                sb.append(", example: ").append(rec.getExample());
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    private String classifyStopReason(Throwable t) {
        if (t == null) return "maximum regeneration attempts reached";
        String msg = t.getMessage() != null ? t.getMessage().toLowerCase() : "";
        if (msg.contains("quota") || msg.contains("rate limit") || msg.contains("429")
                || msg.contains("too many requests") || msg.contains("403") || msg.contains("exhausted")) {
            return "provider quota exhausted";
        }
        if (msg.contains("unavailable") || msg.contains("timeout") || msg.contains("connection")
                || msg.contains("network") || msg.contains("502") || msg.contains("503")
                || msg.contains("504") || msg.contains("upstream error") || msg.contains("model not found")
                || msg.contains("model unavailable")) {
            return "provider unavailable";
        }
        return "provider unavailable";
    }

    private List<AiExamParseResponse.AiQuestionDto> filterSemanticallyValidQuestions(
            List<AiExamParseResponse.AiQuestionDto> questions) {
        if (questions == null || questions.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            String questionsJson = objectMapper.writeValueAsString(questions);
            String validationPrompt = com.midori.ai.prompt.AiPromptBuilder.buildSemanticValidationPrompt(questionsJson);
            String rawJson = aiCoreService.chat(
                "You are a Japanese language evaluation assistant. You output ONLY valid JSON.",
                validationPrompt,
                null
            );

            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(AiExistingQuestionParser.cleanJsonResponse(rawJson));
            com.fasterxml.jackson.databind.JsonNode evals = root.get("evaluations");

            List<AiExamParseResponse.AiQuestionDto> result = new ArrayList<>();
            if (evals != null && evals.isArray()) {
                for (int i = 0; i < questions.size() && i < evals.size(); i++) {
                    com.fasterxml.jackson.databind.JsonNode node = evals.get(i);
                    boolean isValid = node.get("isValid").asBoolean();
                    var q = questions.get(i);
                    if (isValid) {
                        result.add(q);
                    }
                }
                return result;
            }
        } catch (Exception e) {
            log.error("[SemanticValidation] AI validation failed: {}", e.getMessage(), e);
        }
        return questions;
    }

    private void recordSuccessfulGeneration(int acceptedCount) {
        if (acceptedCount <= 0) return;
        com.midori.ai.core.AiProviderStateManager.RouteInfo route = com.midori.ai.core.AiCoreService.lastSuccessfulRoute.get();
        if (route != null) {
            com.midori.ai.core.AiProviderStateManager.recordSuccess(
                    com.midori.ai.AiTaskType.COMPLEX_REASONING,
                    route.providerType(),
                    route.model(),
                    route.keyIndex(),
                    route.safeKeyId(),
                    true,
                    acceptedCount
            );
        }
    }

    private Map<Difficulty, Integer> capDistributionToBatchLimit(Map<Difficulty, Integer> remaining) {
        int maxBatch = com.midori.ai.util.AiQuestionBatcher.MAX_QUESTIONS_PER_AI_CALL;
        Map<Difficulty, Integer> request = new java.util.EnumMap<>(Difficulty.class);
        int added = 0;
        for (Map.Entry<Difficulty, Integer> entry : remaining.entrySet()) {
            int canAdd = Math.min(entry.getValue(), maxBatch - added);
            if (canAdd > 0) {
                request.put(entry.getKey(), canAdd);
                added += canAdd;
            } else {
                request.put(entry.getKey(), 0);
            }
            if (added >= maxBatch) break;
        }
        for (Difficulty d : Difficulty.values()) {
            request.putIfAbsent(d, 0);
        }
        return request;
    }
}

