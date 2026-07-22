package com.midori.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.dto.contentlibrary.AdminAiContentGenerateRequest;
import com.midori.dto.contentlibrary.AdminAiContentGenerateResponse;
import com.midori.dto.contentlibrary.AdminVocabularyAiDraft;
import com.midori.exception.GlobalExceptionHandler;
import com.midori.service.AdminAiContentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminAiContentControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminAiContentService adminAiContentService;

    private AdminAiContentController controller;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        controller = new AdminAiContentController(adminAiContentService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/admin/content-library/ai/generate - success for VOCABULARY with lesson context")
    void generateVocabulary_success() throws Exception {
        AdminVocabularyAiDraft vocabDraft = AdminVocabularyAiDraft.builder()
                .title("School Life Vocabulary")
                .description("Vocabulary about school items")
                .items(List.of(
                        AdminVocabularyAiDraft.ItemDraft.builder()
                                .japanese("学校")
                                .furigana("がっこう")
                                .meaning("Trường học")
                                .exampleSentence("私は学校に行きます。")
                                .exampleTranslation("Tôi đi đến trường.")
                                .build()
                ))
                .build();

        AdminAiContentGenerateResponse mockResponse = AdminAiContentGenerateResponse.builder()
                .skillType("VOCABULARY")
                .level("N5")
                .vocabularyDraft(vocabDraft)
                .build();

        when(adminAiContentService.generateContent(any())).thenReturn(mockResponse);

        // Test with new lesson context fields
        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("VOCABULARY")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("School Life")
                .lessonDescription("Vocabulary related to school life")
                .topic("School")
                .itemCount(5)
                .build();

        MockMultipartFile requestPart = new MockMultipartFile(
                "request",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        mockMvc.perform(multipart("/api/admin/content-library/ai/generate")
                        .file(requestPart))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillType").value("VOCABULARY"))
                .andExpect(jsonPath("$.data.vocabularyDraft.title").value("School Life Vocabulary"));
    }

    @Test
    @DisplayName("POST /api/admin/content-library/ai/generate - bad request for unsupported skill LISTENING")
    void generateListening_badRequest() throws Exception {
        when(adminAiContentService.generateContent(any()))
                .thenThrow(new IllegalArgumentException("Skill type 'LISTENING' is not supported for AI generation."));

        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("LISTENING")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        MockMultipartFile requestPart = new MockMultipartFile(
                "request",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        mockMvc.perform(multipart("/api/admin/content-library/ai/generate")
                        .file(requestPart))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/admin/content-library/ai/generate - validation error for missing lessonNumber")
    void generateVocabulary_validationError() throws Exception {
        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("VOCABULARY")
                .level("N5")
                // Missing lessonNumber
                .lessonTitle("Test")
                .topic("Test")
                .build();

        MockMultipartFile requestPart = new MockMultipartFile(
                "request",
                "",
                MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(request)
        );

        mockMvc.perform(multipart("/api/admin/content-library/ai/generate")
                        .file(requestPart))
                .andExpect(status().isBadRequest());
    }
}
