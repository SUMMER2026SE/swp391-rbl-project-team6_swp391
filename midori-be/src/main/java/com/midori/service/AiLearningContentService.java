package com.midori.service;

import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.entity.*;
import com.midori.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Reusable AI content generation service.
 * Provides building blocks for any AI-powered content generation from lesson material.
 * Used by TeacherExamAiService and HomeworkAiService.
 *
 * <p>Architecture:
 * <ul>
 *   <li>{@link #buildLearningContent(String, Integer, List)} — fetch lesson content from DB</li>
 *   <li>{@link #generateQuestions(String, String, String, int, String, List)} — call AI</li>
 *   <li>{@link #sanitizeAndWrap(String, AiExamParseResponse, List)} — sanitize + wrap response</li>
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
     * Uses targeted queries — no findAll() + in-memory filter.
     *
     * <p>Output format:
     * <pre>
     * ========================================
     * LESSON INFORMATION
     * ========================================
     * Lesson Title: ...
     * JLPT Level: ...
     *
     * ========================================
     * VOCABULARY
     * ========================================
     * - Word (reading): meaning [pos]
     *   Example: ... — translation
     *
     * ========================================
     * GRAMMAR
     * ========================================
     * - Pattern: ... — Meaning: ...
     *   Structure: ...
     *   Usage: ...
     *   Example: ... — translation
     *
     * ========================================
     * READING
     * ========================================
     * Passage:
     * ...text...
     * Translation:
     * ...translation...
     *
     * ========================================
     * LISTENING
     * ========================================
     * Transcript:
     * ...text...
     * </pre>
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

        // Vocabulary — single targeted query
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
                                    sb.append(" — ").append(item.getExampleTranslation());
                                }
                            }
                            sb.append("\n");
                        }
                        sb.append("\n");
                    });
        }

        // Grammar — single targeted query
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
                                    sb.append(" — Meaning: ").append(content.getMeaning());
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

        // Reading — single targeted query
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

        // Listening — single targeted query
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
                sb.append(" — ").append(ex.getVietnameseMeaning());
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
        if (learningContent == null || learningContent.isBlank()) {
            log.warn("[AiLearningContent] No content to generate questions from");
            return AiExamParseResponse.empty();
        }

        log.info("[AiLearningContent] Generating {} questions for: {}", questionCount, materialTitle);

        String rawResponse = aiCoreService.generateQuestions(
                materialTitle,
                learningContent,
                questionCount,
                "MULTIPLE_CHOICE",
                difficulty,
                selectedSkills
        );

        AiExamParseResponse parsed = parseAiResponse(rawResponse);

        AiExistingQuestionParser.GenerateSanitizeResult sanitized =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(
                        parsed.getQuestions(),
                        selectedSkills
                );

        log.info("[AiLearningContent] AI generated {} raw questions, sanitized to {} questions. Dropped: {}",
                sanitized.rawGeneratedCount, sanitized.finalCount, sanitized.droppedByReason);

        return sanitizeAndWrap(materialTitle, sanitized);
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
