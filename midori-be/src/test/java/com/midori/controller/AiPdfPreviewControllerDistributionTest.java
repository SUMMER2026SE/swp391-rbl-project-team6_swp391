package com.midori.controller;

import com.midori.ai.core.AiCoreService;
import com.midori.ai.dto.AiExamParseResponse;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression tests for the strict difficulty-distribution + question-type
 * pipeline used by GENERATE_FROM_CONTENT in {@link AiPdfPreviewController}.
 *
 * <p>These tests intentionally mock the downstream service so we only verify
 * controller-layer routing, validation, and parameter plumbing.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class AiPdfPreviewControllerDistributionTest {

    private MockMvc mockMvc;

    @Mock
    private PdfTextExtractor pdfTextExtractor;

    @Mock
    private AiCoreService aiCoreService;

    @Mock
    private AiLearningContentService aiLearningContentService;

    private AiPdfPreviewController controller;
    private QuestionBankCompatibilityValidator compatibilityValidator;

    @BeforeEach
    void setUp() throws Exception {
        compatibilityValidator = new QuestionBankCompatibilityValidator();
        controller = new AiPdfPreviewController(
                pdfTextExtractor, aiCoreService, aiLearningContentService, compatibilityValidator);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        // Stub the extractor with a valid result so controller-side validations
        // never NPE before reaching the distribution check.
        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "JLPT N5 vocabulary list with Japanese words",
                List.of("JLPT N5 vocabulary list with Japanese words"),
                false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);
    }

    // ============================================================
    // Tests for distribution path routing
    // ============================================================

    @Test
    void distributionPath_calledWhenAllPercentagesProvided() throws Exception {
        mockSuccessfulGenerate();
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "10")
                        .param("questionType", "FILL_BLANK")
                        .param("easyPct", "30")
                        .param("mediumPct", "50")
                        .param("hardPct", "20")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestionsWithDistribution(
                eq("lesson.pdf"), any(), any(), eq(10), eq("FILL_BLANK"),
                eq(30), eq(50), eq(20), any(), any());
        verify(aiLearningContentService, never())
                .generateQuestions(any(), any(), any(), anyInt(), any(), any(), any());
    }

    @Test
    void distributionPath_invalidPercentageSumReturns400() throws Exception {
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "10")
                        .param("questionType", "MULTIPLE_CHOICE")
                        .param("easyPct", "30")
                        .param("mediumPct", "50")
                        .param("hardPct", "10")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
        verify(aiLearningContentService, never())
                .generateQuestionsWithDistribution(any(), any(), any(), anyInt(), any(),
                        anyInt(), anyInt(), anyInt(), any(), any());
    }

    @Test
    void distributionPath_negativePercentageReturns400() throws Exception {
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "10")
                        .param("questionType", "MULTIPLE_CHOICE")
                        .param("easyPct", "-1")
                        .param("mediumPct", "60")
                        .param("hardPct", "41")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void distributionPath_greaterThan100Returns400() throws Exception {
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "10")
                        .param("questionType", "MULTIPLE_CHOICE")
                        .param("easyPct", "101")
                        .param("mediumPct", "0")
                        .param("hardPct", "0")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void distributionPath_partialPercentagesReturns400() throws Exception {
        // Only two of the three percentages supplied → controller must reject.
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "10")
                        .param("questionType", "MULTIPLE_CHOICE")
                        .param("easyPct", "30")
                        .param("mediumPct", "70")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void distributionPath_unsupportedQuestionTypeReturns400() throws Exception {
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "10")
                        .param("questionType", "ESSAY_FREE_FORM")
                        .param("easyPct", "30")
                        .param("mediumPct", "50")
                        .param("hardPct", "20")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void distributionPath_countOutOfRangeReturns400() throws Exception {
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "0")
                        .param("questionType", "MULTIPLE_CHOICE")
                        .param("easyPct", "30")
                        .param("mediumPct", "50")
                        .param("hardPct", "20")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void distributionPath_acceptsShortAnswerType() throws Exception {
        mockSuccessfulGenerate();
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "3")
                        .param("questionType", "SHORT_ANSWER")
                        .param("easyPct", "30")
                        .param("mediumPct", "50")
                        .param("hardPct", "20")
                        .param("targetSkills", "GRAMMAR"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestionsWithDistribution(
                any(), any(), any(), eq(3), eq("SHORT_ANSWER"),
                eq(30), eq(50), eq(20), any(), any());
    }

    @Test
    void distributionPath_acceptsTrueFalseType() throws Exception {
        mockSuccessfulGenerate();
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "5")
                        .param("questionType", "TRUE_FALSE")
                        .param("easyPct", "0")
                        .param("mediumPct", "100")
                        .param("hardPct", "0")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestionsWithDistribution(
                any(), any(), any(), eq(5), eq("TRUE_FALSE"),
                eq(0), eq(100), eq(0), any(), any());
    }

    @Test
    void legacyPath_calledWhenNoPercentagesProvided() throws Exception {
        mockSuccessfulGenerate();
        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(pdfFile())
                        .param("mode", "GENERATE_FROM_CONTENT")
                        .param("count", "5")
                        .param("questionType", "MULTIPLE_CHOICE")
                        .param("difficulty", "MEDIUM")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiLearningContentService).generateQuestions(
                any(), any(), any(), eq(5), any(), any(), any());
        verify(aiLearningContentService, never())
                .generateQuestionsWithDistribution(any(), any(), any(), anyInt(), any(),
                        anyInt(), anyInt(), anyInt(), any(), any());
    }

    @Test
    void importMode_doesNotRouteToGeneration() throws Exception {
        // For IMPORT_EXISTING_QUESTIONS the controller must call parseExistingQuestionsFromText
        // regardless of any difficulty parameters; it must NOT call generateQuestions*.
        String pdfText = "What is the reading of 山? A. やま B. かわ Correct answer: A";
        MockMultipartFile file = new MockMultipartFile(
                "file", "exam.pdf", "application/pdf", pdfText.getBytes());
        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                pdfText, List.of(pdfText), false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        AiExamParseResponse resp = new AiExamParseResponse();
        var q = new AiExamParseResponse.AiQuestionDto();
        q.setContent("What is the reading of 山?");
        q.setType("MULTIPLE_CHOICE");
        q.setDifficulty("Medium");
        var a1 = new AiExamParseResponse.AiAnswerDto();
        a1.setContent("やま");
        a1.setIsCorrect(true);
        var a2 = new AiExamParseResponse.AiAnswerDto();
        a2.setContent("かわ");
        a2.setIsCorrect(false);
        q.setAnswers(List.of(a1, a2));
        resp.setQuestions(List.of(q));
        when(aiCoreService.parseExistingQuestionsFromText(any(), any(), any())).thenReturn(resp);

        mockMvc.perform(multipart("/api/ai/questions/generate-from-pdf")
                        .file(file)
                        .param("mode", "IMPORT_EXISTING_QUESTIONS")
                        .param("easyPct", "30")
                        .param("mediumPct", "50")
                        .param("hardPct", "20")
                        .param("targetSkills", "VOCABULARY"))
                .andExpect(status().isOk());

        verify(aiCoreService).parseExistingQuestionsFromText(any(), any(), any());
        verify(aiLearningContentService, never())
                .generateQuestions(any(), any(), any(), anyInt(), any(), any(), any());
        verify(aiLearningContentService, never())
                .generateQuestionsWithDistribution(any(), any(), any(), anyInt(), any(),
                        anyInt(), anyInt(), anyInt(), any(), any());
    }

    // ============================================================
    // Helpers
    // ============================================================

    private MockMultipartFile pdfFile() {
        return new MockMultipartFile(
                "file", "lesson.pdf", "application/pdf",
                "JLPT N5 vocabulary list with Japanese words".getBytes());
    }

    private void mockSuccessfulGenerate() throws Exception {
        PdfTextExtractor.ExtractionResult extraction = new PdfTextExtractor.ExtractionResult(
                "JLPT N5 vocabulary list with Japanese words",
                List.of("JLPT N5 vocabulary list with Japanese words"),
                false, 1);
        when(pdfTextExtractor.extract(any())).thenReturn(extraction);

        AiExamParseResponse resp = new AiExamParseResponse();
        var q = new AiExamParseResponse.AiQuestionDto();
        q.setContent("Sample question");
        q.setType("MULTIPLE_CHOICE");
        q.setDifficulty("Medium");
        q.setCategory("Vocabulary");
        var a1 = new AiExamParseResponse.AiAnswerDto();
        a1.setContent("A");
        a1.setIsCorrect(true);
        var a2 = new AiExamParseResponse.AiAnswerDto();
        a2.setContent("B");
        a2.setIsCorrect(false);
        var a3 = new AiExamParseResponse.AiAnswerDto();
        a3.setContent("C");
        a3.setIsCorrect(false);
        var a4 = new AiExamParseResponse.AiAnswerDto();
        a4.setContent("D");
        a4.setIsCorrect(false);
        q.setAnswers(List.of(a1, a2, a3, a4));
        resp.setQuestions(List.of(q));

        when(aiLearningContentService.generateQuestionsWithDistribution(
                any(), any(), any(), anyInt(), any(), anyInt(), anyInt(), anyInt(), any(), any()))
                .thenReturn(resp);
        when(aiLearningContentService.generateQuestions(
                any(), any(), any(), anyInt(), any(), any(), any()))
                .thenReturn(resp);
    }
}
