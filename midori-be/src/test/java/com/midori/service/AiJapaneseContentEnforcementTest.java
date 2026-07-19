package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.dto.ai.GeneratedQuestionDto;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.repository.AiConversationRepository;
import com.midori.repository.AiMessageRepository;
import com.midori.service.impl.AiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Verifies that MIDORI's quiz-generation flow enforces Japanese-first
 * output content. The platform is Japanese learning — questions, options,
 * and correct answers must be Japanese. Vietnamese is permitted only in
 * the explanation field (and in the canonical TRUE_FALSE labels).
 *
 * <p>The tests cover:
 * <ul>
 *   <li>the heuristic Vietnamese detector ({@code isMostlyVietnamese});</li>
 *   <li>the per-question violation reporter
 *       ({@code japanesePolicyViolations});</li>
 *   <li>the full {@code generateQuestions} flow: a Vietnamese-laden AI
 *       response triggers a regeneration call; persistent Vietnamese
 *       questions are dropped before reaching the renderer.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiJapaneseContentEnforcementTest {

    @Mock AiConversationRepository conversationRepository;
    @Mock AiMessageRepository messageRepository;
    @Mock AiCoreService aiCoreService;
    @Mock AiRateLimitService rateLimitService;
    @Mock AiMaterialService aiMaterialService;

    private AiServiceImpl impl;

    @BeforeEach
    void setUp() {
        impl = new AiServiceImpl(
                conversationRepository, messageRepository, aiCoreService,
                rateLimitService, aiMaterialService, new ObjectMapper(), false);
    }

    private static Method isMostlyVietnameseMethod() throws NoSuchMethodException {
        Method m = AiServiceImpl.class.getDeclaredMethod("isMostlyVietnamese", String.class);
        m.setAccessible(true);
        return m;
    }

    private static Method japanesePolicyViolationsMethod() throws NoSuchMethodException {
        Method m = AiServiceImpl.class.getDeclaredMethod("japanesePolicyViolations", GeneratedQuestionDto.class);
        m.setAccessible(true);
        return m;
    }

    @SuppressWarnings("unchecked")
    private static <T> T invokeStatic(Method m, Object... args) throws Exception {
        return (T) m.invoke(null, args);
    }

    @SuppressWarnings("unchecked")
    private static boolean isMostlyVietnameseStatic(Method m, String text) throws Exception {
        Boolean result = (Boolean) m.invoke(null, text);
        return Boolean.TRUE.equals(result);
    }

    @SuppressWarnings("unchecked")
    private static List<String> violationsStatic(Method m, GeneratedQuestionDto q) throws Exception {
        return (List<String>) m.invoke(null, q);
    }

    @Nested
    @DisplayName("Heuristic Vietnamese detector")
    class VietnameseDetector {

        @Test
        @DisplayName("Japanese text is NOT flagged as Vietnamese")
        void japaneseNotFlagged() throws Exception {
            Method m = isMostlyVietnameseMethod();
            assertFalse(isMostlyVietnameseStatic(m, "次のうち、正しい文はどれですか。"));
            assertFalse(isMostlyVietnameseStatic(m, "わたしはリンです。"));
            assertFalse(isMostlyVietnameseStatic(m, "「学生」の読み方は?"));
            assertFalse(isMostlyVietnameseStatic(m, "日本語を勉強します。"));
            assertFalse(isMostlyVietnameseStatic(m, "たなかさんはがっこうへいきます。"));
        }

        @Test
        @DisplayName("Pure Vietnamese text IS flagged via diacritics")
        void vietnameseDiacriticFlagged() throws Exception {
            Method m = isMostlyVietnameseMethod();
            assertTrue(isMostlyVietnameseStatic(m, "Câu nào đúng khi giới thiệu quốc tịch?"));
            assertTrue(isMostlyVietnameseStatic(m, "Tôi là người Việt Nam."));
            assertTrue(isMostlyVietnameseStatic(m, "Đáp án đúng là gì?"));
            assertTrue(isMostlyVietnameseStatic(m, "Bạn học tiếng Nhật ở đâu?"));
        }

        @Test
        @DisplayName("Diacritics-free Vietnamese with stopwords IS flagged")
        void vietnameseStopwordsFlagged() throws Exception {
            Method m = isMostlyVietnameseMethod();
            assertTrue(isMostlyVietnameseStatic(m, "cau nao dung cho nguoi moi bat dau"));
            assertTrue(isMostlyVietnameseStatic(m, "toi la nguoi viet nam"));
            assertTrue(isMostlyVietnameseStatic(m, "ban hoc tieng nhat o dau"));
        }

        @Test
        @DisplayName("Japanese with single stray particle is NOT flagged (Japanese script wins)")
        void japaneseWithParticleNotFlagged() throws Exception {
            Method m = isMostlyVietnameseMethod();
            assertFalse(isMostlyVietnameseStatic(m, "これは なん です か。"));
            assertFalse(isMostlyVietnameseStatic(m, "学生です。"));
        }

        @Test
        @DisplayName("Empty / null input is NOT flagged")
        void emptyNotFlagged() throws Exception {
            Method m = isMostlyVietnameseMethod();
            assertFalse(isMostlyVietnameseStatic(m, null));
            assertFalse(isMostlyVietnameseStatic(m, ""));
            assertFalse(isMostlyVietnameseStatic(m, "   "));
        }

        @Test
        @DisplayName("Mixed Japanese + few Vietnamese particles is NOT flagged")
        void mixedJapaneseNotFlagged() throws Exception {
            Method m = isMostlyVietnameseMethod();
            assertFalse(isMostlyVietnameseStatic(m, "「学生」の 読み方 は 何 です か。"));
            assertFalse(isMostlyVietnameseStatic(m, "これは日本語の文です。"));
        }
    }

    @Nested
    @DisplayName("Per-question Japanese policy violation reporter")
    class PolicyViolations {

        @Test
        @DisplayName("Japanese MC question has NO violations")
        void japaneseMcClean() throws Exception {
            Method m = japanesePolicyViolationsMethod();
            GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                    .id("q0").type("MULTIPLE_CHOICE")
                    .questionText("次のうち、正しい文はどれですか。")
                    .options(List.of("わたしはリンです。", "わたしは学生があります。", "わたしは日本です。", "わたしは食べます。"))
                    .correctAnswer("わたしはリンです。")
                    .explanation("「わたしは～です」は自己紹介で使う基本文型です。")
                    .build();
            List<String> violations = violationsStatic(m, q);
            assertTrue(violations.isEmpty(),
                    "Expected no violations but got: " + violations);
        }

        @Test
        @DisplayName("Vietnamese MC question flags question + options + correctAnswer")
        void vietnameseMcFlags() throws Exception {
            Method m = japanesePolicyViolationsMethod();
            GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                    .id("q0").type("MULTIPLE_CHOICE")
                    .questionText("Câu nào đúng khi giới thiệu quốc tịch?")
                    .options(List.of("Tôi là người Việt Nam.", "Tôi là người Nhật.", "Tôi là người Mỹ.", "Tôi là người Anh."))
                    .correctAnswer("Tôi là người Việt Nam.")
                    .explanation("Bản dịch tiếng Việt của 文型 は～です です.")
                    .build();
            List<String> violations = violationsStatic(m, q);
            assertTrue(violations.contains("question"));
            assertTrue(violations.contains("options"));
            assertTrue(violations.contains("correctAnswer"));
        }

        @Test
        @DisplayName("TRUE_FALSE canonical Vietnamese labels are EXEMPT")
        void trueFalseVietnameseExempt() throws Exception {
            Method m = japanesePolicyViolationsMethod();
            GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                    .id("q0").type("TRUE_FALSE")
                    .questionText("「学生」は student です。")
                    .options(List.of("Đúng", "Sai"))
                    .correctAnswer("Đúng")
                    .explanation("「学生」= student.")
                    .build();
            List<String> violations = violationsStatic(m, q);
            assertTrue(violations.isEmpty(),
                    "TRUE_FALSE canonical ['Đúng','Sai'] must NOT be flagged. Got: " + violations);
        }

        @Test
        @DisplayName("TRUE_FALSE with non-canonical Vietnamese options IS flagged")
        void trueFalseNonCanonicalFlagged() throws Exception {
            Method m = japanesePolicyViolationsMethod();
            GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                    .id("q0").type("TRUE_FALSE")
                    .questionText("Câu này đúng hay sai?")
                    .options(List.of("Đúng", "Sai"))
                    .correctAnswer("Đúng")
                    .explanation("...")
                    .build();
            List<String> violations = violationsStatic(m, q);
            assertTrue(violations.contains("question"),
                    "Non-Japanese question must be flagged even on TRUE_FALSE");
        }

        @Test
        @DisplayName("FILL_BLANK with all-Vietnamese question IS flagged")
        void fillBlankVietnameseFlagged() throws Exception {
            Method m = japanesePolicyViolationsMethod();
            // All-Vietnamese question, no Japanese script — must be flagged.
            GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                    .id("q0").type("FILL_BLANK")
                    .questionText("Điền nghĩa của từ tiếng Nhật vào chỗ trống.")
                    .options(List.of())
                    .correctAnswer("学生")
                    .explanation("「学生」= student.")
                    .build();
            List<String> violations = violationsStatic(m, q);
            assertTrue(violations.contains("question"),
                    "All-Vietnamese FILL_BLANK question must be flagged. Got: " + violations);
            assertFalse(violations.contains("correctAnswer"),
                    "correctAnswer is Japanese and must NOT be flagged");
        }

        @Test
        @DisplayName("Explanation field Vietnamese is ALWAYS allowed")
        void explanationVietnameseAllowed() throws Exception {
            Method m = japanesePolicyViolationsMethod();
            GeneratedQuestionDto q = GeneratedQuestionDto.builder()
                    .id("q0").type("MULTIPLE_CHOICE")
                    .questionText("次のうち、正しい文はどれですか。")
                    .options(List.of("わたしはリンです。", "わたしは学生があります。", "わたしは日本です。", "わたしは食べます。"))
                    .correctAnswer("わたしはリンです。")
                    .explanation("Đây là giải thích bằng tiếng Việt cho người học.")
                    .build();
            List<String> violations = violationsStatic(m, q);
            assertTrue(violations.isEmpty(),
                    "Vietnamese explanation must be allowed. Got: " + violations);
        }
    }

    @Nested
    @DisplayName("End-to-end generateQuestions with Vietnamese content enforcement")
    class EndToEndVietnameseEnforcement {

        @Test
        @DisplayName("Vietnamese-laden payload is regenerated; bad questions dropped on regen failure")
        void vietnamesePayloadRegenerated() {
            // First call: ALL questions are Vietnamese (bad). The service
            // should detect this and call the AI again to regenerate.
            String firstCallJson = "{" +
                    "\"questions\":[" +
                    "{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\"," +
                    "\"question\":\"Câu nào đúng khi giới thiệu quốc tịch?\"," +
                    "\"options\":[\"Tôi là người Việt Nam.\",\"Tôi là người Nhật.\",\"Tôi là người Mỹ.\",\"Tôi là người Anh.\"]," +
                    "\"correctAnswer\":\"Tôi là người Việt Nam.\"," +
                    "\"explanation\":\"Tự giới thiệu quốc tịch bằng mẫu câu は～です\"}," +
                    "{\"id\":\"q1\",\"type\":\"MULTIPLE_CHOICE\"," +
                    "\"question\":\"次のうち、正しい文はどれですか。\"," +
                    "\"options\":[\"わたしはリンです。\",\"わたしは学生があります。\",\"わたしは日本です。\",\"わたしは食べます。\"]," +
                    "\"correctAnswer\":\"わたしはリンです。\"," +
                    "\"explanation\":\"「わたしは～です」は自己紹介で使う基本文型です。\"}" +
                    "]}";

            // Second call (regen): only q0 is regenerated, properly in
            // Japanese. q1 was already good so the regeneration prompt
            // includes it verbatim (the LLM should keep ids stable).
            String regenJson = "{" +
                    "\"questions\":[" +
                    "{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\"," +
                    "\"question\":\"次のうち、自己紹介として正しい文はどれですか。\"," +
                    "\"options\":[\"わたしはリンです。\",\"わたしは学生です。\",\"わたしは日本です。\",\"わたしは食べます。\"]," +
                    "\"correctAnswer\":\"わたしはリンです。\"," +
                    "\"explanation\":\"「わたしは～です」は自己紹介で使う基本文型です。\"}" +
                    "]}";

            AtomicInteger callCount = new AtomicInteger(0);
            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenAnswer(inv -> {
                        int n = callCount.incrementAndGet();
                        return n == 1 ? firstCallJson : regenJson;
                    });

            GenerateQuestionsResponse response = impl.generateQuestions(
                    UUID.randomUUID(), "Tiếng Nhật N5", "N5", 2, "MULTIPLE_CHOICE",
                    null, null, null, null);

            assertNotNull(response);
            // First attempt had 2 questions. After regen, q0 is replaced
            // with a clean version; q1 was never bad so it is kept as-is.
            assertEquals(2, response.getQuestions().size(),
                    "Expected 2 questions after regeneration. Got: " + response.getQuestions().size());

            for (GeneratedQuestionDto q : response.getQuestions()) {
                // No question should be Vietnamese now.
                List<String> v;
                try {
                    Method m = japanesePolicyViolationsMethod();
                    v = violationsStatic(m, q);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
                assertTrue(v.isEmpty(),
                        "Question id=" + q.getId() + " still has violations: " + v +
                                " | question=" + q.getQuestionText() +
                                " | options=" + q.getOptions());
            }
        }

        @Test
        @DisplayName("Persistent Vietnamese after regen drops the bad question")
        void persistentVietnameseDropped() {
            // First call: ALL Vietnamese.
            String allVietnamese = "{" +
                    "\"questions\":[" +
                    "{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\"," +
                    "\"question\":\"Câu nào đúng?\"," +
                    "\"options\":[\"Đáp án A\",\"Đáp án B\",\"Đáp án C\",\"Đáp án D\"]," +
                    "\"correctAnswer\":\"Đáp án A\"," +
                    "\"explanation\":\"Giải thích\"}," +
                    "{\"id\":\"q1\",\"type\":\"MULTIPLE_CHOICE\"," +
                    "\"question\":\"次のうち、正しい文はどれですか。\"," +
                    "\"options\":[\"わたしはリンです。\",\"わたしは学生があります。\",\"わたしは日本です。\",\"わたしは食べます。\"]," +
                    "\"correctAnswer\":\"わたしはリンです。\"," +
                    "\"explanation\":\"「わたしは～です」\"}" +
                    "]}";

            // Regen also returns Vietnamese (worst case).
            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenReturn(allVietnamese);

            GenerateQuestionsResponse response = impl.generateQuestions(
                    UUID.randomUUID(), "N5", "N5", 2, "MULTIPLE_CHOICE",
                    null, null, null, null);

            // q0 is dropped because it cannot be regenerated. q1 was
            // never bad so it survives unchanged.
            assertNotNull(response);
            assertEquals(1, response.getQuestions().size(),
                    "Persistent-Vietnamese q0 must be dropped; q1 must survive. Got: "
                            + response.getQuestions().size() + " question(s)");
            GeneratedQuestionDto surviving = response.getQuestions().get(0);
            assertEquals("q1", surviving.getId());
            assertTrue(surviving.getQuestionText().startsWith("次"),
                    "q1 should be the Japanese question, got: " + surviving.getQuestionText());
        }

        @Test
        @DisplayName("Clean payload is NOT regenerated (no extra AI call)")
        void cleanPayloadNoRegen() {
            String cleanJson = "{" +
                    "\"questions\":[" +
                    "{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\"," +
                    "\"question\":\"次のうち、正しい文はどれですか。\"," +
                    "\"options\":[\"わたしはリンです。\",\"わたしは学生があります。\",\"わたしは日本です。\",\"わたしは食べます。\"]," +
                    "\"correctAnswer\":\"わたしはリンです。\"," +
                    "\"explanation\":\"「わたしは～です」\"}" +
                    "]}";

            AtomicInteger callCount = new AtomicInteger(0);
            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenAnswer(inv -> {
                        callCount.incrementAndGet();
                        return cleanJson;
                    });

            GenerateQuestionsResponse response = impl.generateQuestions(
                    UUID.randomUUID(), "N5", "N5", 1, "MULTIPLE_CHOICE",
                    null, null, null, null);

            assertEquals(1, callCount.get(),
                    "Clean payload should NOT trigger a regeneration call");
            assertEquals(1, response.getQuestions().size());
            assertEquals("次のうち、正しい文はどれですか。", response.getQuestions().get(0).getQuestionText());
        }

        @Test
        @DisplayName("TRUE_FALSE canonical Vietnamese options are accepted as-is")
        void trueFalseAccepted() {
            String trueFalseJson = "{" +
                    "\"questions\":[" +
                    "{\"id\":\"q0\",\"type\":\"TRUE_FALSE\"," +
                    "\"question\":\"「学生」は student です。\"," +
                    "\"options\":[\"Đúng\",\"Sai\"]," +
                    "\"correctAnswer\":\"Đúng\"," +
                    "\"explanation\":\"「学生」= học sinh / student.\"}," +
                    "{\"id\":\"q1\",\"type\":\"TRUE_FALSE\"," +
                    "\"question\":\"「先生」は teacher です。\"," +
                    "\"options\":[\"Đúng\",\"Sai\"]," +
                    "\"correctAnswer\":\"Đúng\"," +
                    "\"explanation\":\"「先生」= giáo viên / teacher.\"}" +
                    "]}";

            AtomicInteger callCount = new AtomicInteger(0);
            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenAnswer(inv -> {
                        callCount.incrementAndGet();
                        return trueFalseJson;
                    });

            GenerateQuestionsResponse response = impl.generateQuestions(
                    UUID.randomUUID(), "N5", "N5", 2, "TRUE_FALSE",
                    null, null, null, null);

            assertEquals(1, callCount.get(),
                    "TRUE_FALSE canonical payload should NOT trigger regeneration");
            assertEquals(2, response.getQuestions().size());
        }
    }
}