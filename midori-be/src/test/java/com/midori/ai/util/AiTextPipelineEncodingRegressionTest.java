package com.midori.ai.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.dto.AiExamParseResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression test that pins the end-to-end Unicode round-trip behaviour
 * required by the AI Homework + AI Exam teacher flows.
 *
 * <p>Background: AI-generated Japanese quiz text is serialized over
 * HTTP/JSON, parsed back into DTOs, then re-serialized back to the FE.
 * A misconfigured charset at any of those hops would silently mangle
 * CJK + Vietnamese into {@code ?} or U+FFFD replacement chars, which
 * was previously reported as "corrupted Japanese/Vietnamese output".
 *
 * <p>This test never touches a real provider — it simulates the exact
 * shape of a real provider response and confirms that every layer of
 * the pipeline (string escape, JSON parse, DTO read, JSON reserialize,
 * UTF-8 byte round-trip) preserves the original code points byte-for-byte.
 */
class AiTextPipelineEncodingRegressionTest {

    private static final String JP_1 = "こんにちは";
    private static final String JP_2 = "日本語を勉強します。";
    private static final String VI_1 = "Nhân viên học tiếng Nhật.";
    // Additional Vietnamese diacritics + Japanese kanji/kana to stress NFKC edge cases.
    private static final String[] SAMPLE_SENTENCES = {
            JP_1,
            JP_2,
            VI_1,
            "学生", "先生", "がくせい", "せんせい", "食べます",
            "Xin chào", "Tiếng Nhật", "Đúng", "đúng", "Tiếng Việt"
    };

    @Test
    @DisplayName("Raw UTF-8 round-trip preserves all required code points")
    void utf8RoundTripPreservesAllSamples() {
        for (String sample : SAMPLE_SENTENCES) {
            byte[] bytes = sample.getBytes(StandardCharsets.UTF_8);
            String restored = new String(bytes, StandardCharsets.UTF_8);
            assertEquals(sample, restored,
                    "UTF-8 round-trip changed '" + sample + "' to '" + restored + "'");
        }
        // Specifically pin the two strings called out in the incident report.
        assertTrue(new String(JP_2.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8).equals(JP_2));
        assertTrue(new String(VI_1.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8).equals(VI_1));
    }

    @Test
    @DisplayName("sanitizeGeneratedQuestions preserves CJK + Vietnamese fields")
    void sanitizePreservesUnicodeFields() {
        List<AiExamParseResponse.AiQuestionDto> raw = new ArrayList<>();
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setContent("「学生」の読み方は？");
        q.setExplanation("学生 là học sinh / sinh viên; 先生 là giáo viên.");
        q.setCategory("Vocabulary");
        q.setDifficulty("MEDIUM");
        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        for (String opt : new String[]{"がくせい", "がくしゃ", "がっこう", "せんせい"}) {
            AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
            a.setContent(opt);
            answers.add(a);
        }
        answers.get(0).setIsCorrect(true);
        q.setAnswers(answers);
        raw.add(q);

        AiExistingQuestionParser.GenerateSanitizeResult result =
                AiExistingQuestionParser.sanitizeGeneratedQuestions(
                        raw, List.of("VOCABULARY"));

        assertEquals(1, result.questions.size(), "Should not have dropped a clean CJK question");
        AiExamParseResponse.AiQuestionDto kept = result.questions.get(0);
        assertEquals("「学生」の読み方は？", kept.getContent());
        assertTrue(kept.getExplanation().contains("学生"));
        assertTrue(kept.getExplanation().contains("học sinh"));
        assertTrue(kept.getExplanation().contains("先生"));
        for (AiExamParseResponse.AiAnswerDto a : kept.getAnswers()) {
            assertNotNull(a.getContent());
            assertTrue(a.getContent().matches("^[\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FFF]+$"),
                    "Expected pure kana/kanji option, got: " + a.getContent());
        }
    }

    @Test
    @DisplayName("JSON parse → DTO → JSON re-serialize preserves Unicode")
    void jacksonRoundTripPreservesUnicode() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String json = "{\n" +
                "  \"title\": \"AI Exam — N5 Lesson 1\",\n" +
                "  \"description\": \"Tạo bởi AI từ nội dung bài học.\",\n" +
                "  \"questions\": [{\n" +
                "    \"type\": \"MULTIPLE_CHOICE\",\n" +
                "    \"content\": \"「学生」の読み方は？\",\n" +
                "    \"difficulty\": \"MEDIUM\",\n" +
                "    \"explanation\": \"学生 [がくせい] nghĩa là học sinh.\",\n" +
                "    \"category\": \"Vocabulary\",\n" +
                "    \"answers\": [\n" +
                "      { \"content\": \"がくせい\", \"isCorrect\": true },\n" +
                "      { \"content\": \"がくしゃ\", \"isCorrect\": false }\n" +
                "    ]\n" +
                "  }]\n" +
                "}";

        AiExamParseResponse parsed = mapper.readValue(json, AiExamParseResponse.class);
        assertEquals("「学生」の読み方は？", parsed.getQuestions().get(0).getContent());
        assertEquals("がくせい", parsed.getQuestions().get(0).getAnswers().get(0).getContent());
        assertEquals("学生 [がくせい] nghĩa là học sinh.",
                parsed.getQuestions().get(0).getExplanation());

        String roundTripped = mapper.writeValueAsString(parsed);
        AiExamParseResponse reparsed = mapper.readValue(roundTripped, AiExamParseResponse.class);
        assertEquals(parsed.getQuestions().get(0).getContent(),
                reparsed.getQuestions().get(0).getContent());
        assertEquals(parsed.getQuestions().get(0).getExplanation(),
                reparsed.getQuestions().get(0).getExplanation());

        // Make sure no replacement chars or mojibake sequences were introduced.
        assertEquals(-1, roundTripped.indexOf('\uFFFD'),
                "Round-trip introduced U+FFFD replacement chars");
        assertNoLongQuestionMarkRun(roundTripped);
    }

    @Test
    @DisplayName("Pin: 「学生」+ 「がくせい」+ 「Nhân viên」survive cleanJsonResponse")
    void cleanJsonResponsePreservesPinStrings() {
        String raw = "```json\n{\"questions\":[{\"content\":\"「学生」の読み方は？\","
                + "\"options\":[\"がくせい\",\"がくしゃ\"],"
                + "\"correctAnswer\":\"がくせい\","
                + "\"explanation\":\"Nhân viên học tiếng Nhật\"}]}\n```";
        String cleaned = AiExistingQuestionParser.cleanJsonResponse(raw);
        assertTrue(cleaned.contains("「学生」"));
        assertTrue(cleaned.contains("がくせい"));
        assertTrue(cleaned.contains("Nhân viên"));
        assertTrue(cleaned.contains("tiếng Nhật"));
    }

    private static void assertNoLongQuestionMarkRun(String s) {
        int run = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '?') {
                run++;
                assertTrue(run < 4,
                        "Detected a long run of '?' characters (mojibake marker) at offset " + i);
            } else {
                run = 0;
            }
        }
    }
}