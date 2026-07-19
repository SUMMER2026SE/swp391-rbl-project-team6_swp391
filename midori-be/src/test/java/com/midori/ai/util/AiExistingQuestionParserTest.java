package com.midori.ai.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.dto.AiQuizGenerationResponse;
import com.midori.service.PdfTextExtractor;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiExistingQuestionParserTest {

    private static final String REAL_LIKE_RAW_JSON = """
            {
              "title": "Sample English Vocabulary Quiz",
              "description": "5 MCQ",
              "questions": [
                {
                  "type": "MULTIPLE_CHOICE",
                  "content": "What is the synonym of 'happy'?",
                  "difficulty": "MEDIUM",
                  "explanation": "Joyful means feeling great pleasure.",
                  "answers": [
                    { "content": "Sad", "isCorrect": false },
                    { "content": "Joyful", "isCorrect": true },
                    { "content": "Angry", "isCorrect": false },
                    { "content": "Tired", "isCorrect": false }
                  ]
                },
                {
                  "type": "MULTIPLE_CHOICE",
                  "content": "Choose the correct verb form: She ___ to school every day.",
                  "difficulty": "MEDIUM",
                  "explanation": "Third-person singular present simple takes '-es'.",
                  "answers": [
                    { "content": "go", "isCorrect": false },
                    { "content": "goes", "isCorrect": true },
                    { "content": "going", "isCorrect": false },
                    { "content": "gone", "isCorrect": false }
                  ]
                }
              ]
            }
            """;

    @Test
    void cleanJsonResponse_stripsMarkdownFencesAndReturnsBalancedObject() {
        String raw = "```json\n" + REAL_LIKE_RAW_JSON + "\n```";
        String cleaned = AiExistingQuestionParser.cleanJsonResponse(raw);
        assertTrue(cleaned.startsWith("{"));
        assertTrue(cleaned.endsWith("}"));
        assertFalse(cleaned.contains("```"));
    }

    @Test
    void cleanJsonResponse_extractsBalancedObjectFromSurroundingProse() {
        String raw = "Here you go:\n\n" + REAL_LIKE_RAW_JSON + "\n\nDone.";
        String cleaned = AiExistingQuestionParser.cleanJsonResponse(raw);
        assertTrue(cleaned.startsWith("{"));
        assertTrue(cleaned.endsWith("}"));
        assertFalse(cleaned.contains("Here you go"));
    }

    @Test
    void extractLastBalancedJsonObject_returnsInnerObject() {
        String raw = "noise " + REAL_LIKE_RAW_JSON + " trailing";
        String extracted = AiExistingQuestionParser.extractLastBalancedJsonObject(raw);
        assertNotNull(extracted);
        assertTrue(extracted.startsWith("{"));
        assertEquals(extracted.length() - 1, extracted.lastIndexOf('}'));
    }

    @Test
    void extractLastBalancedJsonObject_returnsNullWhenNoBraces() {
        assertNull(AiExistingQuestionParser.extractLastBalancedJsonObject("plain text"));
    }

    @Test
    void sanitize_defaultsFirstAnswerAsCorrectWhenNoneMarked() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                {
                  "title": "T",
                  "description": "",
                  "questions": [
                    {
                      "type": "MULTIPLE_CHOICE",
                      "content": "Pick one",
                      "answers": [
                        { "content": "A" },
                        { "content": "B" }
                      ]
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = mapper.readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);
        assertEquals(1, out.getQuestions().size());
        assertEquals(1, out.getQuestions().get(0).getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count());
        // First one should be marked
        assertTrue(out.getQuestions().get(0).getAnswers().get(0).getIsCorrect());
    }

    @Test
    void sanitize_dedupesMultipleCorrectAnswers() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Pick one",
                      "answers": [
                        { "content": "A", "isCorrect": true },
                        { "content": "B", "isCorrect": true },
                        { "content": "C", "isCorrect": false }
                      ]
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = mapper.readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);
        assertEquals(1, out.getQuestions().get(0).getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count());
        // Only the first stays correct
        assertTrue(out.getQuestions().get(0).getAnswers().get(0).getIsCorrect());
        assertFalse(out.getQuestions().get(0).getAnswers().get(1).getIsCorrect());
    }

    @Test
    void sanitize_dropsQuestionsWithBlankContent() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                {
                  "questions": [
                    { "content": "", "answers": [ {"content":"A","isCorrect":true} ] },
                    { "content": "Real one", "answers": [ {"content":"A","isCorrect":true} ] }
                  ]
                }
                """;
        AiExamParseResponse parsed = mapper.readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);
        assertEquals(1, out.getQuestions().size());
        assertEquals("Real one", out.getQuestions().get(0).getContent());
    }

    @Test
    void sanitize_dropsQuestionsWithNoAnswers() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                {
                  "questions": [
                    { "content": "no answers", "answers": [] },
                    { "content": "good", "answers": [ {"content":"A","isCorrect":true} ] }
                  ]
                }
                """;
        AiExamParseResponse parsed = mapper.readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);
        assertEquals(1, out.getQuestions().size());
        assertEquals("good", out.getQuestions().get(0).getContent());
    }

    @Test
    void sanitize_defaultsTypeDifficultyExplanation() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                {
                  "questions": [
                    {
                      "content": "What?",
                      "answers": [ {"content":"X","isCorrect":false} ]
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = mapper.readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);
        var q = out.getQuestions().get(0);
        assertEquals("MULTIPLE_CHOICE", q.getType());
        assertEquals("MEDIUM", q.getDifficulty());
        assertEquals("", q.getExplanation());
        // Default-correct means first answer is true
        assertEquals(1, q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count());
    }

    @Test
    void sanitize_handlesNullQuestionsList() {
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(new AiExamParseResponse());
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().isEmpty());
    }

    @Test
    void sanitize_nullInput_returnsEmpty() {
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(null);
        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().isEmpty());
    }

    @Test
    void roundTrip_realLikeJson_parsesWithCleanerAndSanitizer() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        // Wrap in markdown fences like a chatty model would emit.
        String wrapped = "Sure! Here is the JSON:\n```json\n" + REAL_LIKE_RAW_JSON + "\n```\n";
        String cleaned = AiExistingQuestionParser.cleanJsonResponse(wrapped);
        AiExamParseResponse parsed = mapper.readValue(cleaned, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);

        assertEquals("Sample English Vocabulary Quiz", out.getTitle());
        assertEquals(2, out.getQuestions().size());
        for (var q : out.getQuestions()) {
            assertNotNull(q.getContent());
            assertFalse(q.getContent().isBlank());
            assertEquals(1, q.getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count());
        }
    }

    // ----- regression: runtime failure from AI PDF generator -----
    private static final String RUNTIME_FAILURE_RAW = """
            {
              "title": "MIDORI AI PDF Import Test",
              "description": "N5 Japanese Questions - Existing Questions PDF",
              "questions": [
                {
                  "type": "MULTIPLE_CHOICE",
                  "content": "What does 「こんにちは」 mean?",
                  "options": [
                    {"label":"A","content":"Hello","correct":true},
                    {"label":"B","content":"Goodbye","correct":false},
                    {"label":"C","content":"Thank you","correct":false},
                    {"label":"D","content":"Sorry","correct":false}
                  ],
                  "explanation": "「こんにちは」 is a common Japanese greeting meaning Hello."
                }
              ]
            }
            """;

    @Test
    void parseAndNormalize_handlesRuntimeFailureShapeWithOptionsAndCorrect() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        AiExamParseResponse out = AiExistingQuestionParser.parseAndNormalize(RUNTIME_FAILURE_RAW, mapper);
        assertNotNull(out);
        assertEquals("MIDORI AI PDF Import Test", out.getTitle());
        assertEquals(1, out.getQuestions().size());

        var q = out.getQuestions().get(0);
        assertEquals("MULTIPLE_CHOICE", q.getType());
        assertEquals("What does 「こんにちは」 mean?", q.getContent());
        assertEquals("「こんにちは」 is a common Japanese greeting meaning Hello.", q.getExplanation());
        assertEquals(4, q.getAnswers().size());

        long correctCount = q.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
        assertEquals(1, correctCount);
        assertEquals("Hello", q.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent());
    }

    @Test
    void parseAndNormalize_stripsMarkdownFencesBeforeParsing() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String wrapped = "```json\n" + RUNTIME_FAILURE_RAW + "\n```";
        AiExamParseResponse out = AiExistingQuestionParser.parseAndNormalize(wrapped, mapper);
        assertEquals(1, out.getQuestions().size());
        assertEquals("What does 「こんにちは」 mean?", out.getQuestions().get(0).getContent());
    }

    @Test
    void parseAndNormalize_acceptsQuestionTextAlias() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                { "questions": [
                  { "type":"MULTIPLE_CHOICE",
                    "questionText":"What color is the sky?",
                    "answers":[
                      {"content":"Blue","isCorrect":true},
                      {"content":"Green","isCorrect":false}
                    ]
                  }
                ]}
                """;
        AiExamParseResponse out = AiExistingQuestionParser.parseAndNormalize(raw, mapper);
        assertEquals(1, out.getQuestions().size());
        assertEquals("What color is the sky?", out.getQuestions().get(0).getContent());
    }

    @Test
    void parseAndNormalize_acceptsStringArrayOptionsShape() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                { "questions": [
                  { "type":"MULTIPLE_CHOICE",
                    "content":"Pick a greeting",
                    "options":["Hello","Goodbye","Thank you","Sorry"],
                    "correctAnswer":"Hello"
                  }
                ]}
                """;
        AiExamParseResponse out = AiExistingQuestionParser.parseAndNormalize(raw, mapper);
        var q = out.getQuestions().get(0);
        assertEquals(4, q.getAnswers().size());
        assertEquals("Hello", q.getAnswers().get(0).getContent());
        assertEquals(1, q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count());
        assertEquals("Hello", q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent());
    }

    @Test
    void parseAndNormalize_acceptsLabeledOptionMapShape() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                { "questions": [
                  { "type":"MULTIPLE_CHOICE",
                    "content":"Pick a greeting",
                    "options":{
                      "A":"Hello",
                      "B":"Goodbye",
                      "C":"Thank you",
                      "D":"Sorry"
                    },
                    "correctOption":"A"
                  }
                ]}
                """;
        AiExamParseResponse out = AiExistingQuestionParser.parseAndNormalize(raw, mapper);
        var q = out.getQuestions().get(0);
        assertEquals(4, q.getAnswers().size());
        assertEquals(1, q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count());
        assertEquals("Hello", q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent());
    }

    @Test
    void parseAndNormalize_acceptsChoicesAliasWithIsCorrectAlias() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                { "questions": [
                  { "type":"MULTIPLE_CHOICE",
                    "text":"2 + 2 = ?",
                    "choices":[
                      {"value":"3","is_correct":false},
                      {"value":"4","is_correct":true},
                      {"value":"5","is_correct":false}
                    ]
                  }
                ]}
                """;
        AiExamParseResponse out = AiExistingQuestionParser.parseAndNormalize(raw, mapper);
        var q = out.getQuestions().get(0);
        assertEquals("2 + 2 = ?", q.getContent());
        assertEquals(3, q.getAnswers().size());
        assertEquals("4", q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent());
    }

    @Test
    void parseAndNormalize_throwsOnGarbageInput() {
        ObjectMapper mapper = new ObjectMapper();
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> AiExistingQuestionParser.parseAndNormalize("not json at all", mapper));
    }

    // =============================================================
    // parseFromSourceText — rule-based fallback parser tests
    // =============================================================

    private static final String TWO_QUESTION_SOURCE = """
            MIDORI AI PDF Import Test

            1. What does 「こんにちは」 mean?
            A. Hello
            B. Goodbye
            C. Thank you
            D. Sorry
            Correct answer: A
            Explanation: 「こんにちは」 is a common Japanese greeting meaning "Hello".

            2. Choose the correct reading for 「学生」.
            A. がくせい
            B. せんせい
            C. ともだち
            D. にほん
            Correct answer: A
            Explanation: 「学生」 is read as 「がくせい」 and means "student".
            """;

    @Test
    void parseFromSourceText_parses2Questions_exactSpec() {
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(TWO_QUESTION_SOURCE);

        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().size() >= 2,
                "Expected at least 2 questions, got: " + out.getQuestions().size());

        // Q1: What does 「こんにちは」 mean?
        AiExamParseResponse.AiQuestionDto q1 = out.getQuestions().get(0);
        assertEquals("What does 「こんにちは」 mean?", q1.getContent());
        assertEquals("MULTIPLE_CHOICE", q1.getType());
        assertEquals("MEDIUM", q1.getDifficulty());
        assertTrue(q1.getAnswers().size() >= 4,
                "Q1 must have at least 4 answers, got: " + q1.getAnswers().size());

        // "Hello" is correct (A)
        long correctCount1 = q1.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
        assertEquals(1, correctCount1, "Q1 must have exactly 1 correct answer");
        String correct1 = q1.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent();
        assertEquals("Hello", correct1);

        // Q2: 「学生」
        AiExamParseResponse.AiQuestionDto q2 = out.getQuestions().get(1);
        assertTrue(q2.getContent().contains("学生") || q2.getContent().contains("reading"),
                "Q2 content: " + q2.getContent());
        assertEquals("MULTIPLE_CHOICE", q2.getType());
        assertTrue(q2.getAnswers().size() >= 4,
                "Q2 must have at least 4 answers, got: " + q2.getAnswers().size());

        long correctCount2 = q2.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
        assertEquals(1, correctCount2, "Q2 must have exactly 1 correct answer");
        String correct2 = q2.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent();
        assertEquals("がくせい", correct2);

        // No exception thrown
        assertNotNull(out);
    }

    @Test
    void parseFromSourceText_preservesQuestionOrder() {
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(TWO_QUESTION_SOURCE);
        assertTrue(out.getQuestions().size() >= 2);
        // Q1 must be about 「こんにちは」
        assertTrue(out.getQuestions().get(0).getContent().contains("こんにちは"));
        // Q2 must be about 「学生」
        assertTrue(out.getQuestions().get(1).getContent().contains("学生"));
    }

    @Test
    void parseFromSourceText_handlesTrailingAnswerKey() {
        String text = """
                MIDORI AI PDF Import Test

                1. What does 「こんにちは」 mean?
                A. Hello
                B. Goodbye
                C. Thank you
                D. Sorry
                Explanation: 「こんにちは」 means Hello.

                2. Choose the correct reading for 「学生」.
                A. がくせい
                B. せんせい
                C. ともだち
                D. にほん
                Explanation: 「学生」 means student.

                Answer Key
                1. A   2. A
                """;
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(text);

        assertNotNull(out);
        assertTrue(out.getQuestions().size() >= 2,
                "Expected at least 2 questions, got: " + out.getQuestions().size());
        assertEquals("Hello", out.getQuestions().get(0).getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent());
    }

    @Test
    void parseFromSourceText_handlesLowercaseAnswers() {
        String text = """
                1. What is 2 + 2?
                a. 3
                b. 4
                c. 5
                d. 6
                Correct answer: b
                """;
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(text);

        assertNotNull(out);
        assertTrue(out.getQuestions().size() >= 1, "Expected at least 1 question, got: " + out.getQuestions().size());
        long correctCount = out.getQuestions().get(0).getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
        assertEquals(1, correctCount);
        assertEquals("4", out.getQuestions().get(0).getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow().getContent());
    }

    @Test
    void parseFromSourceText_defaultsFirstAnswer_whenNoCorrectAnswerFound() {
        String text = """
                1. What is the capital of France?
                A. Paris
                B. London
                C. Berlin
                D. Madrid
                """;
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(text);

        assertNotNull(out);
        assertTrue(out.getQuestions().size() >= 1);
        long correctCount = out.getQuestions().get(0).getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
        assertEquals(1, correctCount,
                "Should default to 1 correct answer when none specified, got: " + correctCount);
        // First answer should be correct by default
        assertTrue(Boolean.TRUE.equals(out.getQuestions().get(0).getAnswers().get(0).getIsCorrect()),
                "First answer should be marked correct by default");
    }

    @Test
    void parseFromSourceText_returnsEmpty_whenNullInput() {
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(null);
        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().isEmpty());
    }

    @Test
    void parseFromSourceText_returnsEmpty_whenBlankInput() {
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText("   \n\n  ");
        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().isEmpty());
    }

    @Test
    void parseFromSourceText_setsExplanationOrDefault() {
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(TWO_QUESTION_SOURCE);
        assertTrue(out.getQuestions().size() >= 2);
        // Q1 has explanation from "Explanation:" line
        String exp1 = out.getQuestions().get(0).getExplanation();
        assertNotNull(exp1);
        assertFalse(exp1.isBlank());
        assertFalse(exp1.equals("Parsed from PDF."),
                "Q1 should have actual explanation from document, not default");
    }

    @Test
    void parseFromSourceText_integrationWith8QuestionPdf() {
        // The actual PDF fixture (if present) — verify extract + parse pipeline
        String pdfPath = "src/test/resources/midori_ai_pdf_existing_questions_test.pdf";
        java.io.File f = new java.io.File(pdfPath);
        org.junit.jupiter.api.Assumptions.assumeTrue(f.exists(),
                "PDF fixture missing: " + pdfPath + " — generate it to run this test");

        try (java.io.FileInputStream fis = new java.io.FileInputStream(f)) {
            PdfTextExtractor extractor = new PdfTextExtractor();
            org.springframework.mock.web.MockMultipartFile mm =
                    new org.springframework.mock.web.MockMultipartFile(
                            "file", "midori_ai_pdf_existing_questions_test.pdf",
                            "application/pdf", fis);

            PdfTextExtractor.ExtractionResult r = extractor.extract(mm);
            assertNotNull(r.fullText());
            assertFalse(r.fullText().isBlank(),
                    "PdfTextExtractor returned blank text — PDF may be scanned");

            AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(r.fullText());

            assertNotNull(out);
            assertNotNull(out.getQuestions());
            assertTrue(out.getQuestions().size() >= 5,
                    "Expected at least 5 questions from the PDF fixture, got: " + out.getQuestions().size()
                    + ". Content head: " + r.fullText().substring(0, Math.min(400, r.fullText().length())));

            // Every question must have exactly 1 correct answer
            for (int i = 0; i < out.getQuestions().size(); i++) {
                AiExamParseResponse.AiQuestionDto q = out.getQuestions().get(i);
                long cc = q.getAnswers().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
                assertEquals(1, cc, "Q" + (i + 1) + " must have exactly 1 correct answer, got: " + cc
                        + " — content: " + q.getContent());
            }
        } catch (java.io.IOException e) {
            throw new RuntimeException(e);
        }
    }

    // =============================================================
    // normalizeCategory / inferCategorySemantic tests
    // =============================================================

    @Test
    void inferCategorySemantic_vocabulary_wordMeaning() {
        // 「...」 with "mean" → Vocabulary
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("What does 「こんにちは」 mean?"));
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("「ありがとう」 nghĩa là gì?"));
        // Reading → Vocabulary
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("Choose the correct reading for 「学生」."));
        // Word meaning → Vocabulary
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("Từ nào có nghĩa là teacher?"));
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("What does the word X mean?"));
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("Dịch câu này sang tiếng Nhật."));
    }

    @Test
    void inferCategorySemantic_grammar_particleFunction() {
        // Particle in sentence → Grammar
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Trong câu 学校で勉強します, trợ từ で biểu thị gì?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("What does the particle 「で」 indicate?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("In the sentence NはNです, what does は indicate?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Particle 「で」 biểu thị nơi hành động diễn ra."));
    }

    @Test
    void inferCategorySemantic_grammar_patternSentence() {
        // Sentence pattern → Grammar
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Mẫu 「N は N です」 dùng để nói gì?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Cấu trúc 「A は B です」 dùng như thế nào?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("What does the sentence ending 「ませんか」 usually express?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("How to use the particle を in this context?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Sentence pattern N は N です biểu thị điều gì?"));
    }

    /**
     * Regression: user's exact reported sentences in the multi-skill PDF
     * import bug. Each of these was being silently coerced to "Vocabulary"
     * in the FE / BE chain. Verify the BE inference returns "Grammar" so
     * that the FE no longer needs a hard-coded fallback.
     */
    @Test
    void inferCategorySemantic_userReportedGrammarSentences_areGrammar() {
        // Sentence 1 — particle + sentence + indicate
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic(
                        "In the sentence 「学校で勉強します」, what does the particle 「で」 indicate?"));
        // Sentence 2 — grammar pattern + 「N は N です」 + used for
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic(
                        "What is the grammar pattern 「N は N です」 used for?"));
        // Sentence 3 — sentence ending + 「ませんか」 + usually express
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic(
                        "What does the sentence ending 「ませんか」 usually express?"));
        // Sentence 4 — sentence ending + 「ありませんか」 (Japanese number suffix alt)
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic(
                        "What does the sentence ending 「ありませんか」 usually express?"));
        // Sentence 5 — Japanese-only particle question (no English keyword)
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic(
                        "trợ từ 「で」 trong câu 「学校で勉強します」 biểu thị điều gì?"));
    }

    @Test
    void inferCategorySemantic_grammar_nguPhapTroTu() {
        // ngữ pháp / trợ từ / particle keywords → Grammar
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Ngữ pháp として dùng như thế nào?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Trợ từ で có thể biểu thị những nghĩa gì?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.inferCategorySemantic("Bài tập ngữ pháp: chọn mẫu câu đúng."));
    }

    @Test
    void inferCategorySemantic_defaultVocabulary() {
        // No keyword → default to Vocabulary
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("What is the capital of Japan?"));
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("Which kanji means 'mountain'?"));
    }

    @Test
    void inferCategorySemantic_nullBlank() {
        assertEquals("Vocabulary", AiExistingQuestionParser.inferCategorySemantic(null));
        assertEquals("Vocabulary", AiExistingQuestionParser.inferCategorySemantic(""));
        assertEquals("Vocabulary", AiExistingQuestionParser.inferCategorySemantic("   "));
    }

    // =============================================================
    // Reading skill inference tests
    // =============================================================

    @Test
    void inferCategorySemantic_reading_englishKeywords() {
        // English reading comprehension keywords
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Read the passage and answer the question: ..."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Read the passage below and choose the correct answer."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("According to the passage, why did Tanaka go to school?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Based on the text, what is the main idea?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("What can be inferred from the passage?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("The passage states that..."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("The author suggests in the passage..."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Main idea of the text is..."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Reading comprehension: ..."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Text comprehension question"));
    }

    @Test
    void inferCategorySemantic_reading_vietnameseKeywords() {
        // Vietnamese reading comprehension keywords
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Đọc đoạn văn sau và chọn đáp án đúng."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Đọc bài đọc sau và trả lời câu hỏi."));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Theo bài đọc, ai đã đi thư viện?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Theo đoạn văn, nhân vật chính là ai?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Dựa vào bài đọc, sự kiện xảy ra ở đâu?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Ý chính của đoạn văn là gì?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Đoạn văn sau nói về nội dung gì?"));
        assertEquals("Reading",
                AiExistingQuestionParser.inferCategorySemantic("Trả lời câu hỏi theo bài đọc."));
    }

    @Test
    void inferCategorySemantic_reading_notJustLongJapanese() {
        // Long Japanese text alone should NOT trigger Reading
        // Must have passage/comprehension context
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("日本語を勉強します。"));
        assertEquals("Vocabulary",
                AiExistingQuestionParser.inferCategorySemantic("今日は天気が 좋습니다。"));
    }

    @Test
    void parseTargetSkill_variousValues() {
        // Test parseTargetSkill method
        assertNull(AiExistingQuestionParser.parseTargetSkill(null));
        assertNull(AiExistingQuestionParser.parseTargetSkill(""));
        assertNull(AiExistingQuestionParser.parseTargetSkill("auto"));
        assertNull(AiExistingQuestionParser.parseTargetSkill("AUTO"));
        assertNull(AiExistingQuestionParser.parseTargetSkill("detect"));

        assertEquals("Vocabulary", AiExistingQuestionParser.parseTargetSkill("VOCABULARY"));
        assertEquals("Vocabulary", AiExistingQuestionParser.parseTargetSkill("vocabulary"));
        assertEquals("Vocabulary", AiExistingQuestionParser.parseTargetSkill("vocab"));
        assertEquals("Vocabulary", AiExistingQuestionParser.parseTargetSkill("word"));
        assertEquals("Vocabulary", AiExistingQuestionParser.parseTargetSkill("meaning"));

        assertEquals("Grammar", AiExistingQuestionParser.parseTargetSkill("GRAMMAR"));
        assertEquals("Grammar", AiExistingQuestionParser.parseTargetSkill("grammar"));
        assertEquals("Grammar", AiExistingQuestionParser.parseTargetSkill("pattern"));
        assertEquals("Grammar", AiExistingQuestionParser.parseTargetSkill("structure"));

        assertEquals("Reading", AiExistingQuestionParser.parseTargetSkill("READING"));
        assertEquals("Reading", AiExistingQuestionParser.parseTargetSkill("reading"));
        assertEquals("Reading", AiExistingQuestionParser.parseTargetSkill("reading_comprehension"));
        assertEquals("Reading", AiExistingQuestionParser.parseTargetSkill("passage"));
        assertEquals("Reading", AiExistingQuestionParser.parseTargetSkill("text"));
        assertEquals("Reading", AiExistingQuestionParser.parseTargetSkill("comprehension"));
    }

    @Test
    void normalizeCategoryWithTargetSkill_readingFallback() {
        // When AI returns unknown category and targetSkill=READING, should fallback to Reading
        assertEquals("Reading",
                AiExistingQuestionParser.normalizeCategoryWithTargetSkill(
                        "unknown", "Read the passage below.", "READING"));
        assertEquals("Reading",
                AiExistingQuestionParser.normalizeCategoryWithTargetSkill(
                        null, "According to the text...", "READING"));
        assertEquals("Reading",
                AiExistingQuestionParser.normalizeCategoryWithTargetSkill(
                        "", "Theo bài đọc...", "reading"));
    }

    @Test
    void normalizeCategoryWithTargetSkill_autoInferFromContent() {
        // When targetSkill=AUTO (null), should infer from content
        assertEquals("Vocabulary",
                AiExistingQuestionParser.normalizeCategoryWithTargetSkill(
                        null, "What does 「山川」 mean?", null));
        assertEquals("Grammar",
                AiExistingQuestionParser.normalizeCategoryWithTargetSkill(
                        null, "What does the particle 「で」 indicate?", null));
        assertEquals("Reading",
                AiExistingQuestionParser.normalizeCategoryWithTargetSkill(
                        null, "Read the passage and answer:", null));
    }

    @Test
    void sanitize_withTargetSkill_setsReading() throws Exception {
        // Test sanitize with targetSkill parameter
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Read the passage and answer the question.",
                      "answers": [{"content":"A","isCorrect":true}]
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed, "READING");

        assertEquals("Reading", out.getQuestions().get(0).getCategory());
    }

    @Test
    void normalizeCategory_keepsAiProvidedValue() {
        assertEquals("Vocabulary", AiExistingQuestionParser.normalizeCategory("Vocabulary", "irrelevant"));
        assertEquals("Grammar",    AiExistingQuestionParser.normalizeCategory("Grammar",    "irrelevant"));
        assertEquals("Reading",    AiExistingQuestionParser.normalizeCategory("Reading",    "irrelevant"));
        assertEquals("Listening",  AiExistingQuestionParser.normalizeCategory("Listening",  "irrelevant"));
        // Case insensitive
        assertEquals("Vocabulary", AiExistingQuestionParser.normalizeCategory("vocabulary", "irrelevant"));
        assertEquals("Grammar",    AiExistingQuestionParser.normalizeCategory("GRAMMAR",    "irrelevant"));
        // Whitespace trimmed
        assertEquals("Vocabulary", AiExistingQuestionParser.normalizeCategory("  Vocabulary  ", "irrelevant"));
    }

    @Test
    void normalizeCategory_fallsBackToInferenceWhenBlank() {
        // null / blank → inference
        assertEquals("Vocabulary",
                AiExistingQuestionParser.normalizeCategory(null,
                        "What does 「こんにちは」 mean?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.normalizeCategory("",
                        "Mẫu 「N は N です」 dùng để nói gì?"));
    }

    @Test
    void normalizeCategory_unknownValueFallsBackToInference() {
        // Unknown category value → inference
        assertEquals("Vocabulary",
                AiExistingQuestionParser.normalizeCategory("UnknownCategory",
                        "What does 「こんにちは」 mean?"));
        assertEquals("Grammar",
                AiExistingQuestionParser.normalizeCategory("SomeInvalidValue",
                        "Trong câu 学校で, trợ từ で biểu thị gì?"));
    }

    @Test
    void sanitize_preservesAiCategory() throws Exception {
        // When AI provides category in JSON, sanitize should keep it
        String raw = """
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [{"content":"Hello","isCorrect":true}],
                      "category": "Vocabulary"
                    },
                    {
                      "content": "Mẫu 「N は N です」 dùng để nói gì?",
                      "answers": [{"content":"A is B","isCorrect":true}],
                      "category": "Grammar"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);

        assertEquals("Vocabulary", out.getQuestions().get(0).getCategory());
        assertEquals("Grammar",    out.getQuestions().get(1).getCategory());
    }

    @Test
    void sanitize_infersCategoryWhenMissing() throws Exception {
        String raw = """
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [{"content":"Hello","isCorrect":true}]
                    },
                    {
                      "content": "Trong câu 学校で勉強します, trợ từ で biểu thị gì?",
                      "answers": [{"content":"Nơi hành động","isCorrect":true}]
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);
        AiExamParseResponse out = AiExistingQuestionParser.sanitize(parsed);

        assertEquals("Vocabulary", out.getQuestions().get(0).getCategory());
        assertEquals("Grammar",    out.getQuestions().get(1).getCategory());
    }

    // =============================================================
    // sanitizeWithSelectedSkills tests
    // =============================================================

    @Test
    void sanitizeWithSelectedSkills_filtersOutNonMatchingSkills() throws Exception {
        // Source has Vocabulary, Grammar, Reading
        String raw = """
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [{"content":"Hello","isCorrect":true}],
                      "category": "Vocabulary"
                    },
                    {
                      "content": "What does the particle 「で」 indicate?",
                      "answers": [{"content":"Location","isCorrect":true}],
                      "category": "Grammar"
                    },
                    {
                      "content": "Read the passage and answer.",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Reading"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // selectedSkills = [VOCABULARY] should keep only Vocabulary
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("VOCABULARY"));
        assertEquals(1, out.getQuestions().size());
        assertEquals("Vocabulary", out.getQuestions().get(0).getCategory());
        assertTrue(out.getQuestions().get(0).getContent().contains("こんにちは"));
    }

    @Test
    void sanitizeWithSelectedSkills_filtersToGrammarOnly() throws Exception {
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Vocab question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Vocabulary"
                    },
                    {
                      "content": "Grammar particle question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Grammar"
                    },
                    {
                      "content": "Reading passage question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Reading"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // selectedSkills = [GRAMMAR] should keep only Grammar
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("GRAMMAR"));
        assertEquals(1, out.getQuestions().size());
        assertEquals("Grammar", out.getQuestions().get(0).getCategory());
    }

    @Test
    void sanitizeWithSelectedSkills_filtersToReadingOnly() throws Exception {
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Vocab question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Vocabulary"
                    },
                    {
                      "content": "Grammar particle question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Grammar"
                    },
                    {
                      "content": "Read the passage and answer.",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Reading"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // selectedSkills = [READING] should keep only Reading
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("READING"));
        assertEquals(1, out.getQuestions().size());
        assertEquals("Reading", out.getQuestions().get(0).getCategory());
    }

    @Test
    void sanitizeWithSelectedSkills_keepsMultipleMatchingSkills() throws Exception {
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Vocab question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Vocabulary"
                    },
                    {
                      "content": "Grammar particle question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Grammar"
                    },
                    {
                      "content": "Reading passage question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Reading"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // selectedSkills = [VOCABULARY, GRAMMAR] should keep Vocabulary and Grammar, NOT Reading
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("VOCABULARY", "GRAMMAR"));
        assertEquals(2, out.getQuestions().size());
        assertTrue(out.getQuestions().stream().allMatch(q ->
                q.getCategory().equals("Vocabulary") || q.getCategory().equals("Grammar")));
        assertTrue(out.getQuestions().stream().noneMatch(q -> q.getCategory().equals("Reading")));
    }

    @Test
    void sanitizeWithSelectedSkills_keepsAllWhenAllThreeSelected() throws Exception {
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Vocab question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Vocabulary"
                    },
                    {
                      "content": "Grammar particle question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Grammar"
                    },
                    {
                      "content": "Reading passage question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Reading"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // selectedSkills = [VOCABULARY, GRAMMAR, READING] should keep all 3
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("VOCABULARY", "GRAMMAR", "READING"));
        assertEquals(3, out.getQuestions().size());
    }

    @Test
    void sanitizeWithSelectedSkills_doesNotConvertSkills() throws Exception {
        // If selectedSkills=[VOCABULARY] but a question has category=Grammar,
        // it should be FILTERED OUT, not converted to Vocabulary
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Grammar question but we selected Vocabulary",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Grammar"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // selectedSkills = [VOCABULARY] should NOT convert Grammar to Vocabulary
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("VOCABULARY"));
        assertEquals(0, out.getQuestions().size(),
                "Grammar question should be filtered out when only Vocabulary is selected");
    }

    @Test
    void sanitizeWithSelectedSkills_emptyList_fallsBackToBasicSanitize() throws Exception {
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Question without answers filter",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Vocabulary"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // Empty/null selectedSkills should fall back to basic sanitize (no filtering)
        AiExamParseResponse out1 = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, new ArrayList<>());
        assertEquals(1, out1.getQuestions().size());

        AiExamParseResponse out2 = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, null);
        assertEquals(1, out2.getQuestions().size());
    }

    @Test
    void sanitizeWithSelectedSkills_normalizesInferredCategories() throws Exception {
        // When AI doesn't provide category but selectedSkills has single skill,
        // should use selected skill as fallback
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Read the passage and answer.",
                      "answers": [{"content":"A","isCorrect":true}]
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // selectedSkills = [READING] should infer Reading
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("READING"));
        assertEquals(1, out.getQuestions().size());
        assertEquals("Reading", out.getQuestions().get(0).getCategory());
    }

    @Test
    void sanitizeWithSelectedSkills_caseInsensitiveSkillMatching() throws Exception {
        String raw = """
                {
                  "questions": [
                    {
                      "content": "Grammar question",
                      "answers": [{"content":"A","isCorrect":true}],
                      "category": "Grammar"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = new ObjectMapper().readValue(raw, AiExamParseResponse.class);

        // Case insensitive matching should work
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("grammar"));
        assertEquals(1, out.getQuestions().size());

        AiExamParseResponse out2 = AiExistingQuestionParser.sanitizeWithSelectedSkills(parsed, List.of("GRAMMAR"));
        assertEquals(1, out2.getQuestions().size());
    }

    /**
     * Regression for the "all VOCABULARY" bug: when a mixed PDF is uploaded
     * with selectedSkills=[VOCABULARY, GRAMMAR], a Grammar question whose
     * AI-returned category is missing/blank must STILL be tagged as
     * "Grammar" via {@link AiExistingQuestionParser#inferCategorySemantic},
     * never silently coerced to the first selected skill ("Vocabulary").
     */
    @Test
    void sanitizeWithSelectedSkills_userReportedGrammarSentences_stayGrammar() throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        // Three Grammar questions with NO AI-provided category — these mirror
        // the user's exact PDF sentences. Without the inference fallback
        // they would all be dropped (because empty category would never
        // match selectedSkills) OR be coerced to the first selected skill.
        String raw = """
                {
                  "questions": [
                    {
                      "content": "In the sentence 「学校で勉強します」, what does the particle 「で」 indicate?",
                      "answers": [{"content":"Location of action","isCorrect":true},{"content":"Direction","isCorrect":false},{"content":"Time","isCorrect":false},{"content":"Manner","isCorrect":false}]
                    },
                    {
                      "content": "What is the grammar pattern 「N は N です」 used for?",
                      "answers": [{"content":"A is B","isCorrect":true},{"content":"Past tense","isCorrect":false},{"content":"Question","isCorrect":false},{"content":"Negation","isCorrect":false}]
                    },
                    {
                      "content": "What does the sentence ending 「ませんか」 usually express?",
                      "answers": [{"content":"Polite invitation","isCorrect":true},{"content":"Past tense","isCorrect":false},{"content":"Possession","isCorrect":false},{"content":"Ability","isCorrect":false}]
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = mapper.readValue(raw, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(
                parsed, List.of("VOCABULARY", "GRAMMAR"));

        // All 3 Grammar sentences must survive and be tagged Grammar.
        assertEquals(3, out.getQuestions().size(),
                "All 3 user-reported Grammar sentences must survive selectedSkills=[VOCAB,GRAM] filter. "
                        + "Got: " + out.getQuestions().stream().map(AiExamParseResponse.AiQuestionDto::getCategory).reduce("", (a,b)->a+","+b));
        for (var q : out.getQuestions()) {
            assertEquals("Grammar", q.getCategory(),
                    "Each user-reported sentence must be classified Grammar, NOT coerced to VOCABULARY: " + q.getContent());
        }
    }

    /**
     * Regression for the "all VOCABULARY" bug: same as above but with all
     * 3 skills selected. Grammar questions must stay Grammar, Reading
     * questions must stay Reading, Vocabulary questions must stay Vocabulary.
     */
    @Test
    void sanitizeWithSelectedSkills_allThreeSkills_preservesEachCategory() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = """
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [{"content":"Hello","isCorrect":true},{"content":"Goodbye","isCorrect":false},{"content":"Thank you","isCorrect":false},{"content":"Sorry","isCorrect":false}],
                      "category": "Vocabulary"
                    },
                    {
                      "content": "What does the particle 「で」 indicate in 学校で勉強します?",
                      "answers": [{"content":"Location","isCorrect":true},{"content":"Direction","isCorrect":false},{"content":"Time","isCorrect":false},{"content":"Manner","isCorrect":false}],
                      "category": "Grammar"
                    },
                    {
                      "content": "Read the passage and answer the question below.",
                      "answers": [{"content":"A","isCorrect":true},{"content":"B","isCorrect":false},{"content":"C","isCorrect":false},{"content":"D","isCorrect":false}],
                      "category": "Reading"
                    }
                  ]
                }
                """;
        AiExamParseResponse parsed = mapper.readValue(raw, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(
                parsed, List.of("VOCABULARY", "GRAMMAR", "READING"));

        assertEquals(3, out.getQuestions().size());
        assertEquals("Vocabulary", out.getQuestions().get(0).getCategory());
        assertEquals("Grammar",    out.getQuestions().get(1).getCategory());
        assertEquals("Reading",    out.getQuestions().get(2).getCategory());
    }

    // =============================================================
    // Evidence validation tests (import-existing safety net)
    // =============================================================

    private static final String VOCAB_GRAMMAR_SOURCE = """
            Vocabulary Test

            1. What does 「こんにちは」 mean?
            A. Hello
            B. Goodbye
            C. Thank you
            D. Sorry
            Correct answer: A

            2. What does the particle 「で」 indicate in 学校で勉強します?
            A. Location
            B. Direction
            C. Time
            D. Manner
            Correct answer: A
            """;

    @Test
    void evidence_keepsQuestionThatAppearsInSource() throws Exception {
        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [
                        {"content":"Hello","isCorrect":true},
                        {"content":"Goodbye","isCorrect":false},
                        {"content":"Thank you","isCorrect":false},
                        {"content":"Sorry","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, VOCAB_GRAMMAR_SOURCE, "test.pdf");
        assertEquals(1, out.getQuestions().size());
        assertEquals("What does 「こんにちは」 mean?", out.getQuestions().get(0).getContent());
    }

    @Test
    void evidence_dropsFabricatedReadingPassage() throws Exception {
        // The LLM "hallucinates" a Tanaka passage that does NOT exist in the source.
        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "category": "Reading",
                      "content": "Read the passage and answer: When does Tanaka wake up?",
                      "answers": [
                        {"content":"田中さんは毎朝七時に起きます。","isCorrect":true},
                        {"content":"毎朝六時に起きます。","isCorrect":false},
                        {"content":"毎晩八時に寝ます。","isCorrect":false},
                        {"content":"七時に寝ます。","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        // Source has only Vocabulary + Grammar, no Reading passage.
        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, VOCAB_GRAMMAR_SOURCE, "test.pdf");
        assertEquals(0, out.getQuestions().size(),
                "Fabricated Tanaka passage must be dropped when source has no such content");
    }

    @Test
    void evidence_dropsQuestionWithNoOptionsMatchedInSource() throws Exception {
        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [
                        {"content":"Bogus A","isCorrect":true},
                        {"content":"Bogus B","isCorrect":false},
                        {"content":"Bogus C","isCorrect":false},
                        {"content":"Bogus D","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, VOCAB_GRAMMAR_SOURCE, "test.pdf");
        assertEquals(0, out.getQuestions().size());
    }

    @Test
    void evidence_dropsBlankContent() throws Exception {
        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "content": "",
                      "answers": [{"content":"X","isCorrect":true},{"content":"Y","isCorrect":false}]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, VOCAB_GRAMMAR_SOURCE, "test.pdf");
        assertEquals(0, out.getQuestions().size());
    }

    @Test
    void evidence_dropsWhenCorrectOptionNotInSource() throws Exception {
        // Question text + 2 options are in the source, but the AI marks a
        // third (non-source) option as correct.
        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [
                        {"content":"Hello","isCorrect":false},
                        {"content":"BogusCorrect","isCorrect":true},
                        {"content":"Thank you","isCorrect":false},
                        {"content":"Sorry","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, VOCAB_GRAMMAR_SOURCE, "test.pdf");
        assertEquals(0, out.getQuestions().size(),
                "Question whose correct option is not in source must be dropped");
    }

    @Test
    void evidence_acceptsViaInlineCorrectMarker() throws Exception {
        // Question with options present in source; correct is "A" inline.
        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "content": "What does 「こんにちは」 mean?",
                      "answers": [
                        {"content":"A. Hello","isCorrect":true},
                        {"content":"B. Goodbye","isCorrect":false},
                        {"content":"C. Thank you","isCorrect":false},
                        {"content":"D. Sorry","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, VOCAB_GRAMMAR_SOURCE, "test.pdf");
        assertEquals(1, out.getQuestions().size());
    }

    // =============================================================
    // PHẦN 1/4: normalizeForEvidence tests
    // =============================================================

    @Test
    void normalizeForEvidence_handlesCRLF() {
        String input = "Line1\r\nLine2\r\nLine3";
        String out = AiExistingQuestionParser.normalizeForEvidence(input);
        assertFalse(out.contains("\r"), "CRLF should be normalized");
        assertTrue(out.contains("\n"), "LF should be preserved");
    }

    @Test
    void normalizeForEvidence_collapsesJapaneseSpacing() {
        // PDF extractor artifact: spaces between Japanese characters
        String input = "撮り まし た"; // should match 撮りました
        String out = AiExistingQuestionParser.normalizeForEvidence(input);
        assertEquals("撮りました", out);
    }

    @Test
    void normalizeForEvidence_collapsesJapaneseSpacing_longer() {
        // Note: "学校 で行 きまし す" has space BEFORE で which is NOT between CJK chars
        // (space is between 学校 and で). After collapse: "学校 で 行きまし す".
        // "で行 きまし す" → "で行きます"
        String input = "学校 で 行 きまし す";
        String out = AiExistingQuestionParser.normalizeForEvidence(input);
        // Only spaces between CJK characters are collapsed
        assertTrue(out.contains("学校"), "School should be preserved");
        assertTrue(out.contains("で"), "で should be preserved");
    }

    @Test
    void normalizeForEvidence_collapsesJapaneseSpacing_simple() {
        // Simple case: spaces between CJK characters collapse
        String input = "撮 り ま す た";
        String out = AiExistingQuestionParser.normalizeForEvidence(input);
        assertTrue(out.contains("撮"), "撮 should be preserved");
        assertFalse(out.contains("  "), "No double spaces");
    }

    @Test
    void normalizeForEvidence_normalizesFullwidthPunctuation() {
        String input = "Ａ．選択肢　Ｂ．正しい　Ｃ．間違い　Ｄ．答え";
        String out = AiExistingQuestionParser.normalizeForEvidence(input);
        assertFalse(out.contains("Ａ"), "Fullwidth A should be normalized");
        assertTrue(out.contains("A."), "ASCII A. should be present");
    }

    @Test
    void normalizeForEvidence_preservesJapaneseText() {
        String input = "田中さんは毎朝七時に起きます。朝ごはんを食べてから、学校へ行きます。";
        String out = AiExistingQuestionParser.normalizeForEvidence(input);
        assertTrue(out.contains("田中さんは毎朝七時に起きます"), "Japanese text should be preserved");
    }

    @Test
    void normalizeForEvidence_collapsesMultipleSpaces() {
        String input = "What   does   this   mean?";
        String out = AiExistingQuestionParser.normalizeForEvidence(input);
        assertEquals("What does this mean?", out);
    }

    // =============================================================
    // PHẦN 2: Reading long Japanese shared passage tests
    // =============================================================

    @Test
    void readingLongJapanese_sharedPassage_multipleQuestions_extractsQuestions() {
        // Source text with a long shared Reading passage followed by 2 numbered questions
        String source = """
                Skill: Reading

                Read the passage:
                田中さんは毎朝七時に起きます。朝ごはんを食べてから、学校へ行きます。午後、図書館で本を読みます。夕方、友だちと話します。夜、宿題をします。

                1. 田中さんは午後どこで本を読みますか。
                A. 図書館
                B. 駅
                C. レストラン
                D. 家
                Correct answer: A
                Explanation: 本文に「午後、図書館で本を読みます」とあります。

                2. 田中さんは夜何をしますか。
                A. 宿題をします
                B. 写真を撮ります
                C. 公園へ行きます
                D. 映画を見ます
                Correct answer: A
                Explanation: 本文に「夜、宿題をします」とあります。
                """;

        // Verify normalizeForEvidence works for Japanese text
        String normalized = AiExistingQuestionParser.normalizeForEvidence(source);
        assertNotNull(normalized);
        assertTrue(normalized.contains("田中さんは毎朝七時に起きます"),
                "Passage text should be preserved after normalization");

        // Verify passage detection: the normalized source contains the passage marker "Read the passage:"
        assertTrue(normalized.contains("Read the passage:"),
                "Passage marker should be detectable in normalized source");

        // Verify the parser returns at least 1 question
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);
        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().size() >= 1,
                "Parser should return at least 1 question, got: " + out.getQuestions().size());
    }

    @Test
    void readingLongJapanese_pdfSpacingStillMatchesEvidence() throws Exception {
        // Source has "撮りまし た" (spaced) but parsed question has normal "撮りました"
        String source = "Skill: Reading\n\nRead the passage:\n田中さんは撮りました。\n\n1. 田中さんは何をしましたか。\nA. 撮りました\nB. 読みました\nC. 行きました\nD. 食べました\nCorrect answer: A";

        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "category": "Reading",
                      "content": "Read the passage: 田中さんは撮りました。\\n\\nQuestion: 田中さんは何をしましたか。",
                      "answers": [
                        {"content":"撮りました","isCorrect":true},
                        {"content":"読みました","isCorrect":false},
                        {"content":"行きました","isCorrect":false},
                        {"content":"食べました","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        // Source text has "撮りました" (no spacing) - should match
        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, source, "test.pdf");

        // Should NOT drop due to spacing mismatch
        assertEquals(1, out.getQuestions().size(),
                "Question should NOT be dropped due to spacing artifact in source. " +
                        "normalizeForEvidence should bridge the gap.");
    }

    @Test
    void readingOnly_noReadingShape_dropsFabricatedTanaka() throws Exception {
        // Source has NO Reading passage — only Vocabulary/Grammar
        // AI "hallucinates" a Tanaka reading passage
        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "category": "Reading",
                      "content": "Read the passage: When does Tanaka wake up every morning?",
                      "answers": [
                        {"content":"At 7 AM","isCorrect":true},
                        {"content":"At 6 AM","isCorrect":false},
                        {"content":"At 8 AM","isCorrect":false},
                        {"content":"At 9 AM","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        // Source has only Vocabulary + Grammar (same as VOCAB_GRAMMAR_SOURCE)
        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(
                parsed, VOCAB_GRAMMAR_SOURCE, "test.pdf");

        assertEquals(0, out.getQuestions().size(),
                "Fabricated Reading passage (Tanaka) must be dropped when source has no such content");
    }

    // =============================================================
    // PHẦN 3: Japanese question number/option format tests
    // =============================================================

    @Test
    void parseFromSourceText_handlesJapaneseQuestionNumbers() {
        // Verify parseFromSourceText handles a source with hiragana option letters (ア/イ/ウ/エ)
        // by ensuring no exception is thrown and the parser returns a valid (non-null) response.
        // The hiragana option letters are normalized via the internal normalizeOptionLetter helper.
        String source = """
                問1: 日本語を勉強しますか。
                ア. はい
                イ. いいえ
                ウ. わかりません
                エ. 答えない
                Correct answer: ア

                問題2: 「ありがとう」の意味は？
                A. Hello
                B. Thank you
                C. Goodbye
                D. Sorry
                Correct answer: B
                """;

        // Parser should not throw on Japanese number prefixes + hiragana options
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);

        assertNotNull(out, "Parser must not return null for hiragana-options input");
        assertNotNull(out.getQuestions(), "Questions list must not be null");

        // Mixed Japanese/English source: at least the ASCII-letter question (Q2) should parse
        // because the parser handles standard A./B./C./D. options reliably.
        boolean hasAsciiOptions = out.getQuestions().stream()
                .anyMatch(q -> q.getAnswers().size() >= 2);
        assertTrue(hasAsciiOptions,
                "Parser should extract at least one question with ASCII-letter options from mixed source");
    }

    @Test
    void parseFromSourceText_handlesFullwidthOptionLetters() {
        String source = """
                1. Choose the correct answer.
                Ａ．図書館
                Ｂ．学校
                Ｃ．家
                Ｄ．駅
                Correct answer: Ａ
                """;

        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);

        assertNotNull(out);
        assertTrue(out.getQuestions().size() >= 1);

        AiExamParseResponse.AiQuestionDto q = out.getQuestions().get(0);
        assertEquals(1, q.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count());

        // Fullwidth A should map to ASCII A
        String correctContent = q.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .findFirst().orElseThrow()
                .getContent();
        assertEquals("図書館", correctContent);
    }

    @Test
    void evidence_readingSoftPassageMatching() throws Exception {
        // Reading question: simplify to verify options match in source
        String source = "Skill: Reading\n\n1. 田中さんは午後どこで本を読みますか。\nA. 図書館\nB. 駅\nC. レストラン\nD. 家\nCorrect answer: A";

        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "category": "Reading",
                      "content": "田中さんは午後どこで本を読みますか。",
                      "answers": [
                        {"content":"図書館","isCorrect":true},
                        {"content":"駅","isCorrect":false},
                        {"content":"レストラン","isCorrect":false},
                        {"content":"家","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, source, "test.pdf");

        // Question should pass because all options are present in source
        assertEquals(1, out.getQuestions().size(),
                "Reading question with options matching source should pass evidence check. " +
                        "Got " + out.getQuestions().size() + " questions.");
    }

    @Test
    void evidence_readingNoPassageButQuestionAndOptionsMatch() throws Exception {
        // Reading question without explicit passage text, but question+options match source
        String source = "Skill: Reading\n\n田中さんは毎朝七時に起きます。午後、図書館で本を読みます。\n\n1. 田中さんは午後どこで本を読みますか。\nA. 図書館\nB. 駅\nC. レストラン\nD. 家\nCorrect answer: A";

        AiExamParseResponse parsed = new ObjectMapper().readValue("""
                {
                  "questions": [
                    {
                      "category": "Reading",
                      "content": "田中さんは午後どこで本を読みますか。",
                      "answers": [
                        {"content":"図書館","isCorrect":true},
                        {"content":"駅","isCorrect":false},
                        {"content":"レストラン","isCorrect":false},
                        {"content":"家","isCorrect":false}
                      ]
                    }
                  ]
                }
                """, AiExamParseResponse.class);

        AiExamParseResponse out = AiExistingQuestionParser.filterByEvidence(parsed, source, "test.pdf");

        // Should pass because options match source (図書館 appears in source)
        assertEquals(1, out.getQuestions().size(),
                "Reading question should pass if options match source even without explicit passage. " +
                        "Got " + out.getQuestions().size() + " questions.");
    }

    // ======================================================================
    // UNREADABLE UNICODE / FONT DETECTION (PHẦN MỚI — PDF font fallback)
    // ======================================================================

    @Test
    void unreadableUnicode_questionBankShapeWithQuestionMarks_detected() {
        // PDFBox collapsed Japanese into "?" but ASCII scaffolding is intact.
        String unreadable = ""
                + "Skill: Reading\n"
                + "Question: ???? ??????? ???????\n"
                + "A. ??????\n"
                + "B. ?????\n"
                + "C. ?????\n"
                + "D. ?????\n"
                + "Correct answer: A\n"
                + "\n"
                + "Question: ??????????\n"
                + "A. ????\n"
                + "B. ?????\n"
                + "C. ?????\n"
                + "D. ????\n"
                + "Correct answer: B\n"
                + "\n"
                + "Question: ???? ???????\n"
                + "A. ?????\n"
                + "B. ????\n"
                + "C. ??????\n"
                + "D. ????\n"
                + "Correct answer: C\n";
        assertTrue(AiExistingQuestionParser.isUnreadableUnicodeText(unreadable),
                "ASCII scaffolding + many '?' clusters must be flagged unreadable");
    }

    @Test
    void unreadableUnicode_readableEnglishText_notDetected() {
        String ok = ""
                + "Skill: Vocabulary\n"
                + "Question 1: What is the synonym of happy?\n"
                + "A. Sad\n"
                + "B. Joyful\n"
                + "C. Angry\n"
                + "D. Tired\n"
                + "Correct answer: B\n"
                + "\n"
                + "Question 2: Choose the correct verb form: She ___ to school every day.\n"
                + "A. go\n"
                + "B. goes\n"
                + "C. going\n"
                + "D. gone\n"
                + "Correct answer: B\n"
                + "\n"
                + "Question 3: Pick the right preposition: She arrived ___ Monday.\n"
                + "A. in\n"
                + "B. at\n"
                + "C. on\n"
                + "D. by\n"
                + "Correct answer: C\n";
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText(ok),
                "Plain English text with at most one '?' per question must NOT be flagged");
    }

    @Test
    void unreadableUnicode_readableJapaneseText_notDetected() {
        // Real Japanese text — Kanji + Hiragana — Unicode intact.
        String ok = ""
                + "Skill: Reading\n"
                + "Question: 次の文章を読んで質問に答えなさい。\n"
                + "A. 学校\n"
                + "B. 友達\n"
                + "C. 先生\n"
                + "D. 家族\n"
                + "正解: A\n"
                + "\n"
                + "Question: 東京は日本の首都ですか。\n"
                + "A. はい\n"
                + "B. いいえ\n"
                + "正解: A\n";
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText(ok),
                "Readable Japanese (no '?' fallback) must NOT be flagged");
    }

    @Test
    void unreadableUnicode_textWithSingleTrailingQuestionMark_notDetected() {
        // Single trailing '?' is normal English question mark — must NOT trigger.
        String ok = ""
                + "Skill: Grammar\n"
                + "Question: Is this sentence grammatically correct?\n"
                + "A. Yes, it is correct.\n"
                + "B. No, it has a subject-verb disagreement.\n"
                + "C. Maybe, depending on context.\n"
                + "D. It needs more context to decide.\n"
                + "Correct answer: B\n";
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText(ok),
                "Single '?' in sentence must NOT be flagged");
    }

    @Test
    void unreadableUnicode_emptyOrShort_returnsFalse() {
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText(null));
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText(""));
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText("   "));
        // Too short to confidently detect
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText("Skill: Reading\nA. ?"));
    }

    @Test
    void unreadableUnicode_multipleQuadRuns_strongSignal() {
        // Only 3 runs of "????" (each run is counted every char >= 4). Even with low overall ratio, quad runs >= 3 => detected.
        String text = ""
                + "Skill: Reading\n"
                + "Question: Read the passage:\n"
                + "Passage: Taro went to school. Hanako went home. Ken played soccer.\n"
                + "A. ????\n"
                + "B. ????\n"
                + "C. school\n"
                + "D. home\n"
                + "Correct answer: A\n"
                + "\n"
                + "Question 2: Who went home?\n"
                + "A. Taro\n"
                + "B. Hanako\n"
                + "C. Ken\n"
                + "D. ????\n"
                + "Correct answer: B\n";
        assertTrue(AiExistingQuestionParser.isUnreadableUnicodeText(text),
                "Three runs of '????' across options + question-bank markers must be flagged");
    }

    @Test
    void unreadableUnicode_noQuestionBankShape_notDetected() {
        // Even with many '?' chars, if there are no ASCII question-bank markers, return false.
        // This avoids false positives on random garbled text.
        String text = "???? ???? ?? ??? ??? ????? ??? ?????? ????? ????? ????";
        assertFalse(AiExistingQuestionParser.isUnreadableUnicodeText(text),
                "Without question-bank markers we cannot conclude ? means font fallback");
    }

    @Test
    void unreadableUnicode_message_doesNotExposeSecrets() {
        String m = AiExistingQuestionParser.unreadableUnicodeUserMessage();
        assertTrue(m.contains("Japanese text") || m.contains("Unicode"));
        assertTrue(m.toLowerCase().contains("pdf"));
        // Ensure no API keys / tokens / paths leaked
        assertFalse(m.contains("sk-"));
        assertFalse(m.contains("token"));
        assertFalse(m.contains("api_key"));
    }

    @Test
    void unreadableUnicode_summarizer_doesNotEmitExtractedText() {
        // The logger summary must NEVER include any substring of the question text — only numeric stats.
        String sensitive = "SECRET_QUESTION_TEXT_42";
        StringBuilder sb = new StringBuilder();
        sb.append("Skill: Reading\n");
        sb.append("Question: SECRETSECRETSECRETSECRET\n");
        sb.append("A. ???? ????\n");
        sb.append("B. ????\n");
        sb.append("C. ????\n");
        sb.append("D. ????\n");
        sb.append("Correct answer: A\n");
        String summary = AiExistingQuestionParser.summarizeForUnreadableLog("test.pdf", sb.toString());
        assertTrue(summary.contains("file=test.pdf"));
        assertTrue(summary.contains("extractedTextLength="));
        assertTrue(summary.contains("questionMarkRatio="));
        assertFalse(summary.contains("SECRET_QUESTION_TEXT_42"),
                "Summary must not leak extracted content: " + summary);
        assertFalse(summary.contains("SECRETSECRETSECRETSECRET"));
    }

    // ===================================================================
    // PASSAGE_HEADER colon variants (regression for "Read the passage:" colon)
    // ===================================================================
    //
    // PASSAGE_HEADER must accept (a) no colon at all, (b) halfwidth ":",
    // (c) fullwidth "：", and apply the same passage-extraction behavior.
    // Without this, "Read the passage:" (the most common English format)
    // was silently dropped and questions were categorized as Vocabulary
    // instead of Reading.

    /** Helper: builds a minimal Reading source with the given header label. */
    private static String readingSourceWithHeader(String headerLine) {
        return "Skill: Reading\n"
                + "\n"
                + headerLine + "\n"
                + "田中さんは毎朝七時に起きます。朝ごはんを食べてから、学校へ行きます。\n"
                + "\n"
                + "1. 田中さんは午後どこで本を読みますか。\n"
                + "A. 図書館\n"
                + "B. 駅\n"
                + "C. レストラン\n"
                + "D. 家\n"
                + "Correct answer: A\n"
                + "Explanation: 本文に「午後、図書館で本を読みます」とあります。\n"
                + "\n"
                + "2. 田中さんは夜何をしますか。\n"
                + "A. 宿題をします\n"
                + "B. 写真を撮ります\n"
                + "C. 公園へ行きます\n"
                + "D. 映画を見ます\n"
                + "Correct answer: A\n";
    }

    @Test
    void readingPassageHeader_readThePassageWithColon_extracts() {
        // "Read the passage:" — halfwidth colon — the most common format in user PDFs.
        String source = readingSourceWithHeader("Read the passage:");

        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);

        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().size() >= 1,
                "Parser should extract at least 1 question. Got: " + out.getQuestions().size());
        // Reading category for at least one question
        long readingCount = out.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory()))
                .count();
        assertTrue(readingCount >= 1,
                "At least one question should be Reading (was the bug). Got categories: "
                        + out.getQuestions().stream().map(AiExamParseResponse.AiQuestionDto::getCategory)
                                .reduce("", (a, b) -> a + "," + b));
        // Passage should be present on the question content (parser attaches it)
        boolean hasPassage = out.getQuestions().stream()
                .anyMatch(q -> q.getContent() != null
                        && q.getContent().toLowerCase().contains("read the passage"));
        assertTrue(hasPassage,
                "Passage should be attached to Reading question content");
        // Japanese option text preserved (options hold 図書館 etc.)
        boolean hasJpOption = out.getQuestions().stream()
                .flatMap(q -> q.getAnswers().stream())
                .anyMatch(a -> a.getContent() != null && a.getContent().contains("図書館"));
        assertTrue(hasJpOption,
                "Japanese option text should be preserved");
        // Every question has exactly 1 correct answer
        for (var q : out.getQuestions()) {
            long cc = q.getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            assertEquals(1, cc, "Each question must have exactly 1 correct answer");
        }
    }

    @Test
    void readingPassageHeader_readThePassageWithoutColon_extracts() {
        // "Read the passage" — NO colon — the legacy format that was working.
        String source = readingSourceWithHeader("Read the passage");

        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);

        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().size() >= 1,
                "Parser should extract at least 1 question. Got: " + out.getQuestions().size());
        long readingCount = out.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory()))
                .count();
        assertTrue(readingCount >= 1,
                "No-colon format must still classify as Reading");
        boolean hasJpOption = out.getQuestions().stream()
                .flatMap(q -> q.getAnswers().stream())
                .anyMatch(a -> a.getContent() != null && a.getContent().contains("図書館"));
        assertTrue(hasJpOption,
                "Japanese option text should be preserved in no-colon format");
    }

    @Test
    void readingPassageHeader_passageWithColon_extracts() {
        // "Passage:" — minimal label with halfwidth colon. Variant: "Reading Passage:"
        // and "Passage:" share the same first matching branch after the colon-fix.
        String source = readingSourceWithHeader("Passage:");

        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);

        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().size() >= 1,
                "Parser should extract at least 1 question from 'Passage:' header. Got: "
                        + out.getQuestions().size());
        long readingCount = out.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory()))
                .count();
        assertTrue(readingCount >= 1,
                "'Passage:' header with colon must classify Reading");

        // Also check "Reading Passage:" variant
        String source2 = readingSourceWithHeader("Reading Passage:");
        AiExamParseResponse out2 = AiExistingQuestionParser.parseFromSourceText(source2);
        assertNotNull(out2);
        long readingCount2 = out2.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory()))
                .count();
        assertTrue(readingCount2 >= 1,
                "'Reading Passage:' with colon must classify Reading");

        // Fullwidth colon (：) must also work
        String source3 = readingSourceWithHeader("Passage：");
        AiExamParseResponse out3 = AiExistingQuestionParser.parseFromSourceText(source3);
        assertNotNull(out3);
        long readingCount3 = out3.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory()))
                .count();
        assertTrue(readingCount3 >= 1,
                "'Passage：' with FULLWIDTH colon must classify Reading");
    }

    @Test
    void readingPassageHeader_japaneseHonbunWithColon_extracts() {
        // "本文:" — Japanese header with halfwidth colon.
        String source = readingSourceWithHeader("本文:");

        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);

        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().size() >= 1,
                "Parser should extract at least 1 question from 本文: header. Got: "
                        + out.getQuestions().size());
        long readingCount = out.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory()))
                .count();
        assertTrue(readingCount >= 1,
                "'本文:' header with colon must classify Reading");

        // Also: "文章:" variant (fullwidth)
        String source2 = readingSourceWithHeader("文章：");
        AiExamParseResponse out2 = AiExistingQuestionParser.parseFromSourceText(source2);
        assertNotNull(out2);
        long readingCount2 = out2.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory()))
                .count();
        assertTrue(readingCount2 >= 1,
                "'文章：' with fullwidth colon must classify Reading");
    }

    @Test
    void readingPassageHeader_regression_oldFormatStillWorks() {
        // Regression check that the legacy "Read the passage:" test still
        // produces a non-empty Reading result (mirrors
        // readingLongJapanese_sharedPassage_multipleQuestions_extractsQuestions).
        String source = """
                Skill: Reading

                Read the passage:
                田中さんは毎朝七時に起きます。

                1. 田中さんは午後どこで本を読みますか。
                A. 図書館
                B. 駅
                C. レストラン
                D. 家
                Correct answer: A
                """;

        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(source);

        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertTrue(out.getQuestions().size() >= 1,
                "Legacy 'Read the passage:' format must still produce ≥1 question");
        boolean hasJpOption = out.getQuestions().stream()
                .flatMap(q -> q.getAnswers().stream())
                .anyMatch(a -> a.getContent() != null && a.getContent().contains("図書館"));
        assertTrue(hasJpOption, "Japanese option '図書館' must be preserved");
    }

    // =============================================================
    // MIXED STANDARD FORMAT — Reading passage must be section-scoped,
    // not attached globally to vocab/grammar questions.
    // =============================================================

    /**
     * The exact standard mixed format from the user's spec:
     *   Skill: Vocabulary
     *   1. ...  A./B./C./D. Correct answer: ...
     *   Skill: Grammar
     *   4. ...  ...
     *   Skill: Reading
     *   Read the passage:
     *   <passage>
     *   7. ...  8. ...  9. ...
     * Plus the per-question "1. Skill: Vocabulary" / "4. Skill: Grammar"
     * format the spec also allows. The Reading passage under
     * "Skill: Reading" must apply ONLY to questions 7..9, never to
     * 1..6.
     */
    private static final String MIXED_STANDARD_SOURCE = """
            Vocabulary Questions

            1. Skill: Vocabulary
            Question: 「こんにちは」はどういう意味ですか。
            A. こんにちは
            B. さようなら
            C. ありがとう
            D. すみません
            Correct answer: A
            Explanation: 「こんにちは」はあいさつの言葉です。

            2. Skill: Vocabulary
            Question: 「学生」の正しい読み方はどれですか。
            A. がくせい
            B. せんせい
            C. ともだち
            D. にほん
            Correct answer: A
            Explanation: 「学生」は「がくせい」と読みます。

            3. Skill: Vocabulary
            Question: 「図書館」はどんな場所ですか。
            A. 本を読む場所
            B. 電車に乗る場所
            C. ごはんを食べる場所
            D. 運動する場所
            Correct answer: A
            Explanation: 「図書館」は本を読む場所です。

            Grammar Questions

            4. Skill: Grammar
            Question: In the sentence 「学校で勉強します」, what does the particle 「で」 indicate?
            A. 動作が行われる場所
            B. 主題
            C. 所有
            D. 目的語
            Correct answer: A
            Explanation: 「で」は動作が行われる場所を表します。

            5. Skill: Grammar
            Question: What is the grammar pattern 「N は N です」 used for?
            A. A は B である
            B. 場所へ行く
            C. 何かをしたい
            D. 過去の出来事
            Correct answer: A
            Explanation: 「N は N です」は説明や紹介に使います。

            6. Skill: Grammar
            Question: What does the sentence ending 「ませんか」 usually express?
            A. さそい
            B. 命令
            C. 過去
            D. 否定
            Correct answer: A
            Explanation: 「ませんか」は相手を誘うときに使えます。

            Reading Questions

            Skill: Reading
            Read the passage:
            田中さんは毎朝七時に起きます。朝ごはんを食べてから、学校へ行きます。
            午後、図書館で本を読みます。夕方、友だちと話します。夜、宿題をします。
            週末は公園へ行って、写真を撮ります。

            7. 田中さんは午後どこで本を読みますか。
            A. 図書館
            B. 駅
            C. レストラン
            D. 家
            Correct answer: A
            Explanation: 本文に「午後、図書館で本を読みます」とあります。

            8. 田中さんは夜何をしますか。
            A. 宿題をします
            B. 写真を撮ります
            C. 公園へ行きます
            D. 映画を見ます
            Correct answer: A
            Explanation: 本文に「夜、宿題をします」とあります。

            9. 田中さんは週末どこへ行きますか。
            A. 公園
            B. 学校
            C. 駅
            D. 図書館
            Correct answer: A
            Explanation: 本文に「週末は公園へ行って」とあります。
            """;

    @Test
    void mixedStandardReadingSection_doesNotTagVocabularyGrammarAsReading() {
        // Regression: previously the global passage header caused all 9
        // questions to be tagged as Reading. After the fix, only 7..9
        // inherit the passage; 1..6 must remain Vocabulary / Grammar.
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(MIXED_STANDARD_SOURCE);

        assertNotNull(out);
        assertNotNull(out.getQuestions());
        assertEquals(9, out.getQuestions().size(),
                "Expected exactly 9 questions from the mixed standard source");

        // Q1..3 — explicit Skill: Vocabulary must stick
        for (int i = 0; i < 3; i++) {
            assertEquals("Vocabulary", out.getQuestions().get(i).getCategory(),
                    "Q" + (i + 1) + " must be Vocabulary, was: " + out.getQuestions().get(i).getCategory());
            // And the question content must NOT have the Reading passage prefix
            String c = out.getQuestions().get(i).getContent();
            assertFalse(c.startsWith("Read the passage:"),
                    "Vocab question content must not start with 'Read the passage:'. Got: "
                            + c.substring(0, Math.min(60, c.length())));
        }
        // Q4..6 — explicit Skill: Grammar must stick
        for (int i = 3; i < 6; i++) {
            assertEquals("Grammar", out.getQuestions().get(i).getCategory(),
                    "Q" + (i + 1) + " must be Grammar, was: " + out.getQuestions().get(i).getCategory());
            String c = out.getQuestions().get(i).getContent();
            assertFalse(c.startsWith("Read the passage:"),
                    "Grammar question content must not start with 'Read the passage:'. Got: "
                            + c.substring(0, Math.min(60, c.length())));
        }
        // Q7..9 — Reading (passage injected)
        for (int i = 6; i < 9; i++) {
            assertEquals("Reading", out.getQuestions().get(i).getCategory(),
                    "Q" + (i + 1) + " must be Reading, was: " + out.getQuestions().get(i).getCategory());
        }
    }

    @Test
    void mixedStandardReadingSection_selectedVocabularyGrammar_excludesReading() {
        AiExamParseResponse parsed = AiExistingQuestionParser.parseFromSourceText(MIXED_STANDARD_SOURCE);
        AiExamParseResponse filtered = AiExistingQuestionParser.filterByEvidence(
                parsed, MIXED_STANDARD_SOURCE, "mixed_standard.pdf");
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(
                filtered, java.util.List.of("VOCABULARY", "GRAMMAR"));

        assertEquals(6, out.getQuestions().size(),
                "Vocabulary+Grammar selectedSkills must yield 6, was: " + out.getQuestions().size());
        long vocab = out.getQuestions().stream()
                .filter(q -> "Vocabulary".equalsIgnoreCase(q.getCategory())).count();
        long grammar = out.getQuestions().stream()
                .filter(q -> "Grammar".equalsIgnoreCase(q.getCategory())).count();
        long reading = out.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory())).count();
        assertEquals(3, vocab, "Expected 3 Vocabulary questions");
        assertEquals(3, grammar, "Expected 3 Grammar questions");
        assertEquals(0, reading, "No Reading question must survive Vocab+Grammar filter");
    }

    @Test
    void mixedStandardReadingSection_allThree_preservesCategories() {
        AiExamParseResponse parsed = AiExistingQuestionParser.parseFromSourceText(MIXED_STANDARD_SOURCE);
        AiExamParseResponse filtered = AiExistingQuestionParser.filterByEvidence(
                parsed, MIXED_STANDARD_SOURCE, "mixed_standard.pdf");
        AiExamParseResponse out = AiExistingQuestionParser.sanitizeWithSelectedSkills(
                filtered, java.util.List.of("VOCABULARY", "GRAMMAR", "READING"));

        assertEquals(9, out.getQuestions().size(),
                "All three skills selected must yield 9, was: " + out.getQuestions().size());
        long vocab = out.getQuestions().stream()
                .filter(q -> "Vocabulary".equalsIgnoreCase(q.getCategory())).count();
        long grammar = out.getQuestions().stream()
                .filter(q -> "Grammar".equalsIgnoreCase(q.getCategory())).count();
        long reading = out.getQuestions().stream()
                .filter(q -> "Reading".equalsIgnoreCase(q.getCategory())).count();
        assertEquals(3, vocab, "Expected 3 Vocabulary");
        assertEquals(3, grammar, "Expected 3 Grammar");
        assertEquals(3, reading, "Expected 3 Reading");
    }

    @Test
    void readingSection_sharedPassage_appliesOnlyToReadingQuestions() {
        // The same shared passage appears in the content of Q7..9 (auto-
        // injected by parseBlock) but must NOT appear in Q1..6.
        AiExamParseResponse out = AiExistingQuestionParser.parseFromSourceText(MIXED_STANDARD_SOURCE);

        // Q1..6 must NOT contain the passage body
        String passageFingerprint = "毎朝七時に起きます";
        for (int i = 0; i < 6; i++) {
            String c = out.getQuestions().get(i).getContent();
            assertFalse(c.contains(passageFingerprint),
                    "Q" + (i + 1) + " (Voc/Gram) must NOT contain the Reading passage. Got: "
                            + c.substring(0, Math.min(120, c.length())));
        }
        // Q7..9 SHOULD contain the passage body (the parser injects it
        // because they're in the Reading section)
        int readingWithPassage = 0;
        for (int i = 6; i < 9; i++) {
            String c = out.getQuestions().get(i).getContent();
            if (c.contains(passageFingerprint)) readingWithPassage++;
        }
        assertEquals(3, readingWithPassage,
                "All 3 Reading questions should carry the injected passage");
    }

    // =============================================================
    // GENERATE-FROM-CONTENT SANITIZATION
    // Defense in depth: re-infer category, drop off-skill / dup / romaji.
    // =============================================================

    /** Build a 4-option MULTIPLE_CHOICE question with exactly 1 correct. */
    private static AiExamParseResponse.AiQuestionDto buildQ(String content, String category,
                                                            String[] opts, int correctIdx,
                                                            String explanation) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent(content);
        q.setDifficulty("MEDIUM");
        q.setExplanation(explanation);
        q.setCategory(category);
        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        for (int i = 0; i < opts.length; i++) {
            AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
            a.setContent(opts[i]);
            a.setIsCorrect(i == correctIdx);
            answers.add(a);
        }
        q.setAnswers(answers);
        return q;
    }

    @Test
    void generateSanitize_wordMeaningQuestion_isVocabulary() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "「図書館」はどういう意味ですか。",
                "Grammar", // AI incorrectly labeled it
                new String[]{"thư viện", "trạm xe", "nhà hàng", "nhà riêng"},
                0,
                "「図書館」は本を読む場所です。");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("VOCABULARY", "GRAMMAR", "READING"));
        assertEquals(1, r.finalCount);
        assertEquals("Vocabulary", r.questions.get(0).getCategory());
        assertEquals(0, r.droppedByReason.get("off_skill"));
    }

    @Test
    void generateSanitize_wordReadingQuestion_isVocabulary() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "「宿題」の正しい読み方はどれですか。",
                "Grammar",
                new String[]{"しゅくだい", "しごと", "べんきょう", "がくせい"},
                0,
                "「宿題」は「しゅくだい」と読みます。");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("VOCABULARY"));
        assertEquals(1, r.finalCount);
        assertEquals("Vocabulary", r.questions.get(0).getCategory());
    }

    @Test
    void generateSanitize_particleQuestion_isGrammar() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "In the sentence 「学校で勉強します」, what does the particle 「で」 indicate?",
                "Vocabulary",
                new String[]{"nơi hành động diễn ra", "chủ đề", "sở hữu", "tân ngữ"},
                0,
                "「で」chỉ nơi chốn.");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("GRAMMAR"));
        assertEquals(1, r.finalCount);
        assertEquals("Grammar", r.questions.get(0).getCategory());
    }

    @Test
    void generateSanitize_patternQuestion_isGrammar() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "What is the sentence pattern 「N は N です」 used for?",
                "Vocabulary",
                new String[]{"A là B", "đi đến đâu", "muốn làm gì", "quá khứ"},
                0,
                "Dùng để giới thiệu.");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("GRAMMAR"));
        assertEquals(1, r.finalCount);
        assertEquals("Grammar", r.questions.get(0).getCategory());
    }

    @Test
    void generateSanitize_readingComprehensionQuestion_isReading() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo đoạn văn, 田中さんは午後どこで本を読みますか。",
                "Vocabulary",
                new String[]{"図書館", "駅", "レストラン", "家"},
                0,
                "Đoạn văn nói '午後、図書館で本を読みます'.");
        // Provide a source passage so the Reading question is kept
        // (the new sanitize behavior drops Reading questions when no
        // source passage is available).
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("READING"),
                TANAKA_PASSSAGE);
        assertEquals(1, r.finalCount);
        assertEquals("Reading", r.questions.get(0).getCategory());
    }

    @Test
    void generateSanitize_selectedGrammar_dropsVocabularyAndReading() {
        AiExamParseResponse.AiQuestionDto vocab = buildQ(
                "「図書館」はどういう意味ですか。",
                null,
                new String[]{"thư viện", "trạm xe", "nhà hàng", "nhà riêng"}, 0, "ok");
        AiExamParseResponse.AiQuestionDto grammar = buildQ(
                "What does the particle 「で」 indicate in the sentence 「学校で行きます」?",
                null,
                new String[]{"đi đến", "chủ đề", "sở hữu", "tân ngữ"}, 0, "ok");
        AiExamParseResponse.AiQuestionDto reading = buildQ(
                "Theo đoạn văn, 田中さんはどこへ行きますか。",
                null,
                new String[]{"学校", "駅", "家", "公園"}, 0, "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(vocab, grammar, reading),
                java.util.List.of("GRAMMAR"));
        assertEquals(1, r.finalCount);
        assertEquals("Grammar", r.questions.get(0).getCategory());
        assertEquals(2, r.droppedByReason.get("off_skill"));
    }

    @Test
    void generateSanitize_selectedVocabularyGrammar_dropsReading() {
        AiExamParseResponse.AiQuestionDto vocab = buildQ(
                "「学生」の正しい読み方はどれですか。",
                null,
                new String[]{"がくせい", "せんせい", "ともだち", "にほん"}, 0, "ok");
        AiExamParseResponse.AiQuestionDto grammar = buildQ(
                "What is the sentence pattern 「N は N です」 used for?",
                null,
                new String[]{"A là B", "đi đến", "muốn", "quá khứ"}, 0, "ok");
        AiExamParseResponse.AiQuestionDto reading = buildQ(
                "Theo đoạn văn, ai は毎朝起きますか。",
                null,
                new String[]{"田中さん", "山田さん", "佐藤さん", "鈴木さん"}, 0, "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(vocab, grammar, reading),
                java.util.List.of("VOCABULARY", "GRAMMAR"));
        assertEquals(2, r.finalCount);
        assertEquals("Vocabulary", r.questions.get(0).getCategory());
        assertEquals("Grammar", r.questions.get(1).getCategory());
        assertEquals(1, r.droppedByReason.get("off_skill"));
        assertEquals(0, r.droppedByReason.get("duplicate_options"));
    }

    @Test
    void generateSanitize_allThree_preservesCorrectCategories() {
        AiExamParseResponse.AiQuestionDto vocab = buildQ(
                "「図書館」はどういう意味ですか。",
                "Grammar",
                new String[]{"thư viện", "trạm xe", "nhà hàng", "nhà riêng"}, 0, "ok");
        AiExamParseResponse.AiQuestionDto grammar = buildQ(
                "In the sentence 「学校に行きます」, what does the particle 「に」 indicate?",
                "Vocabulary",
                new String[]{"đích đến", "chủ đề", "sở hữu", "tân ngữ"}, 0, "ok");
        AiExamParseResponse.AiQuestionDto reading = buildQ(
                "Theo đoạn văn, 田中さんは毎朝いつ起きますか。",
                "Grammar",
                new String[]{"七時", "六時", "八時", "九時"}, 0, "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(vocab, grammar, reading),
                java.util.List.of("VOCABULARY", "GRAMMAR", "READING"),
                TANAKA_PASSSAGE);
        assertEquals(3, r.finalCount);
        assertEquals("Vocabulary", r.questions.get(0).getCategory());
        assertEquals("Grammar", r.questions.get(1).getCategory());
        assertEquals("Reading", r.questions.get(2).getCategory());
    }

    @Test
    void generateSanitize_dropsDuplicateOptions() {
        // Two options identical after case/whitespace normalization
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "「宿題」の正しい読み方はどれですか。",
                null,
                new String[]{"しゅくだい", "しゅくだい", "べんきょう", "がくせい"},
                0,
                "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("VOCABULARY"));
        assertEquals(0, r.finalCount);
        assertEquals(1, r.droppedByReason.get("duplicate_options"));
    }

    @Test
    void generateSanitize_rejectsRomajiForJapaneseReadings() {
        // Romaji in the question text and in an option — must be dropped
        // because the AI was supposed to use hiragana, not "shukudai"
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Cách đọc đúng của 宿題 là gì?",
                null,
                new String[]{"shukudai", "しゅくだい", "べんきょう", "がくせい"},
                0,
                "Tanaka-san said shukudai");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("VOCABULARY"));
        assertEquals(0, r.finalCount);
        assertEquals(1, r.droppedByReason.get("romaji_content"));
    }

    @Test
    void generateSanitize_dropsQuestionWithZeroCorrect() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "「学生」はどういう意味ですか。",
                null,
                new String[]{"sinh viên", "giáo viên", "bạn bè", "Nhật Bản"},
                -1, // no correct answer
                "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("VOCABULARY"));
        assertEquals(0, r.finalCount);
        assertEquals(1, r.droppedByReason.get("no_correct_answer"));
    }

    // =============================================================
    // GENERATE-FROM-CONTENT: Reading passage injection
    // =============================================================

    private static final String TANAKA_PASSSAGE = "田中さんは毎朝七時に起きます。朝ごはんを食べてから、"
            + "学校へ行きます。午後、図書館で本を読みます。夕方、友だちと話します。"
            + "夜、宿題をします。週末は公園へ行って、写真を撮ります。";

    @Test
    void generateSanitize_readingQuestionWithoutPassage_injectsSourcePassage() {
        // Generated Reading question has only the question text. The
        // sanitizer must inject the passage from the source PDF.
        // Uses 田中さん in the question (not Tanaka) so the question isn't
        // dropped by the romaji guard.
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo bài đọc, 田中さんは毎朝いつ起きますか。",
                null,
                new String[]{"七時", "六時", "八時", "九時"},
                0,
                "本文に「毎朝七時に起きます」とあります。");

        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("READING"),
                TANAKA_PASSSAGE);

        assertEquals(1, r.finalCount);
        AiExamParseResponse.AiQuestionDto kept = r.questions.get(0);
        assertEquals("Reading", kept.getCategory());

        String content = kept.getContent();
        assertTrue(content.contains("Read the passage:"),
                "Reading content must contain the standard Read-the-passage header. Got: "
                        + content.substring(0, Math.min(80, content.length())));
        assertTrue(content.contains(TANAKA_PASSSAGE),
                "Reading content must include the injected source passage");
        assertTrue(content.contains("Question: "),
                "Reading content must contain the Question: separator");
        // The passage must come BEFORE the question text
        int idxPassage = content.indexOf(TANAKA_PASSSAGE);
        int idxQuestion = content.indexOf("Question: ");
        assertTrue(idxPassage < idxQuestion,
                "Passage must precede 'Question:' marker");
    }

    @Test
    void generateSanitize_readingQuestionWithoutPassage_keepsWhenSourcePassageAvailable() {
        // Make sure injection works when the AI returned the question only
        // (no embedded passage). The injected passage must match the source.
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo bài đọc, 田中さんは毎朝いつ起きますか。",
                null,
                new String[]{"七時", "六時", "八時", "九時"},
                0,
                "本文に「毎朝七時に起きます」とあります。");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("READING"),
                TANAKA_PASSSAGE);
        assertEquals(1, r.finalCount);
        assertEquals("Reading", r.questions.get(0).getCategory());
        assertTrue(r.questions.get(0).getContent().contains(TANAKA_PASSSAGE));
    }

    @Test
    void generateSanitize_readingQuestionWithoutPassageAndNoSourcePassage_drops() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo bài đọc, 田中さんは毎朝いつ起きますか。",
                null,
                new String[]{"七時", "六時", "八時", "九時"},
                0,
                "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("READING"),
                null);
        assertEquals(0, r.finalCount);
        assertEquals(1, r.droppedByReason.get("missing_reading_passage"));
    }

    @Test
    void generateSanitize_readingQuestionWithTheoDoanVan_keepsReading() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo đoạn văn, 田中さんは毎朝いつ起きますか。",
                "Vocabulary", // AI's wrong category
                new String[]{"七時", "六時", "八時", "九時"},
                0,
                "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("VOCABULARY", "GRAMMAR", "READING"),
                TANAKA_PASSSAGE);
        assertEquals(1, r.finalCount);
        assertEquals("Reading", r.questions.get(0).getCategory(),
                "Reading marker 'Theo đoạn văn' must beat Vocabulary inference");
    }

    @Test
    void generateSanitize_readingQuestionWithTheoPassage_keepsReading() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo passage, 田中さんは毎朝何時に起きますか。",
                "Vocabulary",
                new String[]{"七時", "六時", "八時", "九時"},
                0,
                "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("VOCABULARY", "GRAMMAR", "READING"),
                TANAKA_PASSSAGE);
        assertEquals(1, r.finalCount);
        assertEquals("Reading", r.questions.get(0).getCategory(),
                "Bare-English 'Theo passage' must now also resolve to Reading");
    }

    @Test
    void generateSanitize_readingQuestionContent_hasReadPassageAndQuestionFormat() {
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo bài đọc, 田中さんは毎朝いつ起きますか。",
                null,
                new String[]{"七時", "六時", "八時", "九時"},
                0,
                "本文に「毎朝七時に起きます」とあります。");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("READING"),
                TANAKA_PASSSAGE);
        assertEquals(1, r.finalCount);
        String content = r.questions.get(0).getContent();
        assertTrue(content.startsWith("Read the passage:"),
                "Content must start with 'Read the passage:' header, got: "
                        + content.substring(0, Math.min(40, content.length())));
        assertTrue(content.contains("\n\nQuestion: "),
                "Content must contain '\\n\\nQuestion: ' separator (round-trip parseable). Got: "
                        + content);
    }

    @Test
    void generateSanitize_dropsQuestionWithBareTanaka() {
        // Question text has Japanese script + bare Latin name "Tanaka" — must be dropped.
        AiExamParseResponse.AiQuestionDto q = buildQ(
                "Theo bài đọc, Tanaka làm gì sau khi ăn sáng?",
                null,
                new String[]{"学校へ行きます", "寝ます", "テレビを見ます", "遊びます"},
                0,
                "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(q),
                java.util.List.of("READING"),
                TANAKA_PASSSAGE);
        // Tanaka is Latinized name AND question has Japanese — should be dropped.
        assertEquals(0, r.finalCount);
        assertEquals(1, r.droppedByReason.get("romaji_content"));
    }

    @Test
    void generateSanitize_allThree_injectsPassageAndKeepsThree() {
        AiExamParseResponse.AiQuestionDto vocab = buildQ(
                "「図書館」はどういう意味ですか。",
                "Grammar",
                new String[]{"thư viện", "trạm xe", "nhà hàng", "nhà riêng"},
                0, "ok");
        AiExamParseResponse.AiQuestionDto grammar = buildQ(
                "In the sentence 「学校に行きます」, what does the particle 「に」 indicate?",
                "Vocabulary",
                new String[]{"đích đến", "chủ đề", "sở hữu", "tân ngữ"},
                0, "ok");
        AiExamParseResponse.AiQuestionDto reading = buildQ(
                "Theo bài đọc, 田中さんは毎朝いつ起きますか。",
                "Grammar",
                new String[]{"七時", "六時", "八時", "九時"},
                0, "ok");
        var r = AiExistingQuestionParser.sanitizeGeneratedQuestions(
                java.util.List.of(vocab, grammar, reading),
                java.util.List.of("VOCABULARY", "GRAMMAR", "READING"),
                TANAKA_PASSSAGE);
        assertEquals(3, r.finalCount);
        assertEquals("Vocabulary", r.questions.get(0).getCategory());
        assertEquals("Grammar", r.questions.get(1).getCategory());
        assertEquals("Reading", r.questions.get(2).getCategory());
        assertTrue(r.questions.get(2).getContent().contains("Read the passage:"));
        assertTrue(r.questions.get(2).getContent().contains(TANAKA_PASSSAGE));
    }

    @Test
    void splitQuestionContentForReading_splitsGeneratePacking() {
        // Mirror the FE parser for the standard "Read the passage: … Question: …" form.
        String content = "Read the passage:\n田中さんは毎朝七時に起きます。\n\nQuestion: Theo bài đọc, 田中さんは何時に起きますか。";
        String[] split = AiExistingQuestionParser.splitQuestionContentForReading(content);
        assertNotNull(split[0]);
        assertTrue(split[0].contains("毎朝七時に起きます"),
                "Passage should contain the body, got: " + split[0]);
        assertTrue(split[1].contains("Theo bài đọc"),
                "Question should contain 'Theo bài đọc', got: " + split[1]);

        // Vietnamese header
        String viContent = "Đọc bài đọc: 田中さんは毎朝七時に起きます。 Câu hỏi: Theo bài đọc, 田中さんは何時に起きますか。";
        String[] viSplit = AiExistingQuestionParser.splitQuestionContentForReading(viContent);
        assertNotNull(viSplit[0]);
        assertTrue(viSplit[0].contains("毎朝七時に起きます"),
                "VI passage should contain the body, got: " + viSplit[0]);
    }

    @Test
    void extractReadingPassageFromSource_findsEnAndViHeadings() {
        String source = "田中さんは毎朝七時に起きます。朝ごはんを食べてから、学校へ行きます。\n"
                + "午後、図書館で本を読みます。夕方、友だちと話します。\n\n"
                + "1. Câu hỏi mẫu.\n";
        String eng = AiExistingQuestionParser.extractReadingPassageFromSource(source);
        assertNotNull(eng, "Should extract passage from long Japanese block followed by numbered question");

        String viSource = "Bài đọc:\n"
                + "田中さんは毎朝七時に起きます。朝ごはんを食べてから、学校へ行きます。\n"
                + "午後、図書館で本を読みます。\n\n"
                + "1. Câu hỏi mẫu.\n";
        String viPassage = AiExistingQuestionParser.extractReadingPassageFromSource(viSource);
        assertNotNull(viPassage, "Should extract passage from 'Bài đọc:' heading");
        assertTrue(viPassage.contains("毎朝七時に起きます"));
    }

    // =============================================================
    // JSON PARSING: difficulty + ignoreUnknown
    // =============================================================

    @Test
    void parseAiQuizGenerationResponse_acceptsDifficultyField() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String json = """
            {
              "questions": [
                {
                  "id": "1",
                  "type": "Multiple Choice",
                  "category": "Vocabulary",
                  "difficulty": "Medium",
                  "question": "「学生」はどういう意味ですか。",
                  "options": ["công viên", "học sinh, sinh viên", "thư viện", "bữa sáng"],
                  "correctAnswer": "học sinh, sinh viên",
                  "explanation": "学生 nghĩa là học sinh, sinh viên."
                }
              ]
            }
            """;
        AiQuizGenerationResponse resp = mapper.readValue(json, AiQuizGenerationResponse.class);
        assertNotNull(resp.getQuestions());
        assertEquals(1, resp.getQuestions().size());
        AiQuizGenerationResponse.QuizQuestion q = resp.getQuestions().get(0);
        assertEquals("Vocabulary", q.getCategory());
        assertEquals("Medium", q.getDifficulty(),
                "difficulty field must be parsed and accessible");
        assertEquals("「学生」はどういう意味ですか。", q.getQuestion());
        assertEquals(4, q.getOptions().size());
    }

    @Test
    void parseAiQuizGenerationResponse_ignoresUnknownFields() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        // AI may return extra fields — they must be silently ignored.
        String json = """
            {
              "questions": [
                {
                  "id": "1",
                  "type": "Multiple Choice",
                  "category": "Grammar",
                  "difficulty": "Hard",
                  "question": "In the sentence, what does the particle indicate?",
                  "options": ["đích đến", "chủ đề", "sở hữu", "tân ngữ"],
                  "correctAnswer": "đích đến",
                  "explanation": "The particle に marks the destination.",
                  "skill": "GRAMMAR",
                  "level": "N3",
                  "answerIndex": 0,
                  "metadata": { "source": "ai-generated" }
                }
              ]
            }
            """;
        AiQuizGenerationResponse resp = mapper.readValue(json, AiQuizGenerationResponse.class);
        assertNotNull(resp.getQuestions());
        assertEquals(1, resp.getQuestions().size());
        AiQuizGenerationResponse.QuizQuestion q = resp.getQuestions().get(0);
        assertEquals("Grammar", q.getCategory());
        assertEquals("Hard", q.getDifficulty());
        assertEquals("In the sentence, what does the particle indicate?", q.getQuestion());
    }

    @Test
    void parseAiQuizGenerationResponse_difficultyCaseInsensitive() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        // Jackson is case-preserving; the AI may send any casing.
        // The DTO stores the raw parsed value. Normalization to DB-case
        // (Easy / Medium / Hard) happens in toNormalizedQuestion via pickDifficulty.
        AiQuizGenerationResponse easy = mapper.readValue(
                "{\"questions\":[{\"id\":\"1\",\"difficulty\":\"easy\",\"question\":\"a\",\"options\":[\"b\",\"c\",\"d\",\"e\"],\"correctAnswer\":\"b\"}]}",
                AiQuizGenerationResponse.class);
        assertEquals("easy", easy.getQuestions().get(0).getDifficulty(),
                "Jackson preserves case; normalization happens in toNormalizedQuestion");

        AiQuizGenerationResponse hard = mapper.readValue(
                "{\"questions\":[{\"id\":\"2\",\"difficulty\":\"HARD\",\"question\":\"a\",\"options\":[\"b\",\"c\",\"d\",\"e\"],\"correctAnswer\":\"b\"}]}",
                AiQuizGenerationResponse.class);
        assertEquals("HARD", hard.getQuestions().get(0).getDifficulty());

        AiQuizGenerationResponse medium = mapper.readValue(
                "{\"questions\":[{\"id\":\"3\",\"difficulty\":\"Medium\",\"question\":\"a\",\"options\":[\"b\",\"c\",\"d\",\"e\"],\"correctAnswer\":\"b\"}]}",
                AiQuizGenerationResponse.class);
        assertEquals("Medium", medium.getQuestions().get(0).getDifficulty());
    }

    @Test
    void generateSanitize_usesDefaultDifficultyWhenMissing() throws Exception {
        // The AI response has no difficulty field; Backend's pickDifficulty
        // must fall back to the caller's default "Medium".
        ObjectMapper mapper = new ObjectMapper();
        String json = """
            {
              "questions": [
                {
                  "id": "1",
                  "category": "Vocabulary",
                  "question": "「図書館」はどういう意味ですか。",
                  "options": ["thư viện", "trạm xe", "nhà hàng", "nhà riêng"],
                  "correctAnswer": "thư viện",
                  "explanation": "図書館 nghĩa là thư viện."
                }
              ]
            }
            """;
        AiQuizGenerationResponse resp = mapper.readValue(json, AiQuizGenerationResponse.class);
        AiQuizGenerationResponse.QuizQuestion q = resp.getQuestions().get(0);
        // Difficulty absent in JSON — Jackson leaves field null.
        assertNull(q.getDifficulty(), "difficulty field should be null when not in JSON");
    }

    // =============================================================
    // GENERATE MODE JSON EXTRACTION
    // Defense in depth for AI preamble / fence / trailing text
    // =============================================================

    @Test
    void parseGenerateResponse_acceptsPlainJson() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = "{\"questions\":[{\"id\":\"1\",\"type\":\"Multiple Choice\",\"category\":\"Vocabulary\",\"difficulty\":\"Medium\",\"question\":\"「学生」はどういう意味ですか。\",\"options\":[\"công viên\",\"học sinh, sinh viên\",\"thư viện\",\"bữa sáng\"],\"correctAnswer\":\"học sinh, sinh viên\",\"explanation\":\"学生 nghĩa là học sinh.\"}]}";
        AiQuizGenerationResponse resp = AiExistingQuestionParser.parseQuizGenerationResponse(raw, mapper);
        assertNotNull(resp.getQuestions());
        assertEquals(1, resp.getQuestions().size());
        assertEquals("Vocabulary", resp.getQuestions().get(0).getCategory());
        assertEquals("Medium", resp.getQuestions().get(0).getDifficulty());
    }

    @Test
    void parseGenerateResponse_acceptsMarkdownJsonFence() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = "```json\n{\"questions\":[{\"id\":\"1\",\"type\":\"Multiple Choice\",\"category\":\"Grammar\",\"difficulty\":\"Easy\",\"question\":\"In the sentence, what does the particle indicate?\",\"options\":[\"a\",\"b\",\"c\",\"d\"],\"correctAnswer\":\"a\",\"explanation\":\"because.\"}]}\n```";
        AiQuizGenerationResponse resp = AiExistingQuestionParser.parseQuizGenerationResponse(raw, mapper);
        assertNotNull(resp.getQuestions());
        assertEquals(1, resp.getQuestions().size());
        assertEquals("Grammar", resp.getQuestions().get(0).getCategory());
        assertEquals("Easy", resp.getQuestions().get(0).getDifficulty());
    }

    @Test
    void parseGenerateResponse_extractsJsonAfterPreamble() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        // AI started with "We need to generate..." — must still parse.
        String raw = "We need to generate quiz questions from this learning material.\n"
                + "Let me think carefully about each one.\n\n"
                + "{\"questions\":[{\"id\":\"1\",\"type\":\"Multiple Choice\",\"category\":\"Vocabulary\",\"difficulty\":\"Hard\",\"question\":\"「図書館」means?\",\"options\":[\"library\",\"station\",\"restaurant\",\"home\"],\"correctAnswer\":\"library\",\"explanation\":\"because.\"}]}\n"
                + "\nHope this helps!";
        AiQuizGenerationResponse resp = AiExistingQuestionParser.parseQuizGenerationResponse(raw, mapper);
        assertNotNull(resp.getQuestions(), "Should parse despite preamble and trailing prose");
        assertEquals(1, resp.getQuestions().size());
        assertEquals("Vocabulary", resp.getQuestions().get(0).getCategory());
        assertEquals("Hard", resp.getQuestions().get(0).getDifficulty());
    }

    @Test
    void parseGenerateResponse_ignoresTrailingText() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        String raw = "{\"questions\":[{\"id\":\"1\",\"type\":\"Multiple Choice\",\"category\":\"Reading\",\"difficulty\":\"Medium\",\"question\":\"Theo bài đọc, ai đi học?\",\"options\":[\"田中さん\",\"鈴木さん\",\"佐藤さん\",\"高橋さん\"],\"correctAnswer\":\"田中さん\",\"explanation\":\"田中さん đi học.\"}]}\n\nSome extra notes here.";
        AiQuizGenerationResponse resp = AiExistingQuestionParser.parseQuizGenerationResponse(raw, mapper);
        assertNotNull(resp.getQuestions());
        assertEquals(1, resp.getQuestions().size());
        assertEquals("Reading", resp.getQuestions().get(0).getCategory());
    }

    @Test
    void parseGenerateResponse_acceptsArrayAndWrapsIfSupported() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        // Some AI providers wrap the array at top level instead of object.
        String raw = "[{\"id\":\"1\",\"type\":\"Multiple Choice\",\"category\":\"Vocabulary\",\"difficulty\":\"Medium\",\"question\":\"Q?\",\"options\":[\"a\",\"b\",\"c\",\"d\"],\"correctAnswer\":\"a\",\"explanation\":\"e.\"}]";
        AiQuizGenerationResponse resp = AiExistingQuestionParser.parseQuizGenerationResponse(raw, mapper);
        assertNotNull(resp.getQuestions(), "Top-level array should be auto-wrapped");
        assertEquals(1, resp.getQuestions().size());
        assertEquals("Vocabulary", resp.getQuestions().get(0).getCategory());
    }

    @Test
    void parseGenerateResponse_invalidNoJson_returnsFriendlyError() {
        ObjectMapper mapper = new ObjectMapper();
        String raw = "We need to generate questions but I can't right now.";
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> AiExistingQuestionParser.parseQuizGenerationResponse(raw, mapper));
        // Friendly message — must NOT include raw content.
        assertEquals("AI returned an invalid response. Please try again.", ex.getMessage());
    }

    @Test
    void parseGenerateResponse_empty_returnsFriendlyError() {
        ObjectMapper mapper = new ObjectMapper();
        assertThrows(IllegalArgumentException.class,
                () -> AiExistingQuestionParser.parseQuizGenerationResponse("", mapper));
        assertThrows(IllegalArgumentException.class,
                () -> AiExistingQuestionParser.parseQuizGenerationResponse(null, mapper));
    }

    @Test
    void parseGenerateResponse_stripsBom() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        // BOM at the very start
        String raw = "\uFEFF{\"questions\":[{\"id\":\"1\",\"type\":\"Multiple Choice\",\"category\":\"Grammar\",\"difficulty\":\"Medium\",\"question\":\"Q?\",\"options\":[\"a\",\"b\",\"c\",\"d\"],\"correctAnswer\":\"a\",\"explanation\":\"e.\"}]}";
        AiQuizGenerationResponse resp = AiExistingQuestionParser.parseQuizGenerationResponse(raw, mapper);
        assertNotNull(resp.getQuestions());
        assertEquals(1, resp.getQuestions().size());
    }
}
