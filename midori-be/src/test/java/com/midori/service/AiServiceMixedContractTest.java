package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.dto.ai.GeneratedQuestionDto;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.dto.ai.QuizQuestionResponse;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Tests for the MIXED-mode question parsing contract in
 * {@link AiServiceImpl}.
 *
 * <p>The bug under test: when an AI provider returns a MIXED-mode quiz
 * where one of the individual questions is actually a fill-in-the-blank
 * but is labelled {@code MULTIPLE_CHOICE} (or has its {@code type}
 * field empty), the previous parser silently coerced the type to
 * {@code MULTIPLE_CHOICE}, leaving the question with no options. The
 * frontend then had nothing to render.
 *
 * <p>The fix uses the whole question object — type, text, options,
 * correctAnswer — to assign a canonical per-question type. The
 * structural rules under test:
 *
 * <ul>
 *   <li>MULTIPLE_CHOICE needs at least 2 non-empty options and a
 *       correctAnswer that matches one of them;</li>
 *   <li>FILL_BLANK is preserved verbatim;</li>
 *   <li>TRUE_FALSE requires the canonical [Đúng, Sai] pair;</li>
 *   <li>an unknown / missing type is inferred from the question body
 *       (blank marker, fill instruction, option shape), and is
 *       rejected only when the question is truly unrecoverable.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiServiceMixedContractTest {

    @Mock AiConversationRepository conversationRepository;
    @Mock AiMessageRepository messageRepository;
    @Mock AiCoreService aiCoreService;
    @Mock AiRateLimitService rateLimitService;
    @Mock AiMaterialService aiMaterialService;

    private AiServiceImpl impl;
    private Method parseMethod;

    @BeforeEach
    void setUp() throws Exception {
        impl = new AiServiceImpl(
                conversationRepository, messageRepository, aiCoreService,
                rateLimitService, aiMaterialService, new ObjectMapper(), false);
        parseMethod = AiServiceImpl.class.getDeclaredMethod(
                "parseQuestionsFromJson", String.class, String.class);
        parseMethod.setAccessible(true);
    }

    @SuppressWarnings("unchecked")
    private List<GeneratedQuestionDto> parse(String json) throws Exception {
        return (List<GeneratedQuestionDto>) parseMethod.invoke(impl, json, "N5");
    }

    private static GeneratedQuestionDto findById(List<GeneratedQuestionDto> list, String id) {
        return list.stream().filter(q -> id.equals(q.getId())).findFirst().orElse(null);
    }

    @Nested
    @DisplayName("Standalone FILL_BLANK behavior preserved")
    class StandaloneFillBlank {

        @Test
        @DisplayName("pure fill-blank JSON returns FILL_BLANK with empty options")
        void pureFillBlankJson() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"FILL_BLANK\","
                    + "\"question\":\"Điền nghĩa của 「食べる」\","
                    + "\"options\":[],\"correctAnswer\":\"ăn\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            GeneratedQuestionDto q = parsed.get(0);
            assertEquals("FILL_BLANK", q.getType());
            assertTrue(q.getOptions() == null || q.getOptions().isEmpty());
            assertEquals("ăn", q.getCorrectAnswer());
        }

        @Test
        @DisplayName("fill-blank with marker remains FILL_BLANK")
        void fillBlankWithMarker() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"FILL_BLANK\","
                    + "\"question\":\"Yesterday I ___ to the store.\","
                    + "\"options\":[],\"correctAnswer\":\"went\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("FILL_BLANK", parsed.get(0).getType());
        }
    }

    @Nested
    @DisplayName("Mixed mode: structural normalization")
    class MixedStructuralNormalization {

        @Test
        @DisplayName("MULTIPLE_CHOICE label with options[] and ____ marker becomes FILL_BLANK")
        void mcWithBlankMarkerPromoted() throws Exception {
            // This is the exact malformed question the user reported:
            //   わたしの ____ は リンです。
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\","
                    + "\"question\":\"わたしの ____ は リンです。\","
                    + "\"options\":[],\"correctAnswer\":\"名前\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("FILL_BLANK", parsed.get(0).getType(),
                    "MC + blank marker + no options must be promoted to FILL_BLANK");
            assertTrue(parsed.get(0).getOptions().isEmpty());
            assertEquals("名前", parsed.get(0).getCorrectAnswer());
        }

        @Test
        @DisplayName("MULTIPLE_CHOICE label with null/blank options and Vietnamese fill instruction becomes FILL_BLANK")
        void mcWithFillInstruction() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\","
                    + "\"question\":\"Điền từ thích hợp: 私は ___ です。\","
                    + "\"options\":[],\"correctAnswer\":\"学生\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("FILL_BLANK", parsed.get(0).getType());
        }

        @Test
        @DisplayName("MULTIPLE_CHOICE label with valid options and matching correctAnswer stays MULTIPLE_CHOICE")
        void mcWithValidOptionsKept() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\","
                    + "\"question\":\"「学校」の読み方は?\","
                    + "\"options\":[\"がっこう\",\"がくこう\",\"まなび\",\"けんきゅう\"],"
                    + "\"correctAnswer\":\"がっこう\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("MULTIPLE_CHOICE", parsed.get(0).getType());
            assertEquals(4, parsed.get(0).getOptions().size());
        }

        @Test
        @DisplayName("MULTIPLE_CHOICE label with options[] and NO blank marker is dropped")
        void mcNoOptionsNoMarkerDropped() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\","
                    + "\"question\":\"Pick the correct answer.\","
                    + "\"options\":[],\"correctAnswer\":\"x\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertTrue(parsed.isEmpty(),
                    "MC with no options and no marker is unrecoverable and must be dropped");
        }

        @Test
        @DisplayName("Empty type field with ____ marker becomes FILL_BLANK")
        void emptyTypeWithMarker() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"\","
                    + "\"question\":\"日本語を勉強____。\","
                    + "\"options\":[],\"correctAnswer\":\"する\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("FILL_BLANK", parsed.get(0).getType());
        }

        @Test
        @DisplayName("Missing type field with [BLANK] marker becomes FILL_BLANK")
        void missingTypeWithBlank() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\","
                    + "\"question\":\"Translate [BLANK] to English.\","
                    + "\"options\":[],\"correctAnswer\":\"hello\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("FILL_BLANK", parsed.get(0).getType());
        }

        @Test
        @DisplayName("Missing type field with 4 options and matching answer becomes MULTIPLE_CHOICE")
        void missingTypeWithFourOptions() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\","
                    + "\"question\":\"What does 食べる mean?\","
                    + "\"options\":[\"ăn\",\"uống\",\"ngủ\",\"đi\"],"
                    + "\"correctAnswer\":\"ăn\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("MULTIPLE_CHOICE", parsed.get(0).getType());
        }

        @Test
        @DisplayName("Missing type field with Đúng/Sai pair becomes TRUE_FALSE")
        void missingTypeWithTrueFalsePair() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\","
                    + "\"question\":\"「ありがとう」means thank you.\","
                    + "\"options\":[\"Đúng\",\"Sai\"],"
                    + "\"correctAnswer\":\"Đúng\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            assertEquals("TRUE_FALSE", parsed.get(0).getType());
            assertEquals(List.of("Đúng", "Sai"), parsed.get(0).getOptions());
        }

        @Test
        @DisplayName("Unknown alias type with ____ marker becomes FILL_BLANK")
        void unknownAliasWithMarker() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"CLOZE\","
                    + "\"question\":\"Yesterday ___ happened.\","
                    + "\"options\":[],\"correctAnswer\":\"something\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertEquals(1, parsed.size());
            // The parser's contract is "canonical FILL_BLANK only". The
            // frontend's TYPE_ALIASES table maps CLOZE -> FILL_BLANK, but
            // the parser keeps the canonical form here. Either canonical
            // FILL_BLANK or the alias is acceptable as long as it is
            // treated as a fill-blank on the frontend side.
            assertTrue("FILL_BLANK".equals(parsed.get(0).getType())
                            || "CLOZE".equalsIgnoreCase(parsed.get(0).getType()),
                    "Expected FILL_BLANK or CLOZE but got: " + parsed.get(0).getType());
        }

        @Test
        @DisplayName("Unknown alias with no marker and no options is dropped")
        void unknownAliasNoMarkerDropped() throws Exception {
            String json = "{\"questions\":[{\"id\":\"q0\",\"type\":\"MATCHING\","
                    + "\"question\":\"Match the pair.\",\"options\":[],\"correctAnswer\":\"\"}]}";
            List<GeneratedQuestionDto> parsed = parse(json);
            assertTrue(parsed.isEmpty(),
                    "Unknown alias without recoverable structure must be dropped, not silently coerced to MULTIPLE_CHOICE");
        }
    }

    @Nested
    @DisplayName("Mixed mode: whole mixed payload with multiple malformed entries")
    class MixedMixedPayload {

        @Test
        @DisplayName("full MIXED payload normalizes each question independently")
        void fullMixedPayloadNormalizesIndependently() throws Exception {
            String json = "{\n" +
                    "  \"questions\": [\n" +
                    "    {\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\",\n" +
                    "     \"question\":\"わたしの ____ は リンです。\",\n" +
                    "     \"options\":[],\n" +
                    "     \"correctAnswer\":\"名前\"},\n" +
                    "    {\"id\":\"q1\",\"type\":\"MULTIPLE_CHOICE\",\n" +
                    "     \"question\":\"「学校」の読み方は?\",\n" +
                    "     \"options\":[\"がっこう\",\"がくこう\",\"まなび\",\"けんきゅう\"],\n" +
                    "     \"correctAnswer\":\"がっこう\"},\n" +
                    "    {\"id\":\"q2\",\"type\":\"\",\n" +
                    "     \"question\":\"日本語を勉強____。\",\n" +
                    "     \"options\":[],\n" +
                    "     \"correctAnswer\":\"する\"},\n" +
                    "    {\"id\":\"q3\",\"type\":\"MULTIPLE_CHOICE\",\n" +
                    "     \"question\":\"What does 水 mean?\",\n" +
                    "     \"options\":[],\n" +
                    "     \"correctAnswer\":\"water\"},\n" +
                    "    {\"id\":\"q4\",\"type\":\"FILL_BLANK\",\n" +
                    "     \"question\":\"Điền nghĩa của 「走る」\",\n" +
                    "     \"options\":[],\n" +
                    "     \"correctAnswer\":\"chạy\"},\n" +
                    "    {\"id\":\"q5\",\"type\":\"TRUE_FALSE\",\n" +
                    "     \"question\":\"「水」means water.\",\n" +
                    "     \"options\":[\"Đúng\",\"Sai\"],\n" +
                    "     \"correctAnswer\":\"Đúng\"}\n" +
                    "  ]\n" +
                    "}";

            List<GeneratedQuestionDto> parsed = parse(json);

            // q0 promoted to FILL_BLANK (marker + no options)
            GeneratedQuestionDto q0 = findById(parsed, "q0");
            assertNotNull(q0);
            assertEquals("FILL_BLANK", q0.getType());
            assertEquals("名前", q0.getCorrectAnswer());

            // q1 stays MULTIPLE_CHOICE (4 options, answer matches)
            GeneratedQuestionDto q1 = findById(parsed, "q1");
            assertNotNull(q1);
            assertEquals("MULTIPLE_CHOICE", q1.getType());

            // q2 promoted to FILL_BLANK (empty type + marker)
            GeneratedQuestionDto q2 = findById(parsed, "q2");
            assertNotNull(q2);
            assertEquals("FILL_BLANK", q2.getType());

            // q3 dropped (MC + no options + no marker)
            assertNull(findById(parsed, "q3"),
                    "MC with no options and no marker must be dropped, not silently coerced");

            // q4 preserved FILL_BLANK
            GeneratedQuestionDto q4 = findById(parsed, "q4");
            assertNotNull(q4);
            assertEquals("FILL_BLANK", q4.getType());

            // q5 preserved TRUE_FALSE
            GeneratedQuestionDto q5 = findById(parsed, "q5");
            assertNotNull(q5);
            assertEquals("TRUE_FALSE", q5.getType());

            // No MULTIPLE_CHOICE question in the final set has zero options.
            for (GeneratedQuestionDto q : parsed) {
                if ("MULTIPLE_CHOICE".equals(q.getType())) {
                    assertNotNull(q.getOptions());
                    assertTrue(q.getOptions().size() >= 2,
                            "Every MULTIPLE_CHOICE question must have at least 2 options");
                }
            }
        }
    }

    @Nested
    @DisplayName("End-to-end generateQuestions call returns normalised MIXED payload")
    class EndToEndMixed {

        @Test
        @DisplayName("MIXED request with mixed real-world payload returns normalised questions")
        void mixedEndToEnd() throws Exception {
            // Simulate a real AI response: AI emits a MC label for a question
            // whose body is clearly a fill-blank and provides no options.
            String aiJson = "{\n" +
                    "  \"questions\": [\n" +
                    "    {\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\",\n" +
                    "     \"question\":\"わたしの ____ は リンです。\",\n" +
                    "     \"options\":[],\n" +
                    "     \"correctAnswer\":\"名前\"},\n" +
                    "    {\"id\":\"q1\",\"type\":\"MULTIPLE_CHOICE\",\n" +
                    "     \"question\":\"「学校」の読み方は?\",\n" +
                    "     \"options\":[\"がっこう\",\"がくこう\",\"まなび\",\"けんきゅう\"],\n" +
                    "     \"correctAnswer\":\"がっこう\"}\n" +
                    "  ]\n" +
                    "}";

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenReturn(aiJson);

            var response = impl.generateQuestions(
                    UUID.randomUUID(), "Tiếng Nhật N5", "N5", 2, "MIXED",
                    null, null, null, null);

            assertNotNull(response);
            List<GeneratedQuestionDto> rawQuestions = response.getQuestions();
            assertEquals(2, rawQuestions.size());

            // The parser must already have normalised the labels.
            GeneratedQuestionDto q0 = findById(rawQuestions, "q0");
            assertEquals("FILL_BLANK", q0.getType());
            GeneratedQuestionDto q1 = findById(rawQuestions, "q1");
            assertEquals("MULTIPLE_CHOICE", q1.getType());

            // The frontend-shape mapper must also produce a renderable
            // question for both entries.
            List<QuizQuestionResponse> frontendQuestions = response.getQuestionsForFrontend();
            assertEquals(2, frontendQuestions.size());
            for (QuizQuestionResponse fq : frontendQuestions) {
                if ("MULTIPLE_CHOICE".equals(fq.getType())) {
                    assertNotNull(fq.getOptions());
                    assertTrue(fq.getOptions().size() >= 2);
                }
                if ("FILL_BLANK".equals(fq.getType())) {
                    assertTrue(fq.getOptions() == null || fq.getOptions().isEmpty());
                }
            }
        }

        @Test
        @DisplayName("MIXED request with all-malformed payload returns no questions and triggers strict error")
        void allMalformedReturnsError() {
            // No options anywhere, no markers. Nothing usable.
            String aiJson = "{\"questions\":[" +
                    "{\"id\":\"q0\",\"type\":\"MULTIPLE_CHOICE\",\"question\":\"x\",\"options\":[],\"correctAnswer\":\"y\"}," +
                    "{\"id\":\"q1\",\"type\":\"MIXED\",\"question\":\"z\",\"options\":[],\"correctAnswer\":\"\"}" +
                    "]}";

            when(aiCoreService.generateQuestions(anyString(), any(), anyInt(), anyString(), anyString()))
                    .thenReturn(aiJson);

            var response = impl.generateQuestions(
                    UUID.randomUUID(), "topic", "N5", 2, "MIXED",
                    null, null, null, null);

            // Strict mode (fallbackEnabled=false) must surface this as an
            // error rather than ship garbage questions.
            assertNotNull(response);
            assertTrue(response.getQuestions().isEmpty());
            assertNotNull(response.getErrorMessage());
        }
    }
}
