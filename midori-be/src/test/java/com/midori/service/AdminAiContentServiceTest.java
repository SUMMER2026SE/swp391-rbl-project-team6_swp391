package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiTaskType;
import com.midori.ai.core.AiCoreService;
import com.midori.dto.contentlibrary.AdminAiContentGenerateRequest;
import com.midori.dto.contentlibrary.AdminAiContentGenerateResponse;
import com.midori.service.impl.AdminAiContentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminAiContentService.
 * Tests validation logic and basic flow without requiring AI provider configuration.
 */
@ExtendWith(MockitoExtension.class)
class AdminAiContentServiceTest {

    @Mock
    private AiCoreService aiCoreService;

    @Mock
    private DocumentTextExtractor documentTextExtractor;

    private ObjectMapper objectMapper;
    private AdminAiContentServiceImpl adminAiContentService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        adminAiContentService = new AdminAiContentServiceImpl(aiCoreService, objectMapper, documentTextExtractor);
    }

    @Test
    @DisplayName("Reject null request")
    void rejectNullRequest() {
        assertThrows(IllegalArgumentException.class, () -> adminAiContentService.generateContent((AdminAiContentGenerateRequest) null));
    }

    @Test
    @DisplayName("Generate Vocabulary content successfully with lesson context")
    void generateVocabulary_ok() {
        String mockAiResponse = """
                {
                  "title": "N5 School Vocabulary",
                  "description": "Vocabulary about school items",
                  "items": [
                    {
                      "japanese": "学校",
                      "furigana": "がっこう",
                      "romaji": "gakkou",
                      "meaning": "School",
                      "exampleSentence": "学校に行きます。",
                      "exampleTranslation": "I go to school.",
                      "partOfSpeech": "Noun"
                    }
                  ]
                }
                """;

        when(aiCoreService.chatWithDetails(anyString(), anyString(), any(), any()))
                .thenReturn(new com.midori.ai.core.AiCoreService.AiResponse(mockAiResponse, "mockProvider", "mockModel", "stop", 10, 20, 30));

        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("VOCABULARY")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("School Life")
                .lessonDescription("Vocabulary related to school")
                .topic("School")
                .itemCount(5)
                .build();

        AdminAiContentGenerateResponse response = adminAiContentService.generateContent(request);

        assertNotNull(response);
        assertEquals("VOCABULARY", response.getSkillType());
        assertEquals("N5", response.getLevel());
        assertNotNull(response.getVocabularyDraft());
        assertEquals("N5 School Vocabulary", response.getVocabularyDraft().getTitle());
        assertEquals(1, response.getVocabularyDraft().getItems().size());
        assertNull(response.getWarning());
    }

    @Test
    @DisplayName("Reject null skillType")
    void rejectNullSkillType() {
        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> adminAiContentService.generateContent(request));
    }

    @Test
    @DisplayName("Reject blank skillType")
    void rejectBlankSkillType() {
        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("   ")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> adminAiContentService.generateContent(request));
    }

    @Test
    @DisplayName("Reject unsupported skillType LISTENING")
    void rejectListening() {
        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("LISTENING")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> adminAiContentService.generateContent(request));
    }

    @Test
    @DisplayName("Reject unsupported skillType SHADOWING")
    void rejectShadowing() {
        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("SHADOWING")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> adminAiContentService.generateContent(request));
    }

    @Test
    @DisplayName("Reject unknown skillType")
    void rejectUnknownSkillType() {
        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("KANJI")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> adminAiContentService.generateContent(request));
    }

    @Test
    @DisplayName("Throw exception when zero valid items are generated")
    void zeroValidItems_throwsException() {
        String mockAiResponse = """
                {
                  "title": "Empty Vocab",
                  "description": "No valid items",
                  "items": [
                    {
                      "japanese": "",
                      "furigana": "",
                      "meaning": "",
                      "partOfSpeech": "Noun"
                    }
                  ]
                }
                """;

        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("KANJI")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        assertThrows(IllegalArgumentException.class, () -> adminAiContentService.generateContent(request));
    }
}
