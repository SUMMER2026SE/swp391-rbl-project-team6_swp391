package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
import com.midori.service.AiLearningContentService;
import com.midori.service.PdfTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression tests for AiPdfPreviewController.
 * Verifies that GENERATE_FROM_CONTENT and IMPORT_EXISTING_QUESTIONS
 * are correctly routed to their respective service methods.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class AiPdfPreviewControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PdfTextExtractor pdfTextExtractor;

    @Mock
    private AiCoreService aiCoreService;

    @Mock
    private AiLearningContentService aiLearningContentService;

    private AiPdfPreviewController controller;

    @BeforeEach
    void setUp() {
        controller = new AiPdfPreviewController(
                pdfTextExtractor, aiCoreService, aiLearningContentService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    // ============================================================
    // TEST 1: GENERATE_FROM_CONTENT routes to AiLearningContentService
    // ============================================================

    @Test
    void generateFromContent_routesToAiLearningContentService() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "vocab.pdf", "application/pdf",
                "日本語の単語".getBytes());

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "日本語の単語: 猫, 犬, 鳥", List.of("日本語の単語: 猫, 犬, 鳥"), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        // Must return non-empty questions or controller throws IllegalArgumentException
        AiExamParseResponse aiResponse = new AiExamParseResponse();
        aiResponse.setQuestions(List.of(makeTestQuestion("Test question")));
        when(aiLearningContentService.generateQuestions(
                any(), any(), anyInt(), any(), any(), any()))
                .thenReturn(aiResponse);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "5")
                        .param("questionType", "MULTIPLE_CHOICE")
                        .param("difficulty", "MEDIUM")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestions(any(), any(), anyInt(), any(), any(), any());
        verify(aiCoreService, never()).parseExistingQuestionsFromText(any(), any(), any());
    }

    // ============================================================
    // TEST 2: IMPORT_EXISTING_QUESTIONS routes to AiCoreService
    // ============================================================

    @Test
    void importExistingQuestions_routesToAiCoreService() throws Exception {
        // filterByEvidence checks:
        // 1. Question text must appear in source (contentAppearsInSourceSoft)
        // 2. At least 2 options must appear in source (options match source via NFKC + contains)
        // 3. Marked-correct option must appear in source
        // All answer content in the AI response must match EXACTLY what's in the source PDF text.
        String pdfText = "What is the reading of 山? A. やま B. かわ C. うみ D. そら Correct answer: A";
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "exam.pdf", "application/pdf", pdfText.getBytes());

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                pdfText, List.of(pdfText), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        // Answer content must match PDF text verbatim (after NFKC normalization).
        AiExamParseResponse aiResponse = new AiExamParseResponse();
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setContent("What is the reading of 山?");
        q.setType("MULTIPLE_CHOICE");
        q.setDifficulty("MEDIUM");
        q.setCategory("Vocabulary");
        AiExamParseResponse.AiAnswerDto a1 = new AiExamParseResponse.AiAnswerDto();
        a1.setContent("やま");
        a1.setIsCorrect(true);
        AiExamParseResponse.AiAnswerDto a2 = new AiExamParseResponse.AiAnswerDto();
        a2.setContent("かわ");
        a2.setIsCorrect(false);
        AiExamParseResponse.AiAnswerDto a3 = new AiExamParseResponse.AiAnswerDto();
        a3.setContent("うみ");
        a3.setIsCorrect(false);
        AiExamParseResponse.AiAnswerDto a4 = new AiExamParseResponse.AiAnswerDto();
        a4.setContent("そら");
        a4.setIsCorrect(false);
        q.setAnswers(List.of(a1, a2, a3, a4));
        aiResponse.setQuestions(List.of(q));

        when(aiCoreService.parseExistingQuestionsFromText(any(), any(), any()))
                .thenReturn(aiResponse);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "IMPORT_EXISTING_QUESTIONS")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiCoreService).parseExistingQuestionsFromText(any(), any(), any());
        verify(aiLearningContentService, never()).generateQuestions(any(), any(), anyInt(), any(), any(), any());
    }

    // ============================================================
    // TEST 3: GENERATE_FROM_CONTENT does NOT call the import handler
    // ============================================================

    @Test
    void generateFromContent_doesNotInvokeImportHandler() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "lesson.pdf", "application/pdf", "learning content".getBytes());

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "learning content", List.of("learning content"), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        AiExamParseResponse aiResponse = new AiExamParseResponse();
        aiResponse.setQuestions(List.of(makeTestQuestion("Test")));
        when(aiLearningContentService.generateQuestions(any(), any(), anyInt(), any(), any(), any()))
                .thenReturn(aiResponse);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "3")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiCoreService, never()).parseExistingQuestionsFromText(any(), any(), any());
    }

    // ============================================================
    // TEST 4: Generate mode has no TeacherQuestion dependency
    // ============================================================

    @Test
    void generateFromContent_worksWithoutTeacherQuestionRows() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "lesson.pdf", "application/pdf",
                "JLPT N5 Vocabulary".getBytes());

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "JLPT N5 Vocabulary", List.of("JLPT N5 Vocabulary"), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        AiExamParseResponse aiResponse = new AiExamParseResponse();
        aiResponse.setQuestions(List.of(makeTestQuestion("Test")));
        when(aiLearningContentService.generateQuestions(any(), any(), anyInt(), any(), any(), any()))
                .thenReturn(aiResponse);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "3")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestions(
                eq("lesson.pdf"), any(), eq(3), eq("MEDIUM"), any(), any());
    }

    // ============================================================
    // TEST 5: Japanese UTF-8 content is preserved
    // ============================================================

    @Test
    void generateFromContent_preservesJapaneseUtf8() throws Exception {
        String japaneseContent = "JLPT N5 Vocabulary: 猫=neko (cat)";
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "japanese.pdf", "application/pdf", japaneseContent.getBytes("UTF-8"));

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                japaneseContent, List.of(japaneseContent), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        AiExamParseResponse aiResponse = new AiExamParseResponse();
        aiResponse.setQuestions(List.of(makeTestQuestion("Test")));
        when(aiLearningContentService.generateQuestions(any(), any(), anyInt(), any(), any(), any()))
                .thenReturn(aiResponse);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "5")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestions(
                eq("japanese.pdf"), eq(japaneseContent), anyInt(), any(), any(), any());
    }

    // ============================================================
    // TEST 6: Empty PDF returns error
    // ============================================================

    @Test
    void generateFromContent_returnsErrorForEmptyPdf() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "", List.of(), true, 0);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "5")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
    }

    // ============================================================
    // TEST 7: Missing targetSkills returns error
    // ============================================================

    @Test
    void missingTargetSkills_returnsBadRequest() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes());

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "5"))
                .andExpect(status().isBadRequest());
    }

    // ============================================================
    // TEST 8: Invalid mode returns bad request
    // ============================================================

    @Test
    void invalidMode_returnsBadRequest() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "content".getBytes());

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "content", List.of("content"), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "INVALID_MODE")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
    }

    // ============================================================
    // TEST 9: Count parameter is passed to service
    // ============================================================

    @Test
    void generateFromContent_passesCountToService() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "mixed.pdf", "application/pdf", "content".getBytes());

        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "content", List.of("content"), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        AiExamParseResponse aiResponse = new AiExamParseResponse();
        aiResponse.setQuestions(List.of(makeTestQuestion("Test")));
        when(aiLearningContentService.generateQuestions(any(), any(), anyInt(), any(), any(), any()))
                .thenReturn(aiResponse);

        int requestedCount = 15;
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile)
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", String.valueOf(requestedCount))
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestions(any(), any(), eq(requestedCount), any(), any(), any());
    }

    // ============================================================
    // Helper: Create a valid test question with 4 distinct answers
    // ============================================================

    private AiExamParseResponse.AiQuestionDto makeTestQuestion(String content) {
        AiExamParseResponse.AiQuestionDto q = new AiExamParseResponse.AiQuestionDto();
        q.setContent(content);
        q.setType("MULTIPLE_CHOICE");
        q.setDifficulty("Medium");
        q.setCategory("Vocabulary");

        AiExamParseResponse.AiAnswerDto a1 = new AiExamParseResponse.AiAnswerDto();
        a1.setContent("Answer A");
        a1.setIsCorrect(true);

        AiExamParseResponse.AiAnswerDto a2 = new AiExamParseResponse.AiAnswerDto();
        a2.setContent("Answer B");
        a2.setIsCorrect(false);

        AiExamParseResponse.AiAnswerDto a3 = new AiExamParseResponse.AiAnswerDto();
        a3.setContent("Answer C");
        a3.setIsCorrect(false);

        AiExamParseResponse.AiAnswerDto a4 = new AiExamParseResponse.AiAnswerDto();
        a4.setContent("Answer D");
        a4.setIsCorrect(false);

        q.setAnswers(List.of(a1, a2, a3, a4));
        return q;
    }
}
