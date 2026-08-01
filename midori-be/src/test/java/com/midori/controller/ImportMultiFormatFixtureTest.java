package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.service.AiLearningContentService;
import com.midori.service.PdfTextExtractor;
import com.midori.validation.QuestionBankCompatibilityValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Deterministic fixture tests for Import Existing Questions pipeline.
 * Simulates MIDORI_N5_Mixed_Vocabulary_Grammar_Reading_MultiFormat.pdf with 18 questions:
 * Skills: Vocabulary x6, Grammar x6, Reading x6
 * Formats: MULTIPLE_CHOICE x6, TRUE_FALSE x4, FILL_BLANK x5, SHORT_ANSWER x3
 * No live AI calls.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ImportMultiFormatFixtureTest {

    // PDF text fixture containing all question/option/answer content
    private static final String PDF_TEXT =
        "MIDORI N5 Mixed Question Bank\n\n" +
        // VOCABULARY MCQ x3
        "1. What is the meaning of kotoshikan?\nA. Library\nB. Hospital\nC. School\nD. Park\nCorrect answer: A\n\n" +
        "2. Choose the correct reading of gakusei.\nA. gakusei-reading\nB. sensei-reading\nC. kaisha-reading\nD. gakkou-reading\nCorrect answer: A\n\n" +
        "3. What does denwa mean?\nA. Television\nB. Telephone\nC. Computer\nD. Radio\nCorrect answer: B\n\n" +
        // VOCABULARY FILL_BLANK x2
        "4. Fill in the blank: I go to ___ (bookstore).\nCorrect Text: honya\n\n" +
        "5. Fill in the blank: ___ is cat in Japanese.\nCorrect Text: neko\n\n" +
        // VOCABULARY SHORT_ANSWER x1
        "6. What is the Japanese word for water?\nReference Answer: mizu\n\n" +
        // GRAMMAR MCQ x2
        "7. Choose the correct particle for: I am a student.\nA. wa\nB. ga\nC. de\nD. ni\nCorrect answer: A\n\n" +
        "8. Choose the correct particle: Go to Tokyo.\nA. ni\nB. wa\nC. wo\nD. no\nCorrect answer: A\n\n" +
        // GRAMMAR TRUE_FALSE x2
        "9. True/False: masu is a polite verb ending.\nCorrect answer: True\n\n" +
        "10. True/False: Particle wo marks the subject of a sentence.\nCorrect answer: False\n\n" +
        // GRAMMAR FILL_BLANK x1
        "11. Fill in the blank: I eat ___ every day. (particle)\nCorrect Text: wo\n\n" +
        // GRAMMAR SHORT_ANSWER x1
        "12. What does masen ka express?\nReference Answer: A polite invitation or suggestion\n\n" +
        // READING MCQ x1
        "Reading Passage: Tanaka-san drinks coffee every morning. Tanaka-san loves coffee.\n" +
        "13. What does Tanaka-san drink every morning?\nA. Coffee\nB. Tea\nC. Water\nD. Juice\nCorrect answer: A\n\n" +
        // READING TRUE_FALSE x2
        "Reading Passage: Yamada-san reads books in the library.\n" +
        "14. True/False: Yamada-san reads books in the library.\nCorrect answer: True\n\n" +
        "15. True/False: Yamada-san reads books at school.\nCorrect answer: False\n\n" +
        // READING FILL_BLANK x2
        "Reading Passage: Sato-san teaches at school.\n" +
        "16. Fill in the blank: Sato-san teaches at ___.\nCorrect Text: school\n\n" +
        "Reading Passage: Suzuki-san walks in the park every day.\n" +
        "17. Fill in the blank: Suzuki-san walks in the ___.\nCorrect Text: park\n\n" +
        // READING SHORT_ANSWER x1
        "Reading Passage: Suzuki-san walks in the park every day.\n" +
        "18. Where does Suzuki-san walk every day?\nReference Answer: park\n";

    /** Build the mocked 18-question AI response fixture. */
    private static AiExamParseResponse buildFixtureAiResponse() {
        AiExamParseResponse resp = new AiExamParseResponse();
        resp.setTitle("MIDORI N5 Mixed Question Bank");
        resp.setDescription("Mixed skills and formats N5");
        List<AiExamParseResponse.AiQuestionDto> questions = new ArrayList<>();

        // VOCABULARY MCQ x3
        questions.add(makeMcq("What is the meaning of kotoshikan?", "Vocabulary", new String[]{"Library","Hospital","School","Park"}, 0));
        questions.add(makeMcq("Choose the correct reading of gakusei.", "Vocabulary", new String[]{"gakusei-reading","sensei-reading","kaisha-reading","gakkou-reading"}, 0));
        questions.add(makeMcq("What does denwa mean?", "Vocabulary", new String[]{"Television","Telephone","Computer","Radio"}, 1));
        // VOCABULARY FILL_BLANK x2
        questions.add(makeFillBlank("Fill in the blank: I go to ___ (bookstore).", "Vocabulary", "honya"));
        questions.add(makeFillBlank("Fill in the blank: ___ is cat in Japanese.", "Vocabulary", "neko"));
        // VOCABULARY SHORT_ANSWER x1
        questions.add(makeShortAnswer("What is the Japanese word for water?", "Vocabulary", "mizu"));

        // GRAMMAR MCQ x2
        questions.add(makeMcq("Choose the correct particle for: I am a student.", "Grammar", new String[]{"wa","ga","de","ni"}, 0));
        questions.add(makeMcq("Choose the correct particle: Go to Tokyo.", "Grammar", new String[]{"ni","wa","wo","no"}, 0));
        // GRAMMAR TRUE_FALSE x2
        questions.add(makeTrueFalse("masu is a polite verb ending.", "Grammar", true));
        questions.add(makeTrueFalse("Particle wo marks the subject of a sentence.", "Grammar", false));
        // GRAMMAR FILL_BLANK x1
        questions.add(makeFillBlank("Fill in the blank: I eat ___ every day. (particle)", "Grammar", "wo"));
        // GRAMMAR SHORT_ANSWER x1
        questions.add(makeShortAnswer("What does masen ka express?", "Grammar", "A polite invitation or suggestion"));

        // READING MCQ x1
        questions.add(makeMcq("Reading Passage: Tanaka-san drinks coffee every morning.\n\nWhat does Tanaka-san drink every morning?", "Reading", new String[]{"Coffee","Tea","Water","Juice"}, 0));
        // READING TRUE_FALSE x2
        questions.add(makeTrueFalse("Reading Passage: Yamada-san reads books in the library.\n\nYamada-san reads books in the library.", "Reading", true));
        questions.add(makeTrueFalse("Yamada-san reads books at school.", "Reading", false));
        // READING FILL_BLANK x2
        questions.add(makeFillBlank("Reading Passage: Sato-san teaches at school.\n\nFill in the blank: Sato-san teaches at ___.", "Reading", "school"));
        questions.add(makeFillBlank("Reading Passage: Suzuki-san walks in the park every day.\n\nFill in the blank: Suzuki-san walks in the ___.", "Reading", "park"));
        // READING SHORT_ANSWER x1
        questions.add(makeShortAnswer("Reading Passage: Suzuki-san walks in the park every day.\n\nWhere does Suzuki-san walk every day?", "Reading", "park"));

        resp.setQuestions(questions);
        return resp;
    }

    // ── Builder helpers ──────────────────────────────────────────
    private static AiExamParseResponse.AiQuestionDto makeMcq(String content, String category, String[] options, int correctIdx) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE"); q.setContent(content); q.setCategory(category); q.setDifficulty("MEDIUM"); q.setExplanation("");
        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        for (int i = 0; i < options.length; i++) { AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto(); a.setContent(options[i]); a.setIsCorrect(i == correctIdx); answers.add(a); }
        q.setAnswers(answers); return q;
    }
    private static AiExamParseResponse.AiQuestionDto makeTrueFalse(String content, String category, boolean trueIsCorrect) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("TRUE_FALSE"); q.setContent(content); q.setCategory(category); q.setDifficulty("EASY"); q.setExplanation("");
        AiExamParseResponse.AiAnswerDto t = new AiExamParseResponse.AiAnswerDto(); t.setContent("True"); t.setIsCorrect(trueIsCorrect);
        AiExamParseResponse.AiAnswerDto f = new AiExamParseResponse.AiAnswerDto(); f.setContent("False"); f.setIsCorrect(!trueIsCorrect);
        q.setAnswers(List.of(t, f)); return q;
    }
    private static AiExamParseResponse.AiQuestionDto makeFillBlank(String content, String category, String answer) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("FILL_BLANK"); q.setContent(content); q.setCategory(category); q.setDifficulty("MEDIUM"); q.setExplanation("");
        AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto(); a.setContent(answer); a.setIsCorrect(true);
        q.setAnswers(List.of(a)); return q;
    }
    private static AiExamParseResponse.AiQuestionDto makeShortAnswer(String content, String category, String refAnswer) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("SHORT_ANSWER"); q.setContent(content); q.setCategory(category); q.setDifficulty("MEDIUM"); q.setExplanation("");
        AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto(); a.setContent(refAnswer); a.setIsCorrect(true);
        q.setAnswers(List.of(a)); return q;
    }

    private MockMvc mockMvc;
    @Mock private PdfTextExtractor pdfTextExtractor;
    @Mock private AiCoreService aiCoreService;
    @Mock private AiLearningContentService aiLearningContentService;
    private AiPdfPreviewController controller;

    @BeforeEach
    void setUp() throws Exception {
        controller = new AiPdfPreviewController(pdfTextExtractor, aiCoreService, aiLearningContentService, new QuestionBankCompatibilityValidator());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(PDF_TEXT, List.of(PDF_TEXT), false, 5);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);
        when(aiCoreService.parseExistingQuestionsFromText(any(), any(), any())).thenReturn(buildFixtureAiResponse());
    }

    @Test
    void assert1_18RawQuestionsInFixture() {
        assertThat(buildFixtureAiResponse().getQuestions()).hasSize(18);
    }

    @Test
    void assert2_3_autoDetectAllSkills_18Questions() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile("file", "MIDORI_N5_Mixed.pdf", "application/pdf", PDF_TEXT.getBytes());
        MvcResult result = mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdf).param("mode", "IMPORT_EXISTING_QUESTIONS")
                        .param("targetSkills", "VOCABULARY").param("targetSkills", "GRAMMAR").param("targetSkills", "READING")
                        .param("questionFormats", "AUTO_DETECT"))
                .andExpect(status().isOk()).andReturn();
        com.fasterxml.jackson.databind.JsonNode questions = new ObjectMapper().readTree(result.getResponse().getContentAsString()).get("data").get("questions");
        assertThat(questions).isNotNull();
        assertThat(questions.size()).isEqualTo(18);
    }

    @Test
    void assert3_skillCounts() {
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(buildFixtureAiResponse(), List.of("VOCABULARY", "GRAMMAR", "READING"));
        assertThat(s.getQuestions().stream().filter(q -> "Vocabulary".equals(q.getCategory())).count()).isEqualTo(6);
        assertThat(s.getQuestions().stream().filter(q -> "Grammar".equals(q.getCategory())).count()).isEqualTo(6);
        assertThat(s.getQuestions().stream().filter(q -> "Reading".equals(q.getCategory())).count()).isEqualTo(6);
    }

    @Test
    void assert4_formatCounts() {
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(buildFixtureAiResponse(), List.of("VOCABULARY", "GRAMMAR", "READING"));
        assertThat(s.getQuestions().stream().filter(q -> "MULTIPLE_CHOICE".equals(q.getType())).count()).isEqualTo(6);
        assertThat(s.getQuestions().stream().filter(q -> "TRUE_FALSE".equals(q.getType())).count()).isEqualTo(4);
        assertThat(s.getQuestions().stream().filter(q -> "FILL_BLANK".equals(q.getType())).count()).isEqualTo(5);
        assertThat(s.getQuestions().stream().filter(q -> "SHORT_ANSWER".equals(q.getType())).count()).isEqualTo(3);
    }

    @Test
    void assert5_noOptionPrefixDuplication() {
        AiExamParseResponse resp = new AiExamParseResponse();
        resp.setQuestions(List.of(makeMcq("What does denwa mean?", "Vocabulary", new String[]{"A. Television","B. Telephone","C. Computer","D. Radio"}, 1)));
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(resp, List.of("VOCABULARY"));
        assertThat(s.getQuestions()).hasSize(1);
        for (AiExamParseResponse.AiAnswerDto a : s.getQuestions().get(0).getAnswers()) {
            assertThat(a.getContent()).doesNotMatch("^[A-Da-d][.)\\s].*");
        }
        assertThat(s.getQuestions().get(0).getAnswers().get(0).getContent()).isEqualTo("Television");
    }

    @Test
    void assert5b_stripOptionLabelPrefix_directMethod() {
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("A. Library")).isEqualTo("Library");
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("B) Hospital")).isEqualTo("Hospital");
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("C School")).isEqualTo("School");
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("Library")).isEqualTo("Library");
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("A.")).isEqualTo("A.");
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix(null)).isNull();
    }

    @Test
    void assert6_fillBlankAnswersPreserved() {
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(buildFixtureAiResponse(), List.of("VOCABULARY", "GRAMMAR", "READING"));
        List<AiExamParseResponse.AiQuestionDto> fbs = s.getQuestions().stream().filter(q -> "FILL_BLANK".equals(q.getType())).collect(Collectors.toList());
        assertThat(fbs).hasSize(5);
        for (AiExamParseResponse.AiQuestionDto q : fbs) {
            assertThat(q.getAnswers()).isNotEmpty();
            assertThat(q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count()).isEqualTo(1);
        }
        assertThat(fbs.stream().filter(q -> "honya".equals(q.getAnswers().get(0).getContent())).count()).isEqualTo(1);
    }

    @Test
    void assert7_shortAnswerReferenceAnswersPreserved() {
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(buildFixtureAiResponse(), List.of("VOCABULARY", "GRAMMAR", "READING"));
        List<AiExamParseResponse.AiQuestionDto> sas = s.getQuestions().stream().filter(q -> "SHORT_ANSWER".equals(q.getType())).collect(Collectors.toList());
        assertThat(sas).hasSize(3);
        for (AiExamParseResponse.AiQuestionDto q : sas) { assertThat(q.getAnswers()).isNotEmpty(); assertThat(q.getAnswers().get(0).getContent()).isNotBlank(); }
        assertThat(sas.stream().filter(q -> "mizu".equals(q.getAnswers().get(0).getContent())).count()).isEqualTo(1);
    }

    @Test
    void assert8_readingPassagesPreserved() {
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(buildFixtureAiResponse(), List.of("VOCABULARY", "GRAMMAR", "READING"));
        List<AiExamParseResponse.AiQuestionDto> readingQs = s.getQuestions().stream().filter(q -> "Reading".equals(q.getCategory())).collect(Collectors.toList());
        assertThat(readingQs).hasSize(6);
        // Passage is now in readingPassage/sourcePassage fields (not in content as "Reading Passage:" prefix)
        long withPassage = readingQs.stream().filter(q ->
            (q.getReadingPassage() != null && !q.getReadingPassage().isBlank()) ||
            (q.getSourcePassage() != null && !q.getSourcePassage().isBlank())
        ).count();
        assertThat(withPassage).isGreaterThan(0);
    }

    @Test
    void assert9_noFormatConversion() {
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(buildFixtureAiResponse(), List.of("VOCABULARY", "GRAMMAR", "READING"));
        for (AiExamParseResponse.AiQuestionDto q : s.getQuestions()) { assertThat(q.getType()).isIn("MULTIPLE_CHOICE","TRUE_FALSE","FILL_BLANK","SHORT_ANSWER"); }
        assertThat(s.getQuestions().stream().filter(q -> "FILL_BLANK".equals(q.getType())).count()).isEqualTo(5);
        assertThat(s.getQuestions().stream().filter(q -> "SHORT_ANSWER".equals(q.getType())).count()).isEqualTo(3);
    }

    @Test
    void assert10_manualFormatFilter_mcqOnly() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile("file", "MIDORI_N5_Mixed.pdf", "application/pdf", PDF_TEXT.getBytes());
        MvcResult result = mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdf).param("mode", "IMPORT_EXISTING_QUESTIONS")
                        .param("targetSkills", "VOCABULARY").param("targetSkills", "GRAMMAR").param("targetSkills", "READING")
                        .param("questionFormats", "MULTIPLE_CHOICE"))
                .andExpect(status().isOk()).andReturn();
        com.fasterxml.jackson.databind.JsonNode questions = new ObjectMapper().readTree(result.getResponse().getContentAsString()).get("data").get("questions");
        assertThat(questions).isNotNull();
        for (com.fasterxml.jackson.databind.JsonNode q : questions) { assertThat(q.get("type").asText()).isEqualTo("MULTIPLE_CHOICE"); }
    }

    @Test
    void assert11_isMcqLikeType() {
        assertThat(AiExistingQuestionParser.isMcqLikeType("MULTIPLE_CHOICE")).isTrue();
        assertThat(AiExistingQuestionParser.isMcqLikeType("TRUE_FALSE")).isTrue();
        assertThat(AiExistingQuestionParser.isMcqLikeType("FILL_BLANK")).isFalse();
        assertThat(AiExistingQuestionParser.isMcqLikeType("SHORT_ANSWER")).isFalse();
        assertThat(AiExistingQuestionParser.isMcqLikeType("FILL_IN_BLANK")).isFalse();
        assertThat(AiExistingQuestionParser.isMcqLikeType(null)).isTrue();
    }

    @Test
    void assert12_writingFlowSanitizeUnchanged() {
        AiExamParseResponse resp = new AiExamParseResponse();
        resp.setQuestions(List.of(makeMcq("Translate: I study at school.", "Writing", new String[]{"gakkoudebenkyoushimasu","iede tabemasu","kouen de hashirimasu","eki de machimasu"}, 0)));
        AiExamParseResponse s = AiExistingQuestionParser.sanitize(resp);
        assertThat(s.getQuestions()).hasSize(1);
        assertThat(s.getQuestions().get(0).getCategory()).isNotNull();
    }

    @Test
    void assert13_multiSkillUnknown_isNotAssignedToFirstSkill_andDropped() {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent("This question has no recognized semantic keywords.");
        q.setCategory("N/A"); // unrecognized category
        q.setDifficulty("MEDIUM");
        AiExamParseResponse.AiAnswerDto a1 = new AiExamParseResponse.AiAnswerDto(); a1.setContent("Option A"); a1.setIsCorrect(true);
        AiExamParseResponse.AiAnswerDto a2 = new AiExamParseResponse.AiAnswerDto(); a2.setContent("Option B"); a2.setIsCorrect(false);
        q.setAnswers(List.of(a1, a2));
        
        AiExamParseResponse resp = new AiExamParseResponse();
        resp.setQuestions(List.of(q));
        
        // Multi-skill selection: should NOT fallback to first skill, category remains unknown, dropped
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(resp, List.of("VOCABULARY", "GRAMMAR"));
        assertThat(s.getQuestions()).isEmpty();
    }

    @Test
    void assert14_singleSkillUnknown_fallsBackSafely() {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent("This question has no recognized semantic keywords.");
        q.setCategory("N/A");
        q.setDifficulty("MEDIUM");
        AiExamParseResponse.AiAnswerDto a1 = new AiExamParseResponse.AiAnswerDto(); a1.setContent("Option A"); a1.setIsCorrect(true);
        AiExamParseResponse.AiAnswerDto a2 = new AiExamParseResponse.AiAnswerDto(); a2.setContent("Option B"); a2.setIsCorrect(false);
        q.setAnswers(List.of(a1, a2));
        
        AiExamParseResponse resp = new AiExamParseResponse();
        resp.setQuestions(List.of(q));
        
        // Single-skill selection: falls back safely to that single selected skill
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(resp, List.of("VOCABULARY"));
        assertThat(s.getQuestions()).hasSize(1);
        assertThat(s.getQuestions().get(0).getCategory()).isEqualTo("Vocabulary");
    }

    @Test
    void assert15_noQuestionChangesSkillIncorrectly() {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        // Content has "Reading Passage:" keyword but explicit category is "Grammar"
        q.setContent("Reading Passage: Tanaka-san drinks coffee. What is the particle in school?");
        q.setCategory("Grammar");
        q.setDifficulty("MEDIUM");
        AiExamParseResponse.AiAnswerDto a1 = new AiExamParseResponse.AiAnswerDto(); a1.setContent("Option A"); a1.setIsCorrect(true);
        AiExamParseResponse.AiAnswerDto a2 = new AiExamParseResponse.AiAnswerDto(); a2.setContent("Option B"); a2.setIsCorrect(false);
        q.setAnswers(List.of(a1, a2));
        
        AiExamParseResponse resp = new AiExamParseResponse();
        resp.setQuestions(List.of(q));
        
        AiExamParseResponse s = AiExistingQuestionParser.sanitizeWithSelectedSkills(resp, List.of("VOCABULARY", "GRAMMAR", "READING"));
        assertThat(s.getQuestions()).hasSize(1);
        // Category must not change to "Reading" despite semantic reading passage keyword in content
        assertThat(s.getQuestions().get(0).getCategory()).isEqualTo("Grammar");
    }

    @Test
    public void testParseDirectPdfText() {
        AiExamParseResponse parsed = AiExistingQuestionParser.parseFromSourceText(PDF_TEXT);
        for (int i = 0; i < parsed.getQuestions().size(); i++) {
            AiExamParseResponse.AiQuestionDto q = parsed.getQuestions().get(i);
            System.out.println("DIAGNOSTIC_DIRECT Q" + (i + 1) + ": Type=" + q.getType() + ", Cat=" + q.getCategory() + ", Content=" + q.getContent().replace("\n", "\\n"));
        }
        assertThat(parsed.getQuestions()).hasSize(18);
    }

    @Test
    void assert16_blockSegmentationAndPrefixStrippingRegression() {
        // 1. "Câu 1" remains unchanged
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("Câu 1")).isEqualTo("Câu 1");
        // 2. "Câu 2" remains unchanged
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("Câu 2")).isEqualTo("Câu 2");
        // 3. Option label "A. としょかん" becomes "としょかん"
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("A. としょかん")).isEqualTo("としょかん");
        // 4. Normal word beginning with C is not stripped (e.g. "Bệnh viện", "Đáp án")
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("Bệnh viện")).isEqualTo("Bệnh viện");
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("Đáp án")).isEqualTo("Đáp án");
        assertThat(AiExistingQuestionParser.stripOptionLabelPrefix("A student goes to school")).isEqualTo("A student goes to school");

        // 5. 18-question fixture parses into exactly 18 questions
        String vietnamesePdfText = PDF_TEXT.replaceAll("(?m)^(\\d+)\\.", "Câu $1:");
        AiExamParseResponse parsed = AiExistingQuestionParser.parseFromSourceText(vietnamesePdfText);
        assertThat(parsed.getQuestions()).hasSize(18);

        // 6. No question contains another "Câu N" marker in its options
        java.util.regex.Pattern qMarker = java.util.regex.Pattern.compile("(?i)\\bCâu\\b");
        for (AiExamParseResponse.AiQuestionDto q : parsed.getQuestions()) {
            if (q.getAnswers() != null) {
                for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                    assertThat(qMarker.matcher(a.getContent()).find()).isFalse();
                }
            }
        }

        // 7. MCQ option count remains exactly 4
        List<AiExamParseResponse.AiQuestionDto> mcqs = parsed.getQuestions().stream()
                .filter(q -> "MULTIPLE_CHOICE".equals(q.getType()))
                .collect(Collectors.toList());
        assertThat(mcqs).hasSize(6);
        for (AiExamParseResponse.AiQuestionDto q : mcqs) {
            assertThat(q.getAnswers()).hasSize(4);
        }

        // 8. No option labels extend beyond D for MCQ (should be stripped or correctly mapped)
        for (AiExamParseResponse.AiQuestionDto q : mcqs) {
            for (AiExamParseResponse.AiAnswerDto a : q.getAnswers()) {
                assertThat(a.getContent()).doesNotStartWith("A.").doesNotStartWith("B.");
            }
        }

        // 9. Skill counts remain 6/6/6
        long vocab = parsed.getQuestions().stream().filter(q -> "Vocabulary".equals(q.getCategory())).count();
        long grammar = parsed.getQuestions().stream().filter(q -> "Grammar".equals(q.getCategory())).count();
        long reading = parsed.getQuestions().stream().filter(q -> "Reading".equals(q.getCategory())).count();
        assertThat(vocab).isEqualTo(6);
        assertThat(grammar).isEqualTo(6);
        assertThat(reading).isEqualTo(6);

        // 10. Format counts remain 6/4/5/3
        long mcqCount = parsed.getQuestions().stream().filter(q -> "MULTIPLE_CHOICE".equals(q.getType())).count();
        long tfCount = parsed.getQuestions().stream().filter(q -> "TRUE_FALSE".equals(q.getType())).count();
        long fbCount = parsed.getQuestions().stream().filter(q -> "FILL_BLANK".equals(q.getType())).count();
        long saCount = parsed.getQuestions().stream().filter(q -> "SHORT_ANSWER".equals(q.getType())).count();
        assertThat(mcqCount).isEqualTo(6);
        assertThat(tfCount).isEqualTo(4);
        assertThat(fbCount).isEqualTo(5);
        assertThat(saCount).isEqualTo(3);
    }

    @Test
    void assert17_malformedFlattenedOneQuestionPayloadRejected() {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setType("MULTIPLE_CHOICE");
        q.setContent("MIDORI - N5 Question Import Test");
        q.setCategory("Vocabulary");

        List<AiExamParseResponse.AiAnswerDto> answers = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            AiExamParseResponse.AiAnswerDto a = new AiExamParseResponse.AiAnswerDto();
            a.setContent("Câu " + i + ": Option content");
            a.setIsCorrect(i == 1);
            answers.add(a);
        }
        q.setAnswers(answers);

        AiExamParseResponse resp = new AiExamParseResponse();
        resp.setQuestions(new ArrayList<>(List.of(q)));

        AiExamParseResponse sanitized = AiExistingQuestionParser.sanitize(resp);
        assertThat(sanitized.isSuccess()).isFalse();
        assertThat(sanitized.getCode()).isEqualTo("PARSER_BLOCK_SEGMENTATION_FAILED");
        assertThat(sanitized.getQuestions()).isEmpty();
    }
}