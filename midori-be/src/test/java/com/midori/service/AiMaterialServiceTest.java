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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AiMaterialService}.
 *
 * <p>Covers:
 * <ul>
 *   <li>Published-only filter (vocabulary isActive AND isPublished,
 *       other types isActive only)</li>
 *   <li>Type / level / search filters</li>
 *   <li>Detail endpoint: validation, IDOR safety (unpublished / inactive excluded)</li>
 *   <li>Content formatting by type</li>
 *   <li>12000-character truncation flag</li>
 *   <li>List endpoint does not return full content</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiMaterialServiceTest {

    @Mock private VocabularyLessonRepository vocabularyLessonRepository;
    @Mock private VocabularyItemRepository vocabularyItemRepository;
    @Mock private GrammarLessonRepository grammarLessonRepository;
    @Mock private GrammarContentRepository grammarContentRepository;
    @Mock private GrammarExampleRepository grammarExampleRepository;
    @Mock private ReadingLessonRepository readingLessonRepository;
    @Mock private ListeningLessonRepository listeningLessonRepository;

    @InjectMocks private AiMaterialService service;

    private UUID vocabId;
    private UUID grammarId;
    private UUID readingId;
    private UUID listeningId;

    @BeforeEach
    void setUp() {
        vocabId = UUID.randomUUID();
        grammarId = UUID.randomUUID();
        readingId = UUID.randomUUID();
        listeningId = UUID.randomUUID();
    }

    // ═══════════════════════════════════════════════════════════════════
    // LIST
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("List Materials")
    class ListMaterialsTests {

        @Test
        @DisplayName("List returns published vocab + active grammar/reading/listening only")
        void list_publishedOnly() {
            VocabularyLesson published = vocab(true, true, "N5", 1, "Vocab Title");
            VocabularyLesson unpublished = vocab(true, false, "N5", 2, "Vocab Draft");
            VocabularyLesson inactive = vocab(false, true, "N5", 3, "Vocab Inactive");

            GrammarLesson grammar = grammar(true, "N5", 1, "Grammar 1");
            ReadingLesson reading = reading(true, "N5", 1, "Reading 1");
            ListeningLesson listening = listening(true, "N5", 1, "Listening 1");

            when(vocabularyLessonRepository.findByIsActiveTrueAndIsPublishedTrue())
                    .thenReturn(List.of(published, unpublished, inactive));
            when(grammarLessonRepository.findByIsActiveTrue()).thenReturn(List.of(grammar));
            when(readingLessonRepository.findByIsActiveTrue()).thenReturn(List.of(reading));
            when(listeningLessonRepository.findByIsActiveTrue()).thenReturn(List.of(listening));

            List<AiMaterialSummaryResponse> result = service.listMaterials(null, null, null);

            assertEquals(4, result.size(), "Only 1 vocab + 1 grammar + 1 reading + 1 listening");

            // Published vocab present
            AiMaterialSummaryResponse v = result.stream()
                    .filter(m -> "VOCABULARY".equals(m.getType()))
                    .findFirst().orElseThrow();
            assertEquals(published.getId(), v.getId());
            assertEquals("Vocab Title", v.getTitle());

            // The other types are present
            assertTrue(result.stream().anyMatch(m -> "GRAMMAR".equals(m.getType())));
            assertTrue(result.stream().anyMatch(m -> "READING".equals(m.getType())));
            assertTrue(result.stream().anyMatch(m -> "LISTENING".equals(m.getType())));
        }

        @Test
        @DisplayName("List with type=VOCABULARY excludes grammar/reading/listening")
        void list_typeFilter() {
            VocabularyLesson vocab = vocab(true, true, "N5", 1, "Vocab 1");
            GrammarLesson grammar = grammar(true, "N5", 1, "Grammar 1");
            ReadingLesson reading = reading(true, "N5", 1, "Reading 1");
            ListeningLesson listening = listening(true, "N5", 1, "Listening 1");

            when(vocabularyLessonRepository.findByIsActiveTrueAndIsPublishedTrue())
                    .thenReturn(List.of(vocab));
            // The other repos are not invoked when type=VOCABULARY, but
            // we still stub them to be defensive.
            when(grammarLessonRepository.findByIsActiveTrue()).thenReturn(List.of(grammar));
            when(readingLessonRepository.findByIsActiveTrue()).thenReturn(List.of(reading));
            when(listeningLessonRepository.findByIsActiveTrue()).thenReturn(List.of(listening));

            List<AiMaterialSummaryResponse> result = service.listMaterials("VOCABULARY", null, null);
            assertEquals(1, result.size());
            assertEquals("VOCABULARY", result.get(0).getType());
        }

        @Test
        @DisplayName("List with unknown type returns BadRequestException")
        void list_invalidType() {
            assertThrows(BadRequestException.class,
                    () -> service.listMaterials("unsupported", null, null));
        }

        @Test
        @DisplayName("List filters by level")
        void list_levelFilter() {
            VocabularyLesson n5 = vocab(true, true, "N5", 1, "Vocab N5");
            VocabularyLesson n4 = vocab(true, true, "N4", 1, "Vocab N4");
            when(vocabularyLessonRepository.findByIsActiveTrueAndIsPublishedTrue())
                    .thenReturn(List.of(n5, n4));
            when(grammarLessonRepository.findByIsActiveTrue()).thenReturn(List.of());
            when(readingLessonRepository.findByIsActiveTrue()).thenReturn(List.of());
            when(listeningLessonRepository.findByIsActiveTrue()).thenReturn(List.of());

            List<AiMaterialSummaryResponse> result = service.listMaterials(null, "N5", null);
            assertEquals(1, result.size());
            assertEquals("N5", result.get(0).getLevel());
        }

        @Test
        @DisplayName("List applies search filter on title + description")
        void list_searchFilter() {
            VocabularyLesson match = vocab(true, true, "N5", 1, "Greetings");
            match.setDescription("Common hello phrases");
            VocabularyLesson noMatch = vocab(true, true, "N5", 2, "Numbers");
            noMatch.setDescription("Counting 1-100");

            when(vocabularyLessonRepository.findByIsActiveTrueAndIsPublishedTrue())
                    .thenReturn(List.of(match, noMatch));
            when(grammarLessonRepository.findByIsActiveTrue()).thenReturn(List.of());
            when(readingLessonRepository.findByIsActiveTrue()).thenReturn(List.of());
            when(listeningLessonRepository.findByIsActiveTrue()).thenReturn(List.of());

            List<AiMaterialSummaryResponse> result = service.listMaterials(null, null, "hello");
            assertEquals(1, result.size());
            assertEquals("Greetings", result.get(0).getTitle());
        }

        @Test
        @DisplayName("List endpoint does NOT include full content")
        void list_noContent() {
            VocabularyLesson vocab = vocab(true, true, "N5", 1, "Vocab 1");
            // Force the list DTO builder; ensure no field carries lesson body
            when(vocabularyLessonRepository.findByIsActiveTrueAndIsPublishedTrue())
                    .thenReturn(List.of(vocab));
            when(grammarLessonRepository.findByIsActiveTrue()).thenReturn(List.of());
            when(readingLessonRepository.findByIsActiveTrue()).thenReturn(List.of());
            when(listeningLessonRepository.findByIsActiveTrue()).thenReturn(List.of());

            List<AiMaterialSummaryResponse> result = service.listMaterials(null, null, null);

            // Verify the AiMaterialSummaryResponse class has no `content` field
            // (this is enforced at compile time by the DTO design)
            for (Field f : AiMaterialSummaryResponse.class.getDeclaredFields()) {
                assertNotEquals("content", f.getName(),
                        "List DTO must not carry a 'content' field");
            }

            // And we only return the lightweight payload
            AiMaterialSummaryResponse r = result.get(0);
            assertNotNull(r.getId());
            assertNotNull(r.getType());
            assertNotNull(r.getTitle());
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // DETAIL
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Get Material Detail")
    class GetDetailTests {

        @Test
        @DisplayName("Vocabulary detail returns formatted content with items")
        void detail_vocabulary() {
            VocabularyLesson lesson = vocab(true, true, "N5", 1, "Vocab 1");
            lesson.setDescription("Lesson description");
            VocabularyItem item = VocabularyItem.builder()
                    .id(UUID.randomUUID())
                    .vocabularyLesson(lesson)
                    .itemOrder(1)
                    .japanese("食べる")
                    .furigana("たべる")
                    .meaning("ăn")
                    .partOfSpeech("動詞")
                    .exampleSentence("日本食を食べる。")
                    .exampleTranslation("Ăn đồ ăn Nhật.")
                    .build();

            when(vocabularyLessonRepository.findById(vocabId))
                    .thenReturn(Optional.of(lesson));
            when(vocabularyItemRepository.findByVocabularyLessonIdOrderByItemOrderAsc(vocabId))
                    .thenReturn(List.of(item));

            AiMaterialDetailResponse detail = service.getMaterialDetail("VOCABULARY", vocabId);
            assertEquals("VOCABULARY", detail.getType());
            assertEquals("Vocab 1", detail.getTitle());
            assertEquals("N5", detail.getLevel());
            assertFalse(detail.isTruncated());
            assertTrue(detail.getContent().contains("食べる"));
            assertTrue(detail.getContent().contains("ăn"));
            assertTrue(detail.getContent().contains("Example"));
        }

        @Test
        @DisplayName("Grammar detail returns formatted patterns + examples")
        void detail_grammar() {
            GrammarLesson lesson = grammar(true, "N5", 1, "Grammar 1");
            GrammarContent content = GrammarContent.builder()
                    .id(UUID.randomUUID())
                    .grammarLesson(lesson)
                    .contentOrder(1)
                    .pattern("〜です")
                    .meaning("lịch sự")
                    .structure("[Danh từ] + です")
                    .usage("Dùng trong hội thoại lịch sự")
                    .build();
            GrammarExample example = GrammarExample.builder()
                    .id(UUID.randomUUID())
                    .grammarContent(content)
                    .exampleOrder(1)
                    .japanese("私は学生です")
                    .vietnameseMeaning("Tôi là sinh viên")
                    .build();
            content.setExamples(List.of(example));

            when(grammarLessonRepository.findById(grammarId)).thenReturn(Optional.of(lesson));
            when(grammarContentRepository.findByGrammarLessonIdOrderByContentOrderAsc(grammarId))
                    .thenReturn(List.of(content));

            AiMaterialDetailResponse detail = service.getMaterialDetail("GRAMMAR", grammarId);
            assertTrue(detail.getContent().contains("〜です"));
            assertTrue(detail.getContent().contains("私は学生です"));
            assertTrue(detail.getContent().contains("Pattern"));
        }

        @Test
        @DisplayName("Reading detail returns passage + translation")
        void detail_reading() {
            ReadingLesson lesson = reading(true, "N5", 1, "Reading 1");
            lesson.setPassage("私の名前は田中です。");
            lesson.setVietnameseTranslation("Tên tôi là Tanaka.");

            when(readingLessonRepository.findById(readingId)).thenReturn(Optional.of(lesson));

            AiMaterialDetailResponse detail = service.getMaterialDetail("READING", readingId);
            assertTrue(detail.getContent().contains("私の名前は田中です"));
            assertTrue(detail.getContent().contains("Tên tôi là Tanaka"));
        }

        @Test
        @DisplayName("Listening detail returns transcript")
        void detail_listening() {
            ListeningLesson lesson = listening(true, "N5", 1, "Listening 1");
            lesson.setTranscript("A: すみません。");

            when(listeningLessonRepository.findById(listeningId)).thenReturn(Optional.of(lesson));

            AiMaterialDetailResponse detail = service.getMaterialDetail("LISTENING", listeningId);
            assertTrue(detail.getContent().contains("Transcript"));
            assertTrue(detail.getContent().contains("すみません"));
        }

        @Test
        @DisplayName("Detail returns 404 (ResourceNotFoundException) for unpublished vocab")
        void detail_vocab_unpublished() {
            VocabularyLesson unpublished = vocab(true, false, "N5", 1, "Draft");
            when(vocabularyLessonRepository.findById(vocabId)).thenReturn(Optional.of(unpublished));
            assertThrows(ResourceNotFoundException.class,
                    () -> service.getMaterialDetail("VOCABULARY", vocabId));
        }

        @Test
        @DisplayName("Detail returns 404 for inactive grammar/reading/listening")
        void detail_inactive() {
            GrammarLesson inactive = grammar(false, "N5", 1, "Grammar");
            when(grammarLessonRepository.findById(grammarId)).thenReturn(Optional.of(inactive));
            assertThrows(ResourceNotFoundException.class,
                    () -> service.getMaterialDetail("GRAMMAR", grammarId));
        }

        @Test
        @DisplayName("Detail returns 404 for unknown id (any type)")
        void detail_unknownId() {
            UUID unknown = UUID.randomUUID();
            when(vocabularyLessonRepository.findById(unknown)).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class,
                    () -> service.getMaterialDetail("VOCABULARY", unknown));
        }

        @Test
        @DisplayName("Detail returns 400 for invalid type")
        void detail_invalidType() {
            assertThrows(BadRequestException.class,
                    () -> service.getMaterialDetail("kanji", vocabId));
            assertThrows(BadRequestException.class,
                    () -> service.getMaterialDetail("", vocabId));
            assertThrows(BadRequestException.class,
                    () -> service.getMaterialDetail(null, vocabId));
        }

        @Test
        @DisplayName("Detail content is truncated when exceeding 12000 characters")
        void detail_truncation() {
            StringBuilder bigDescription = new StringBuilder();
            bigDescription.append("x".repeat(AiMaterialService.MATERIAL_CONTENT_LIMIT + 500));

            ReadingLesson lesson = reading(true, "N5", 1, "Big");
            lesson.setPassage(bigDescription.toString());
            lesson.setVietnameseTranslation(null);

            when(readingLessonRepository.findById(readingId)).thenReturn(Optional.of(lesson));

            AiMaterialDetailResponse detail = service.getMaterialDetail("READING", readingId);
            assertTrue(detail.isTruncated(), "Truncated flag must be set");
            assertEquals(AiMaterialService.MATERIAL_CONTENT_LIMIT, detail.getContent().length());
        }

        @Test
        @DisplayName("Detail content never exceeds 12000 characters")
        void detail_contentLimit() {
            StringBuilder big = new StringBuilder();
            big.append("a".repeat(20_000));
            VocabularyLesson lesson = vocab(true, true, "N5", 1, "Big");
            lesson.setDescription(big.toString());

            VocabularyItem item = VocabularyItem.builder()
                    .id(UUID.randomUUID())
                    .vocabularyLesson(lesson)
                    .itemOrder(1)
                    .japanese("水")
                    .meaning("nước")
                    .build();

            when(vocabularyLessonRepository.findById(vocabId)).thenReturn(Optional.of(lesson));
            when(vocabularyItemRepository.findByVocabularyLessonIdOrderByItemOrderAsc(vocabId))
                    .thenReturn(List.of(item));

            AiMaterialDetailResponse detail = service.getMaterialDetail("VOCABULARY", vocabId);
            assertTrue(detail.getContent().length() <= AiMaterialService.MATERIAL_CONTENT_LIMIT,
                    "Content length " + detail.getContent().length()
                            + " must be <= " + AiMaterialService.MATERIAL_CONTENT_LIMIT);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // UNICODE-SAFE TRUNCATION (helper method)
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Unicode-safe truncation helper")
    class UnicodeSafeTruncationTests {

        @Test
        @DisplayName("normal Japanese text shorter than limit is returned untouched")
        void truncate_underLimit_japaneseText() {
            String value = "これは日本語のテキストです。漢字とひらがなとカタカナ。";
            AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe(value, 12000);
            assertEquals(value, r.content);
            assertFalse(r.truncated);
        }

        @Test
        @DisplayName("content exactly at the limit is not truncated")
        void truncate_atExactLimit_notTruncated() {
            String value = "a".repeat(12000);
            AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe(value, 12000);
            assertEquals(12000, r.content.length());
            assertFalse(r.truncated);
        }

        @Test
        @DisplayName("content one char above the limit is truncated and flagged")
        void truncate_aboveLimit_truncatedAndFlagged() {
            String value = "a".repeat(12001);
            AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe(value, 12000);
            assertEquals(12000, r.content.length());
            assertTrue(r.truncated);
        }

        @Test
        @DisplayName("never splits a surrogate pair (emoji at the cut boundary)")
        void truncate_neverSplitsSurrogatePair() {
            // 🎌 (Japanese flag emoji) = U+1F38C, encoded as a surrogate pair in UTF-16
            String flagEmoji = "\uD83C\uDF8C";
            // Build a string whose 12000th char is the high surrogate of the flag.
            // We use a long ASCII prefix followed by a final flag emoji so the
            // cut at index 12000 would land on the high surrogate.
            String value = "x".repeat(11999) + flagEmoji + "trailing";
            assertTrue(value.length() > 12000);

            AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe(value, 12000);

            // Result must be a valid string — no orphan surrogate at the end
            if (!r.content.isEmpty()) {
                char last = r.content.charAt(r.content.length() - 1);
                assertFalse(Character.isHighSurrogate(last) || Character.isLowSurrogate(last),
                        "Result must not end in an orphan surrogate");
            }
            // Length must be within limit
            assertTrue(r.content.length() <= 12000);
            // Must be flagged as truncated
            assertTrue(r.truncated);
            // The cut was on or after the high surrogate; either the high
            // surrogate was kept with the trailing data, or it was dropped
            // to avoid the split. Either way the content is well-formed.
        }

        @Test
        @DisplayName("surrogate pair entirely past the cut is dropped together")
        void truncate_surrogatePairPastCut_droppedTogether() {
            String flagEmoji = "\uD83C\uDF8C";
            // 11998 ASCII chars + emoji at the very end (length 12000)
            String value = "x".repeat(11998) + flagEmoji;
            assertEquals(12000, value.length());

            // Cut to 11998 — emoji must be dropped, not half of it
            AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe(value, 11998);
            assertEquals(11998, r.content.length());
            assertTrue(r.truncated);
            for (int i = 0; i < r.content.length(); i++) {
                assertFalse(Character.isLowSurrogate(r.content.charAt(i)),
                        "Result must not contain an orphan low surrogate at index " + i);
            }
        }

        @Test
        @DisplayName("truncation never exceeds the configured limit")
        void truncate_neverExceedsLimit() {
            String value = "あいうえお".repeat(5000); // lots of Japanese chars
            for (int limit = 1; limit <= 200; limit += 7) {
                AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe(value, limit);
                assertTrue(r.content.length() <= limit,
                        "Length " + r.content.length() + " exceeded limit " + limit);
            }
        }

        @Test
        @DisplayName("null input produces empty non-truncated result")
        void truncate_null_safe() {
            AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe(null, 100);
            assertEquals("", r.content);
            assertFalse(r.truncated);
        }

        @Test
        @DisplayName("empty input produces empty non-truncated result")
        void truncate_empty_safe() {
            AiMaterialService.TruncationResult r = AiMaterialService.truncateUnicodeSafe("", 100);
            assertEquals("", r.content);
            assertFalse(r.truncated);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELPERS — entity builders
    // ═══════════════════════════════════════════════════════════════════

    private VocabularyLesson vocab(boolean active, boolean published, String level,
                                   Integer num, String title) {
        return VocabularyLesson.builder()
                .id(vocabId)
                .jlptLevel(level)
                .lessonNumber(num)
                .title(title)
                .description("desc")
                .isActive(active)
                .isPublished(published)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private GrammarLesson grammar(boolean active, String level, Integer num, String title) {
        return GrammarLesson.builder()
                .id(grammarId)
                .jlptLevel(level)
                .lessonNumber(num)
                .title(title)
                .description("desc")
                .isActive(active)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private ReadingLesson reading(boolean active, String level, Integer num, String title) {
        return ReadingLesson.builder()
                .id(readingId)
                .jlptLevel(level)
                .lessonNumber(num)
                .title(title)
                .description("desc")
                .passage("passage")
                .isActive(active)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private ListeningLesson listening(boolean active, String level, Integer num, String title) {
        return ListeningLesson.builder()
                .id(listeningId)
                .jlptLevel(level)
                .lessonNumber(num)
                .title(title)
                .description("desc")
                .transcript("transcript")
                .isActive(active)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }
}
