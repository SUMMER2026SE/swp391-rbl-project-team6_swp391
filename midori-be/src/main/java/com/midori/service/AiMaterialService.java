package com.midori.service;

import com.midori.dto.ai.AiMaterialDetailResponse;
import com.midori.dto.ai.AiMaterialSummaryResponse;
import com.midori.entity.GrammarContent;
import com.midori.entity.GrammarExample;
import com.midori.entity.GrammarLesson;
import com.midori.entity.ListeningLesson;
import com.midori.entity.ReadingLesson;
import com.midori.entity.VocabularyItem;
import com.midori.entity.VocabularyLesson;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.GrammarContentRepository;
import com.midori.repository.GrammarExampleRepository;
import com.midori.repository.GrammarLessonRepository;
import com.midori.repository.ListeningLessonRepository;
import com.midori.repository.ReadingLessonRepository;
import com.midori.repository.VocabularyItemRepository;
import com.midori.repository.VocabularyLessonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Student-safe AI Sensei material service.
 *
 * <p>Reads from the existing {@code *LessonRepository} beans and exposes a
 * small, controlled surface for the student AI Sensei feature.
 *
 * <p><strong>Why a new service instead of reusing the teacher branch's
 * {@code AiLearningContentService}?</strong> The teacher service is tightly
 * coupled to teacher exam/homework flows (it formats a combined lesson dump
 * intended for AI question generation in teacher workflows). It also accepts
 * only a {@code level} + {@code lessonNumber} pair, not arbitrary material
 * IDs, and does not enforce student visibility. Bringing it across would
 * require cherry-picking unrelated teacher code and adapting its API to the
 * student product. A small, dedicated student service keeps merge risk low
 * and is easier to audit.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiMaterialService {

    /**
     * Mirrors the existing 12000-character material limit enforced by the AI
     * chat / quiz payload DTOs ({@code ChatRequest.MaterialInfo.content}).
     */
    public static final int MATERIAL_CONTENT_LIMIT = 12_000;

    public static final String TYPE_VOCABULARY = "VOCABULARY";
    public static final String TYPE_GRAMMAR = "GRAMMAR";
    public static final String TYPE_READING = "READING";
    public static final String TYPE_LISTENING = "LISTENING";

    private final VocabularyLessonRepository vocabularyLessonRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final GrammarLessonRepository grammarLessonRepository;
    private final GrammarContentRepository grammarContentRepository;
    private final GrammarExampleRepository grammarExampleRepository;
    private final ReadingLessonRepository readingLessonRepository;
    private final ListeningLessonRepository listeningLessonRepository;

    // ═══════════════════════════════════════════════════════════════════
    // LIST
    // ═══════════════════════════════════════════════════════════════════

    /**
     * List published student-visible materials.
     *
     * <p>Published visibility rules:
     * <ul>
     *   <li>VOCABULARY: {@code isActive == true AND isPublished == true}</li>
     *   <li>GRAMMAR, READING, LISTENING: {@code isActive == true}</li>
     * </ul>
     *
     * <p>The list intentionally omits full lesson content. Frontend must
     * call {@link #getMaterialDetail(String, UUID)} for the body.
     */
    @Transactional(readOnly = true)
    public List<AiMaterialSummaryResponse> listMaterials(String type, String level, String search) {
        String normalizedType = normalizeTypeOrNull(type);
        String normalizedLevel = normalizeLevelOrNull(level);

        List<AiMaterialSummaryResponse> results = new ArrayList<>();

        if (normalizedType == null || TYPE_VOCABULARY.equalsIgnoreCase(normalizedType)) {
            // Defence in depth: even if the repository returns more rows than
            // expected, filter at the service layer too. This protects against
            // any future refactor that loosens the repository contract.
            vocabularyLessonRepository.findByIsActiveTrueAndIsPublishedTrue()
                    .stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()) && Boolean.TRUE.equals(v.getIsPublished()))
                    .filter(v -> normalizedLevel == null || normalizedLevel.equalsIgnoreCase(v.getJlptLevel()))
                    .filter(v -> matchSearch(search, v.getTitle(), v.getDescription()))
                    .forEach(v -> results.add(toSummaryVocabulary(v)));
        }

        if (normalizedType == null || TYPE_GRAMMAR.equalsIgnoreCase(normalizedType)) {
            grammarLessonRepository.findByIsActiveTrue()
                    .stream()
                    .filter(g -> Boolean.TRUE.equals(g.getIsActive()))
                    .filter(g -> normalizedLevel == null || normalizedLevel.equalsIgnoreCase(g.getJlptLevel()))
                    .filter(g -> matchSearch(search, g.getTitle(), g.getDescription()))
                    .forEach(g -> results.add(toSummaryGrammar(g)));
        }

        if (normalizedType == null || TYPE_READING.equalsIgnoreCase(normalizedType)) {
            readingLessonRepository.findByIsActiveTrue()
                    .stream()
                    .filter(r -> Boolean.TRUE.equals(r.getIsActive()))
                    .filter(r -> normalizedLevel == null || normalizedLevel.equalsIgnoreCase(r.getJlptLevel()))
                    .filter(r -> matchSearch(search, r.getTitle(), r.getDescription()))
                    .forEach(r -> results.add(toSummaryReading(r)));
        }

        if (normalizedType == null || TYPE_LISTENING.equalsIgnoreCase(normalizedType)) {
            listeningLessonRepository.findByIsActiveTrue()
                    .stream()
                    .filter(l -> Boolean.TRUE.equals(l.getIsActive()))
                    .filter(l -> normalizedLevel == null || normalizedLevel.equalsIgnoreCase(l.getJlptLevel()))
                    .filter(l -> matchSearch(search, l.getTitle(), l.getDescription()))
                    .forEach(l -> results.add(toSummaryListening(l)));
        }

        // Stable order: level, lesson number, title
        results.sort((a, b) -> {
            String l1 = a.getLevel() == null ? "" : a.getLevel();
            String l2 = b.getLevel() == null ? "" : b.getLevel();
            int c = l1.compareTo(l2);
            if (c != 0) return c;
            Integer n1 = a.getLessonNumber() == null ? Integer.MAX_VALUE : a.getLessonNumber();
            Integer n2 = b.getLessonNumber() == null ? Integer.MAX_VALUE : b.getLessonNumber();
            c = Integer.compare(n1, n2);
            if (c != 0) return c;
            String t1 = a.getTitle() == null ? "" : a.getTitle();
            String t2 = b.getTitle() == null ? "" : b.getTitle();
            return t1.compareTo(t2);
        });

        return results;
    }

    // ═══════════════════════════════════════════════════════════════════
    // DETAIL
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Fetch a single published material and produce its formatted AI context.
     *
     * @param type material type (validated)
     * @param id   lesson UUID
     * @return material detail with formatted content capped at MATERIAL_CONTENT_LIMIT chars
     * @throws BadRequestException     on unknown / invalid type
     * @throws ResourceNotFoundException on unknown / unpublished material
     */
    @Transactional(readOnly = true)
    public AiMaterialDetailResponse getMaterialDetail(String type, UUID id) {
        String normalizedType = normalizeTypeOrThrow(type);

        return switch (normalizedType) {
            case TYPE_VOCABULARY -> getVocabularyDetail(id);
            case TYPE_GRAMMAR -> getGrammarDetail(id);
            case TYPE_READING -> getReadingDetail(id);
            case TYPE_LISTENING -> getListeningDetail(id);
            default -> throw new BadRequestException("Unsupported material type: " + type);
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    // TYPE-SPECIFIC DETAIL BUILDERS
    // ═══════════════════════════════════════════════════════════════════

    private AiMaterialDetailResponse getVocabularyDetail(UUID id) {
        VocabularyLesson lesson = vocabularyLessonRepository.findById(id)
                .filter(VocabularyLesson::getIsActive)
                .filter(VocabularyLesson::getIsPublished)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vocabulary material not found or not available"));

        List<VocabularyItem> items = vocabularyItemRepository
                .findByVocabularyLessonIdOrderByItemOrderAsc(lesson.getId());

        StringBuilder sb = new StringBuilder();
        sb.append("Vocabulary Lesson: ").append(safe(lesson.getTitle())).append('\n');
        if (lesson.getJlptLevel() != null) {
            sb.append("JLPT Level: ").append(lesson.getJlptLevel()).append('\n');
        }
        if (lesson.getDescription() != null && !lesson.getDescription().isBlank()) {
            sb.append('\n').append(lesson.getDescription()).append('\n');
        }
        sb.append('\n');

        for (VocabularyItem item : items) {
            sb.append("- ").append(safe(item.getJapanese()));
            if (item.getFurigana() != null && !item.getFurigana().isBlank()) {
                sb.append(" [").append(item.getFurigana()).append(']');
            }
            sb.append(": ").append(safe(item.getMeaning()));
            if (item.getPartOfSpeech() != null && !item.getPartOfSpeech().isBlank()) {
                sb.append(" (").append(item.getPartOfSpeech()).append(')');
            }
            if (item.getExampleSentence() != null && !item.getExampleSentence().isBlank()) {
                sb.append('\n').append("  Example: ").append(item.getExampleSentence());
                if (item.getExampleTranslation() != null && !item.getExampleTranslation().isBlank()) {
                    sb.append(" — ").append(item.getExampleTranslation());
                }
            }
            sb.append('\n');
        }

        return buildResponse(TYPE_VOCABULARY, lesson.getId(), lesson.getTitle(),
                lesson.getJlptLevel(), lesson.getLessonNumber(), sb.toString());
    }

    private AiMaterialDetailResponse getGrammarDetail(UUID id) {
        GrammarLesson lesson = grammarLessonRepository.findById(id)
                .filter(GrammarLesson::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Grammar material not found or not available"));

        List<GrammarContent> contents = grammarContentRepository
                .findByGrammarLessonIdOrderByContentOrderAsc(lesson.getId());

        StringBuilder sb = new StringBuilder();
        sb.append("Grammar Lesson: ").append(safe(lesson.getTitle())).append('\n');
        if (lesson.getJlptLevel() != null) {
            sb.append("JLPT Level: ").append(lesson.getJlptLevel()).append('\n');
        }
        if (lesson.getDescription() != null && !lesson.getDescription().isBlank()) {
            sb.append('\n').append(lesson.getDescription()).append('\n');
        }
        sb.append('\n');

        for (GrammarContent content : contents) {
            if (content.getPattern() != null && !content.getPattern().isBlank()) {
                sb.append("- Pattern: ").append(content.getPattern());
                if (content.getMeaning() != null && !content.getMeaning().isBlank()) {
                    sb.append(" — Meaning: ").append(content.getMeaning());
                }
                sb.append('\n');
            }
            if (content.getStructure() != null && !content.getStructure().isBlank()) {
                sb.append("  Structure: ").append(content.getStructure()).append('\n');
            }
            if (content.getUsage() != null && !content.getUsage().isBlank()) {
                sb.append("  Usage: ").append(content.getUsage()).append('\n');
            }

            List<GrammarExample> examples = content.getExamples() == null || content.getExamples().isEmpty()
                    ? grammarExampleRepository.findByGrammarContentIdOrderByExampleOrderAsc(content.getId())
                    : content.getExamples();
            for (GrammarExample ex : examples) {
                if (ex.getJapanese() != null && !ex.getJapanese().isBlank()) {
                    sb.append("  Example: ").append(ex.getJapanese());
                    if (ex.getVietnameseMeaning() != null && !ex.getVietnameseMeaning().isBlank()) {
                        sb.append(" — ").append(ex.getVietnameseMeaning());
                    }
                    sb.append('\n');
                }
            }
            sb.append('\n');
        }

        return buildResponse(TYPE_GRAMMAR, lesson.getId(), lesson.getTitle(),
                lesson.getJlptLevel(), lesson.getLessonNumber(), sb.toString());
    }

    private AiMaterialDetailResponse getReadingDetail(UUID id) {
        ReadingLesson lesson = readingLessonRepository.findById(id)
                .filter(ReadingLesson::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reading material not found or not available"));

        StringBuilder sb = new StringBuilder();
        sb.append("Reading Lesson: ").append(safe(lesson.getTitle())).append('\n');
        if (lesson.getJlptLevel() != null) {
            sb.append("JLPT Level: ").append(lesson.getJlptLevel()).append('\n');
        }
        if (lesson.getDescription() != null && !lesson.getDescription().isBlank()) {
            sb.append('\n').append(lesson.getDescription()).append('\n');
        }
        sb.append("\nPassage:\n").append(safe(lesson.getPassage())).append('\n');
        if (lesson.getVietnameseTranslation() != null && !lesson.getVietnameseTranslation().isBlank()) {
            sb.append("\nTranslation:\n").append(lesson.getVietnameseTranslation()).append('\n');
        }
        if (lesson.getQuestions() != null && !lesson.getQuestions().isEmpty()) {
            sb.append("\nPractice questions:\n");
            for (int i = 0; i < lesson.getQuestions().size(); i++) {
                var q = lesson.getQuestions().get(i);
                sb.append(i + 1).append(". ").append(safe(q.getQuestion())).append('\n');
            }
        }

        return buildResponse(TYPE_READING, lesson.getId(), lesson.getTitle(),
                lesson.getJlptLevel(), lesson.getLessonNumber(), sb.toString());
    }

    private AiMaterialDetailResponse getListeningDetail(UUID id) {
        ListeningLesson lesson = listeningLessonRepository.findById(id)
                .filter(ListeningLesson::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Listening material not found or not available"));

        StringBuilder sb = new StringBuilder();
        sb.append("Listening Lesson: ").append(safe(lesson.getTitle())).append('\n');
        if (lesson.getJlptLevel() != null) {
            sb.append("JLPT Level: ").append(lesson.getJlptLevel()).append('\n');
        }
        if (lesson.getDescription() != null && !lesson.getDescription().isBlank()) {
            sb.append('\n').append(lesson.getDescription()).append('\n');
        }
        if (lesson.getTranscript() != null && !lesson.getTranscript().isBlank()) {
            sb.append("\nTranscript:\n").append(lesson.getTranscript()).append('\n');
        }
        if (lesson.getListeningItems() != null && !lesson.getListeningItems().isEmpty()) {
            sb.append("\nPractice items: ").append(lesson.getListeningItems().size()).append('\n');
        }

        return buildResponse(TYPE_LISTENING, lesson.getId(), lesson.getTitle(),
                lesson.getJlptLevel(), lesson.getLessonNumber(), sb.toString());
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private AiMaterialDetailResponse buildResponse(String type, UUID id, String title,
                                                   String level, Integer lessonNumber,
                                                   String rawContent) {
        // Defensive null / blank handling for inputs that are technically
        // non-null but meaningless.
        if (rawContent == null) rawContent = "";

        TruncationResult result = truncateUnicodeSafe(rawContent, MATERIAL_CONTENT_LIMIT);

        if (result.truncated) {
            log.info("[AiMaterialService] Material content for type={} id={} truncated to {} chars",
                    type, id, result.content.length());
        }

        return AiMaterialDetailResponse.builder()
                .type(type)
                .id(id)
                .title(title)
                .level(level)
                .lessonNumber(lessonNumber)
                .content(result.content)
                .truncated(result.truncated)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // UNICODE-SAFE TRUNCATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Result of truncating a string to a maximum length while preserving
     * Unicode code-point integrity.
     */
    public static final class TruncationResult {
        public final String content;
        public final boolean truncated;

        TruncationResult(String content, boolean truncated) {
            this.content = content;
            this.truncated = truncated;
        }
    }

    /**
     * Truncate {@code value} to at most {@code maxLength} Java characters,
     * never splitting a surrogate pair and never exceeding the limit.
     *
     * <p>This matters because Java strings are sequences of UTF-16 code
     * units, not Unicode code points. Characters outside the Basic
     * Multilingual Plane (most emoji, many rare CJK ideographs, etc.) are
     * represented as two {@code char}s (a high surrogate and a low
     * surrogate). A naive {@code substring(0, maxLength)} would happily
     * cut between the two halves and produce an invalid string.
     *
     * <p>This helper:
     * <ul>
     *   <li>Returns the input unchanged when it already fits within the limit</li>
     *   <li>Sets {@code truncated=false} when the input length is {@code <=} the limit</li>
     *   <li>If the cut point falls between a high and a low surrogate,
     *       backs off by one char so the surrogate pair is preserved</li>
     *   <li>Always returns a string whose {@code length()} is {@code <=} {@code maxLength}</li>
     *   <li>Never operates at byte level — multibyte safety is enforced
     *       at the char (UTF-16 code unit) level</li>
     * </ul>
     *
     * <p>Normal Japanese text (kana + common kanji) is entirely within the
     * BMP and is unaffected by the surrogate check.
     *
     * @param value     the input string (may be null)
     * @param maxLength the maximum allowed length in UTF-16 code units
     * @return a {@link TruncationResult} carrying the (possibly truncated)
     *         string and a flag indicating whether truncation occurred
     */
    public static TruncationResult truncateUnicodeSafe(String value, int maxLength) {
        if (value == null) {
            return new TruncationResult("", false);
        }
        if (maxLength <= 0) {
            return new TruncationResult("", value.length() > 0);
        }
        if (value.length() <= maxLength) {
            return new TruncationResult(value, false);
        }

        int cut = maxLength;
        // If the cut point would split a surrogate pair, back off one char.
        // A high surrogate at (cut - 1) must be followed by a low surrogate
        // at cut. If the char at cut is NOT a low surrogate, the pair is
        // already broken and we keep the high surrogate alone — but that is
        // a corrupt sequence we should not emit, so back off instead.
        if (cut > 0 && Character.isHighSurrogate(value.charAt(cut - 1))) {
            cut--;
        }
        // Also guard against cut landing inside a surrogate pair from
        // the other direction (cut is a low surrogate with high at cut-1).
        // After the adjustment above, if cut > 0 and value.charAt(cut) is a
        // low surrogate, value.charAt(cut - 1) must be the matching high —
        // but we already verified it, so this is consistent.
        return new TruncationResult(value.substring(0, cut), true);
    }

    private AiMaterialSummaryResponse toSummaryVocabulary(VocabularyLesson v) {
        return AiMaterialSummaryResponse.builder()
                .type(TYPE_VOCABULARY)
                .id(v.getId())
                .title(v.getTitle())
                .level(v.getJlptLevel())
                .lessonNumber(v.getLessonNumber())
                .shortDescription(v.getDescription())
                .updatedAt(v.getUpdatedAt())
                .build();
    }

    private AiMaterialSummaryResponse toSummaryGrammar(GrammarLesson g) {
        return AiMaterialSummaryResponse.builder()
                .type(TYPE_GRAMMAR)
                .id(g.getId())
                .title(g.getTitle())
                .level(g.getJlptLevel())
                .lessonNumber(g.getLessonNumber())
                .shortDescription(g.getDescription())
                .updatedAt(g.getUpdatedAt())
                .build();
    }

    private AiMaterialSummaryResponse toSummaryReading(ReadingLesson r) {
        return AiMaterialSummaryResponse.builder()
                .type(TYPE_READING)
                .id(r.getId())
                .title(r.getTitle())
                .level(r.getJlptLevel())
                .lessonNumber(r.getLessonNumber())
                .shortDescription(r.getDescription())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private AiMaterialSummaryResponse toSummaryListening(ListeningLesson l) {
        return AiMaterialSummaryResponse.builder()
                .type(TYPE_LISTENING)
                .id(l.getId())
                .title(l.getTitle())
                .level(l.getJlptLevel())
                .lessonNumber(l.getLessonNumber())
                .shortDescription(l.getDescription())
                .updatedAt(l.getUpdatedAt())
                .build();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static boolean matchSearch(String search, String title, String description) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase(Locale.ROOT);
        if (title != null && title.toLowerCase(Locale.ROOT).contains(q)) return true;
        if (description != null && description.toLowerCase(Locale.ROOT).contains(q)) return true;
        return false;
    }

    /**
     * @return normalized upper-case type, or {@code null} when no type filter is given.
     */
    private static String normalizeTypeOrNull(String type) {
        if (type == null || type.isBlank()) return null;
        return normalizeTypeOrThrow(type);
    }

    /**
     * @throws BadRequestException if type is unknown
     */
    public static String normalizeTypeOrThrow(String type) {
        if (type == null || type.isBlank()) {
            throw new BadRequestException("Material type is required");
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case TYPE_VOCABULARY, TYPE_GRAMMAR, TYPE_READING, TYPE_LISTENING -> normalized;
            default -> throw new BadRequestException(
                    "Invalid material type. Allowed: VOCABULARY, GRAMMAR, READING, LISTENING");
        };
    }

    /**
     * Returns upper-case level or {@code null} when none is given.
     * Does not reject — leaves "N5" vs "n5" normalization for the caller.
     */
    private static String normalizeLevelOrNull(String level) {
        if (level == null || level.isBlank()) return null;
        return level.trim().toUpperCase(Locale.ROOT);
    }
}
