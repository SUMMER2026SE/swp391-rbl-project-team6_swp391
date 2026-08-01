package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiTaskType;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.exception.AiProcessingException;
import com.midori.dto.contentlibrary.AdminAiContentGenerateRequest;
import com.midori.dto.contentlibrary.AdminAiContentGenerateResponse;
import com.midori.service.impl.AdminAiContentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for Reading AI content generation validation in AdminAiContentServiceImpl.
 * Validates that:
 * - A passage with non-blank content but zero valid questions is removed.
 * - A passage whose questions fail validation (wrong count, no/dupe correct) is removed.
 * - Mixed drafts return only valid passages with a descriptive warning.
 * - All-invalid drafts throw a clear AiProcessingException.
 *
 * Scope: Reading validation only. Vocabulary/Grammar behaviors are unaffected.
 * Shadowing files are NOT referenced.
 *
 * Contract: Content Library Reading is MCQ-only.
 * Each passage requires: non-blank content + at least one valid question.
 * Each question requires: non-blank questionText + exactly 4 non-blank options + exactly 1 correct option.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminAiContentReadingValidationTest {

    @Mock
    private AiCoreService aiCoreService;

    @Mock
    private DocumentTextExtractor documentTextExtractor;

    private ObjectMapper objectMapper;
    private AdminAiContentServiceImpl service;

    // ── Hardcoded JSON fixtures ────────────────────────────────
    // These bypass Jackson serialization entirely so there are no setup-time issues.

    // 2 valid questions, valid passage
    private static final String FIXTURE_VALID_2Q = """
            {"title":"Test Reading","description":"Test description",
             "passages":[{"content":"図書館で本を借りました。","questions":[
               {"questionText":"この文について正しい説明はどれですか。",
                "options":[{"optionText":"答え1","isCorrect":false},{"optionText":"答え2","isCorrect":true},
                           {"optionText":"答え3","isCorrect":false},{"optionText":"答え4","isCorrect":false}]},
               {"questionText":"著者はどんな気持ちですか。",
                "options":[{"optionText":"答えA","isCorrect":false},{"optionText":"答えB","isCorrect":false},
                           {"optionText":"答えC","isCorrect":true},{"optionText":"答えD","isCorrect":false}]}
             ]}]}
            """;

    // Passage with zero questions (mixed with a valid passage so response is partial, not all-filtered)
    private static final String FIXTURE_ZERO_QUESTIONS = """
            {"title":"Test","description":null,"passages":[
              {"content":"図書館で本を借りました。","questions":[]},
              {"content":"有効な文章です。","questions":[
                {"questionText":"正しい説明はどれですか。",
                 "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                            {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}
              ]}
            ]}
            """;

    // Passage with 1 question that has blank questionText (invalid) — paired with a valid passage
    private static final String FIXTURE_ALL_INVALID_Q = """
            {"title":"Test","description":null,"passages":[
              {"content":"図書館で借りました。",
               "questions":[{"questionText":"","options":[
                 {"optionText":"A","isCorrect":true},{"optionText":"B","isCorrect":false},
                 {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}]},
              {"content":"有効な文章です。","questions":[
                {"questionText":"正しい説明はどれですか。",
                 "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                            {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}
              ]}
            ]}
            """;

    // First passage: blank content (invalid). Second: valid.
    private static final String FIXTURE_MIXED = """
            {"title":"Test","description":null,"passages":[
              {"content":"","questions":[{"questionText":"Q","options":[
                {"optionText":"A","isCorrect":true},{"optionText":"B","isCorrect":false},
                {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}]},
              {"content":"これは有効な文章です。","questions":[{"questionText":"正しい説明はどれですか。","options":[
                {"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}]}
            ]}
            """;

    // Two blank-content passages
    private static final String FIXTURE_ALL_INVALID = """
            {"title":"Test","description":null,"passages":[
              {"content":""},
              {"content":"   ","questions":[
                {"questionText":"","options":[{"optionText":"A","isCorrect":true},{"optionText":"B","isCorrect":false},
                           {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}]}
            ]}
            """;

    // 1 question, only 3 options — paired with valid passage
    private static final String FIXTURE_3_OPTIONS = """
            {"title":"Test","description":null,"passages":[
              {"content":"図書館で借りました。",
               "questions":[{"questionText":"正しい説明は？",
               "options":[{"optionText":"A","isCorrect":true},{"optionText":"B","isCorrect":false},{"optionText":"C","isCorrect":false}]}]},
              {"content":"有効な文章です。","questions":[
                {"questionText":"正しい説明はどれですか。",
                 "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                            {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}
              ]}
            ]}
            """;

    // 1 question, 6 options — paired with valid passage
    private static final String FIXTURE_6_OPTIONS = """
            {"title":"Test","description":null,"passages":[
              {"content":"図書館で借りました。",
               "questions":[{"questionText":"正しい説明は？",
               "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                          {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false},
                          {"optionText":"E","isCorrect":false},{"optionText":"F","isCorrect":false}]}]},
              {"content":"有効な文章です。","questions":[
                {"questionText":"正しい説明はどれですか。",
                 "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                            {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}
              ]}
            ]}
            """;

    // 1 question, 0 correct options — paired with valid passage
    private static final String FIXTURE_ZERO_CORRECT = """
            {"title":"Test","description":null,"passages":[
              {"content":"図書館で借りました。",
               "questions":[{"questionText":"正しい説明は？",
               "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":false},
                          {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}]},
              {"content":"有効な文章です。","questions":[
                {"questionText":"正しい説明はどれですか。",
                 "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                            {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}
              ]}
            ]}
            """;

    // 1 question, 2 correct options — paired with valid passage
    private static final String FIXTURE_MULTI_CORRECT = """
            {"title":"Test","description":null,"passages":[
              {"content":"図書館で借りました。",
               "questions":[{"questionText":"正しい説明は？",
               "options":[{"optionText":"A","isCorrect":true},{"optionText":"B","isCorrect":true},
                          {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}]},
              {"content":"有効な文章です。","questions":[
                {"questionText":"正しい説明はどれですか。",
                 "options":[{"optionText":"A","isCorrect":false},{"optionText":"B","isCorrect":true},
                            {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}
              ]}
            ]}
            """;

    // 1 valid passage + 1 blank-content passage
    private static final String FIXTURE_PARTIAL = """
            {"title":"Test","description":null,"passages":[
              {"content":"有効な文章です。","questions":[{"questionText":"正しい説明はどれですか。","options":[
                {"optionText":"A","isCorrect":true},{"optionText":"B","isCorrect":false},
                {"optionText":"C","isCorrect":false},{"optionText":"D","isCorrect":false}]}]},
              {"content":""}
            ]}
            """;

    private AdminAiContentGenerateRequest readingRequest() {
        return AdminAiContentGenerateRequest.builder()
                .skillType("READING").level("N5").lessonNumber(1)
                .lessonTitle("Test").topic("Daily Life")
                .passageCount(1).questionsPerPassage(3)
                .difficulty("Medium").build();
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new AdminAiContentServiceImpl(aiCoreService, objectMapper, documentTextExtractor);
        // Reset mocks between tests to avoid cross-test stub pollution
        reset(aiCoreService);
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 1 — Valid passage + valid questions → accepted
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Valid passage with valid questions is accepted")
    void validPassageAndQuestions_accepted() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_VALID_2Q);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size());
        assertEquals(2, resp.getReadingDraft().getPassages().get(0).getQuestions().size());
        assertNull(resp.getWarning(), "No warning expected for fully valid draft");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 2 — Passage with zero questions → removed
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Passage with zero questions is removed with warning")
    void passageWithZeroQuestions_removed() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_ZERO_QUESTIONS);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size(),
                "One passage with valid content/questions should be retained");
        assertEquals("有効な文章です。", resp.getReadingDraft().getPassages().get(0).getContent());
        assertEquals(1, resp.getReadingDraft().getPassages().get(0).getQuestions().size());
        assertNotNull(resp.getWarning());
        assertTrue(resp.getWarning().contains("1 incomplete passage"),
                "Warning must mention 1 filtered passage");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 3 — All questions in a passage are invalid → passage removed
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Passage whose questions are all invalid is removed")
    void passageAllQuestionsInvalid_removed() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_ALL_INVALID_Q);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size(),
                "One passage with valid content/questions should be retained");
        assertEquals("有効な文章です。", resp.getReadingDraft().getPassages().get(0).getContent());
        assertEquals(1, resp.getReadingDraft().getPassages().get(0).getQuestions().size());
        assertNotNull(resp.getWarning());
        assertTrue(resp.getWarning().contains("1 incomplete passage"),
                "Warning must mention 1 filtered passage");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 4 — Mixed valid and invalid passages → only valid kept + warning
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Mixed valid and invalid passages returns only valid with warning")
    void mixedPassages_returnsOnlyValidWithWarning() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_MIXED);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size(),
                "Only the passage with valid content should be retained");
        assertEquals("これは有効な文章です。",
                resp.getReadingDraft().getPassages().get(0).getContent());
        assertEquals(1, resp.getReadingDraft().getPassages().get(0).getQuestions().size());
        assertNotNull(resp.getWarning());
        assertTrue(resp.getWarning().contains("1 incomplete passage(s)"),
                "Warning must mention filtered passage count");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 5 — All passages invalid → clear exception
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("All passages invalid throws clear AiProcessingException")
    void allPassagesInvalid_throwsAiProcessingException() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_ALL_INVALID);

        AiProcessingException ex = assertThrows(AiProcessingException.class,
                () -> service.generateContent(readingRequest()));

        assertTrue(ex.getMessage().contains("all were filtered out"),
                "Error must explain all passages were filtered");
        assertTrue(ex.getMessage().contains("2 reading passage(s)"),
                "Error must report original passage count");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 6 — Question with fewer than 4 options → rejected
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Question with fewer than 4 options is rejected")
    void questionFewerThan4Options_rejected() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_3_OPTIONS);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size(),
                "One passage with valid content/questions should be retained");
        assertNotNull(resp.getWarning());
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 7 — Question with more than 4 options → rejected
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Question with more than 4 options is rejected")
    void questionMoreThan4Options_rejected() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_6_OPTIONS);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size(),
                "One passage with valid content/questions should be retained");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 8 — Question with zero correct options → rejected
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Question with zero correct options is rejected")
    void questionZeroCorrectOptions_rejected() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_ZERO_CORRECT);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size(),
                "One passage with valid content/questions should be retained");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 9 — Question with multiple correct options → rejected
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Question with multiple correct options is rejected")
    void questionMultipleCorrectOptions_rejected() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_MULTI_CORRECT);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getReadingDraft());
        assertEquals(1, resp.getReadingDraft().getPassages().size(),
                "One passage with valid content/questions should be retained");
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 10 — Vocabulary behavior unchanged
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Vocabulary generation is not affected by Reading validation changes")
    void vocabularyGeneration_unaffected() throws Exception {
        String vocabJson = objectMapper.writeValueAsString(
                java.util.Map.of("title", "Test Vocab", "items",
                        java.util.List.of(java.util.Map.of(
                                "japanese", "学校", "furigana", "がっこう", "meaning", "Trường học"))));
        AiCoreService.AiResponse resp = new AiCoreService.AiResponse(
                vocabJson, "gemini", "gemini-2.0-flash", "STOP", 100, 200, 300);
        when(aiCoreService.chatWithDetails(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(resp);

        AdminAiContentGenerateRequest vocabReq = AdminAiContentGenerateRequest.builder()
                .skillType("VOCABULARY").level("N5").lessonNumber(1)
                .lessonTitle("Test Vocab").topic("School").itemCount(1).build();

        AdminAiContentGenerateResponse result = service.generateContent(vocabReq);

        assertNotNull(result.getVocabularyDraft());
        assertEquals(1, result.getVocabularyDraft().getItems().size());
        assertEquals("学校", result.getVocabularyDraft().getItems().get(0).getJapanese());
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 11 — Grammar behavior unchanged
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Grammar generation is not affected by Reading validation changes")
    void grammarGeneration_unaffected() throws Exception {
        String grammarJson = objectMapper.writeValueAsString(
                java.util.Map.of("title", "Test Grammar", "items",
                        java.util.List.of(java.util.Map.of(
                                "grammarPoint", "〜てください",
                                "meaningVietnamese", "Làm ơn làm gì đó"))));
        AiCoreService.AiResponse resp = new AiCoreService.AiResponse(
                grammarJson, "gemini", "gemini-2.0-flash", "STOP", 100, 200, 300);
        // Stub chat() directly (generateGrammarContent calls chat(), not chatWithDetails)
        lenient().when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(grammarJson);
        lenient().when(aiCoreService.chatWithDetails(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(resp);

        AdminAiContentGenerateRequest grammarReq = AdminAiContentGenerateRequest.builder()
                .skillType("GRAMMAR").level("N5").lessonNumber(1)
                .lessonTitle("Test Grammar").topic("Te-form").itemCount(1).build();

        AdminAiContentGenerateResponse result = service.generateContent(grammarReq);

        assertNotNull(result.getGrammarDraft());
        assertEquals(1, result.getGrammarDraft().getItems().size());
        assertEquals("〜てください", result.getGrammarDraft().getItems().get(0).getGrammarPoint());
    }

    // ══════════════════════════════════════════════════════════════
    // TEST 12 — Partial draft warning includes passage and question counts
    // ══════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Partial draft warning includes passage and question counts")
    void partialDraft_warningIncludesCounts() {
        when(aiCoreService.chat(anyString(), anyString(), isNull(),
                eq(AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION)))
                .thenReturn(FIXTURE_PARTIAL);

        AdminAiContentGenerateResponse resp = service.generateContent(readingRequest());

        assertNotNull(resp.getWarning());
        assertTrue(resp.getWarning().contains("1 incomplete passage(s)"),
                "Warning must mention filtered passage count");
        assertTrue(resp.getWarning().contains("1 passage(s) and 1 question(s) retained"),
                "Warning must mention retained counts");
    }
}
