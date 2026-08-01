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
}
