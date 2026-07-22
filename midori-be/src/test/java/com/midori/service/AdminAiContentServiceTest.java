package com.midori.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

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

        when(aiCoreService.chat(anyString(), anyString(), any(), any())).thenReturn(mockAiResponse);

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
    @DisplayName("Generate Grammar content successfully with lesson context")
    void generateGrammar_ok() {
        String mockAiResponse = """
                {
                  "title": "N5 Sentence Patterns",
                  "description": "Basic N5 grammar points",
                  "items": [
                    {
                      "grammarPoint": "〜です",
                      "meaningVietnamese": "Là...",
                      "meaningJapanese": "です",
                      "explanation": "Dùng để khẳng định.",
                      "exampleSentence": "私は学生です。",
                      "notes": "Cấu trúc cơ bản"
                    }
                  ]
                }
                """;

        when(aiCoreService.chat(anyString(), anyString(), any(), any())).thenReturn(mockAiResponse);

        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("GRAMMAR")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Basic Grammar")
                .lessonDescription("Introduction to basic grammar")
                .topic("Basic Sentence")
                .grammarTopic("Basic Sentence")
                .itemCount(3)
                .build();

        AdminAiContentGenerateResponse response = adminAiContentService.generateContent(request);

        assertNotNull(response);
        assertEquals("GRAMMAR", response.getSkillType());
        assertNotNull(response.getGrammarDraft());
        assertEquals(1, response.getGrammarDraft().getItems().size());
    }

    @Test
    @DisplayName("Generate Reading content successfully with reading-specific parameters")
    void generateReading_ok() {
        String mockAiResponse = """
                {
                  "title": "N5 Reading Practice",
                  "description": "Short passage",
                  "passages": [
                    {
                      "title": "Passage 1",
                      "content": "田中さんは学生です。毎日学校に行きます。",
                      "passageOrder": 1,
                      "questions": [
                        {
                          "questionText": "田中さんは誰ですか？",
                          "questionType": "MULTIPLE_CHOICE",
                          "explanation": "Bài đọc ghi Tanaka là học sinh.",
                          "options": [
                            { "optionText": "学生", "isCorrect": true },
                            { "optionText": "先生", "isCorrect": false }
                          ]
                        }
                      ]
                    }
                  ]
                }
                """;

        when(aiCoreService.chat(anyString(), anyString(), any(), any())).thenReturn(mockAiResponse);

        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("READING")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Daily Life Reading")
                .topic("Daily Life")
                .passageCount(1)
                .questionsPerPassage(1)
                .difficulty("EASY")
                .passageLength("SHORT")
                .build();

        AdminAiContentGenerateResponse response = adminAiContentService.generateContent(request);

        assertNotNull(response);
        assertEquals("READING", response.getSkillType());
        assertNotNull(response.getReadingDraft());
        assertEquals(1, response.getReadingDraft().getPassages().size());
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
    @DisplayName("Throw exception when zero valid items are generated")
    void zeroValidItems_throwsException() {
        String mockAiResponse = """
                {
                  "title": "Empty Vocab",
                  "description": "No valid items",
                  "items": [
                    {
                      "japanese": "",
                      "meaning": ""
                    }
                  ]
                }
                """;

        when(aiCoreService.chat(anyString(), anyString(), any(), any())).thenReturn(mockAiResponse);

        AdminAiContentGenerateRequest request = AdminAiContentGenerateRequest.builder()
                .skillType("VOCABULARY")
                .level("N5")
                .lessonNumber(1)
                .lessonTitle("Test")
                .topic("Test")
                .build();

        assertThrows(AiProcessingException.class, () -> adminAiContentService.generateContent(request));
    }
}
