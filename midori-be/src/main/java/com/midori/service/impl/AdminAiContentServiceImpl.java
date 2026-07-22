package com.midori.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.AiTaskType;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.exception.AiProcessingException;
import com.midori.ai.prompt.AiPromptBuilder;
import com.midori.ai.util.AiExistingQuestionParser;
import com.midori.dto.contentlibrary.*;
import com.midori.service.AdminAiContentService;
import com.midori.service.DocumentTextExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * Service implementation for AI-powered content generation in the Admin Content Library.
 * 
 * Supports three skill types:
 * - VOCABULARY: Generates vocabulary lessons with word items
 * - GRAMMAR: Generates grammar lessons with grammar points
 * - READING: Generates reading comprehension lessons with passages and questions
 * 
 * Features:
 * - Optional document upload (PDF, DOCX, TXT) for reference-based generation
 * - Lesson context (title, number, description) included in AI prompts
 * - Strict validation and filtering of AI-generated content
 */
import jakarta.annotation.PostConstruct;
import com.fasterxml.jackson.core.JsonParser;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAiContentServiceImpl implements AdminAiContentService {

    private final AiCoreService aiCoreService;
    private final ObjectMapper objectMapper;
    private final DocumentTextExtractor documentTextExtractor;

    @PostConstruct
    public void init() {
        objectMapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);
    }

    @Override
    public AdminAiContentGenerateResponse generateContent(AdminAiContentGenerateRequest request) {
        return generateContent(request, null);
    }

    @Override
    public AdminAiContentGenerateResponse generateContent(AdminAiContentGenerateRequest request, MultipartFile referenceDocument) {
        if (request == null || request.getSkillType() == null || request.getSkillType().isBlank()) {
            throw new IllegalArgumentException("Skill type is required");
        }

        String skillType = request.getSkillType().trim().toUpperCase();
        String level = request.getLevel() != null ? request.getLevel().trim().toUpperCase() : "N5";

        // Extract text from reference document if provided
        String documentText = null;
        if (referenceDocument != null && !referenceDocument.isEmpty()) {
            try {
                DocumentTextExtractor.ExtractionResult result = documentTextExtractor.extract(referenceDocument);
                documentText = result.fullText();
                log.info("Extracted {} chars from reference document: {}", 
                    documentText.length(), referenceDocument.getOriginalFilename());
            } catch (IllegalArgumentException e) {
                log.warn("Failed to extract from reference document: {}", e.getMessage());
                throw new IllegalArgumentException("Cannot process reference document: " + e.getMessage());
            }
        }

        // Build lesson context for prompts
        String lessonContext = buildLessonContext(request);

        switch (skillType) {
            case "VOCABULARY":
                return generateVocabularyContent(level, request, documentText, lessonContext);
            case "GRAMMAR":
                return generateGrammarContent(level, request, documentText, lessonContext);
            case "READING":
                return generateReadingContent(level, request, documentText, lessonContext);
            case "LISTENING":
            case "SHADOWING":
            default:
                throw new IllegalArgumentException(
                    "Skill type '" + skillType + "' is not supported for AI generation.");
        }
    }

    /**
     * Build lesson context string for inclusion in AI prompts.
     * This helps the AI create content that aligns with the teacher's intended lesson structure.
     */
    private String buildLessonContext(AdminAiContentGenerateRequest request) {
        StringBuilder context = new StringBuilder();
        
        context.append("LESSON INFORMATION:\n");
        context.append("- Lesson Number: ").append(request.getLessonNumber()).append("\n");
        
        if (request.getLessonTitle() != null && !request.getLessonTitle().isBlank()) {
            context.append("- Lesson Title: ").append(request.getLessonTitle()).append("\n");
        }
        
        if (request.getLessonDescription() != null && !request.getLessonDescription().isBlank()) {
            context.append("- Lesson Description: ").append(request.getLessonDescription()).append("\n");
        }
        
        return context.toString();
    }

    private String normalizeAiJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("AI returned empty response");
        }

        String cleaned = raw.trim();

        // 1. Remove markdown code fences carefully
        if (cleaned.startsWith("```")) {
            int firstNewLine = cleaned.indexOf('\n');
            if (firstNewLine > 0) {
                cleaned = cleaned.substring(firstNewLine).trim();
            } else {
                cleaned = cleaned.replace("```json", "").replace("```JSON", "").replace("```", "").trim();
            }
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
        }
        
        // 2. Extract content from first '{' to last '}'
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');

        if (start < 0 || end < start) {
            throw new IllegalArgumentException(
                    "AI response does not contain a valid JSON object"
            );
        }
        cleaned = cleaned.substring(start, end + 1);

        // 3. Target structural backticks only
        // Replace `key`: with "key":
        cleaned = cleaned.replaceAll("`([^`\\s]+)`\\s*:", "\"$1\":");
        // Replace : `value` with : "value"
        cleaned = cleaned.replaceAll(":\\s*`([^`\n]+)`", ": \"$1\"");

        return cleaned;
    }

    private void validateDraft(AdminVocabularyAiDraft draft) {
        if (draft == null) {
            throw new IllegalArgumentException("Vocabulary draft is null");
        }
        if (draft.getItems() == null) {
            throw new IllegalArgumentException("Vocabulary draft items list is null");
        }
        if (draft.getItems().isEmpty()) {
            throw new IllegalArgumentException("Vocabulary draft items list is empty");
        }
        for (int i = 0; i < draft.getItems().size(); i++) {
            AdminVocabularyAiDraft.ItemDraft item = draft.getItems().get(i);
            if (item == null) {
                throw new IllegalArgumentException("Vocabulary item at index " + i + " is null");
            }
            if (item.getJapanese() == null || item.getJapanese().isBlank()) {
                throw new IllegalArgumentException("Vocabulary item at index " + i + " is missing mandatory field 'japanese'");
            }
            if (item.getFurigana() == null || item.getFurigana().isBlank()) {
                throw new IllegalArgumentException("Vocabulary item at index " + i + " is missing mandatory field 'furigana'");
            }
            if (item.getMeaning() == null || item.getMeaning().isBlank()) {
                throw new IllegalArgumentException("Vocabulary item at index " + i + " is missing mandatory field 'meaning'");
            }
        }
    }

    private boolean isTruncatedJson(String rawResponse, String finishReason, Throwable e) {
        if (finishReason != null && (finishReason.equalsIgnoreCase("LENGTH") || finishReason.equalsIgnoreCase("MAX_TOKENS"))) {
            return true;
        }
        if (rawResponse != null) {
            String trimmed = rawResponse.trim();
            if (!trimmed.isEmpty() && trimmed.charAt(trimmed.length() - 1) != '}') {
                return true;
            }
        }
        if (e != null && e.getMessage() != null) {
            String msg = e.getMessage().toLowerCase();
            if (msg.contains("unexpected end-of-input") || msg.contains("unexpected end of input")) {
                return true;
            }
        }
        return false;
    }

    private void logDiagnostics(String stage, String rawJson, String providerName, String modelName, String finishReason, Integer promptTokens, Integer completionTokens, Integer totalTokens) {
        log.info("--- AI GENERATION DIAGNOSTICS ({}) ---", stage);
        log.info("Raw response length: {}", rawJson != null ? rawJson.length() : 0);
        log.info("Provider: {}", providerName);
        log.info("Model: {}", modelName);
        log.info("Finish Reason: {}", finishReason != null ? finishReason : "N/A");
        log.info("Token Usage: prompt={}, completion={}, total={}", 
                promptTokens != null ? promptTokens : "N/A", 
                completionTokens != null ? completionTokens : "N/A", 
                totalTokens != null ? totalTokens : "N/A");
        
        String last500 = "N/A";
        if (rawJson != null) {
            int len = rawJson.length();
            if (len <= 500) {
                last500 = rawJson;
            } else {
                last500 = "[...] " + rawJson.substring(len - 500);
            }
        }
        log.info("Last 500 chars of raw response:\n{}", last500);
        log.info("-------------------------------------------------");
    }

    private AdminAiContentGenerateResponse generateVocabularyContent(
            String level, 
            AdminAiContentGenerateRequest request,
            String documentText,
            String lessonContext) {
        
        String systemPrompt = "You are an AI assistant for Japanese language learning content creation. " +
                "Always respond with raw valid JSON.";
        
        String userPrompt = AiPromptBuilder.buildAdminVocabularyGenerationPrompt(
                level, 
                request.getLessonTitle(),
                request.getLessonNumber(),
                request.getLessonDescription(),
                request.getTopic(), 
                request.getItemCount(), 
                request.getCustomInstructions(),
                documentText,
                lessonContext);

        String rawJson = null;
        String providerName = "Unknown";
        String modelName = "Unknown";
        String finishReason = null;
        Integer promptTokens = null;
        Integer completionTokens = null;
        Integer totalTokens = null;
        try {
            com.midori.ai.core.AiCoreService.AiResponse response = aiCoreService.chatWithDetails(
                    systemPrompt, userPrompt, null, AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION);
            rawJson = response.content();
            providerName = response.providerName();
            modelName = response.modelName();
            finishReason = response.finishReason();
            promptTokens = response.promptTokens();
            completionTokens = response.completionTokens();
            totalTokens = response.totalTokens();
        } catch (Exception e) {
            log.error("First Vocabulary AI call failed: {}", e.getMessage());
        }

        logDiagnostics("First Attempt", rawJson, providerName, modelName, finishReason, promptTokens, completionTokens, totalTokens);

        AdminVocabularyAiDraft draft = null;
        String normalized = null;
        try {
            if (rawJson == null) throw new IllegalArgumentException("First AI call returned null/failed");
            normalized = normalizeAiJson(rawJson);
            
            if (isTruncatedJson(rawJson, finishReason, null)) {
                throw new IllegalArgumentException("AI response was truncated (ends without closing brace or stopped by length limit)");
            }
            
            draft = objectMapper.readValue(normalized, AdminVocabularyAiDraft.class);
            validateDraft(draft);
        } catch (Exception e) {
            String errType;
            if (isTruncatedJson(rawJson, finishReason, e)) {
                errType = "truncated JSON / unexpected end-of-input";
            } else if (e instanceof com.fasterxml.jackson.core.JsonProcessingException || e.getMessage().contains("does not contain a valid JSON object")) {
                errType = "malformed JSON";
            } else {
                errType = "validation failure";
            }
            log.warn("First Vocabulary parse/validation attempt failed.");
            log.warn("Error Type: {}", errType);
            log.warn("Raw response: {}", rawJson);
            log.warn("Normalized response: {}", normalized);
            log.warn("Parse/validation error: {}. Retrying AI call...", e.getMessage());

            String retryPrompt;
            if (errType.equals("truncated JSON / unexpected end-of-input")) {
                retryPrompt = userPrompt + "\n\nCRITICAL RETRY INSTRUCTION:\n" +
                        "Your previous response was truncated.\n" +
                        "Regenerate the complete JSON object from the beginning.\n" +
                        "Return fewer and shorter items.\n" +
                        "Keep explanations concise.\n" +
                        "Return ONLY valid compact JSON.\n" +
                        "Do not use markdown.\n" +
                        "Ensure the final character is }.\n" +
                        "Do not exceed the requested number of items.";
            } else {
                retryPrompt = userPrompt + "\n\nCRITICAL RETRY INSTRUCTION:\n" +
                        "Return ONLY one valid JSON object.\n" +
                        "Do not use markdown.\n" +
                        "Do not use code fences.\n" +
                        "Do not use backticks.\n" +
                        "Do not add explanations before or after the JSON.\n" +
                        "Use double quotes for every field name and every string value.\n" +
                        "The response must be directly parseable by Jackson ObjectMapper.\n" +
                        "Base all generated content only on the provided PDF text.";
            }

            String retryRawJson = null;
            String retryProviderName = "Unknown";
            String retryModelName = "Unknown";
            String retryFinishReason = null;
            Integer retryPromptTokens = null;
            Integer retryCompletionTokens = null;
            Integer retryTotalTokens = null;
            try {
                com.midori.ai.core.AiCoreService.AiResponse retryResponse = aiCoreService.chatWithDetails(
                        systemPrompt, retryPrompt, null, AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION);
                retryRawJson = retryResponse.content();
                retryProviderName = retryResponse.providerName();
                retryModelName = retryResponse.modelName();
                retryFinishReason = retryResponse.finishReason();
                retryPromptTokens = retryResponse.promptTokens();
                retryCompletionTokens = retryResponse.completionTokens();
                retryTotalTokens = retryResponse.totalTokens();
                
                logDiagnostics("Retry Attempt", retryRawJson, retryProviderName, retryModelName, retryFinishReason, retryPromptTokens, retryCompletionTokens, retryTotalTokens);

                if (isTruncatedJson(retryRawJson, retryFinishReason, null)) {
                    throw new AiProcessingException("AI response was truncated after retry");
                }

                String retryNormalized = normalizeAiJson(retryRawJson);
                draft = objectMapper.readValue(retryNormalized, AdminVocabularyAiDraft.class);
                validateDraft(draft);
            } catch (Exception ex) {
                String retryErrType;
                if (isTruncatedJson(retryRawJson, retryFinishReason, ex)) {
                    retryErrType = "truncated JSON / unexpected end-of-input";
                } else if (ex instanceof com.fasterxml.jackson.core.JsonProcessingException) {
                    retryErrType = "malformed JSON";
                } else {
                    retryErrType = "validation failure";
                }
                log.error("Retry Vocabulary parse attempt also failed. Error Type: {}, Raw response: {}", retryErrType, retryRawJson);
                if (retryErrType.equals("truncated JSON / unexpected end-of-input") || ex.getMessage().contains("truncated")) {
                    throw new AiProcessingException("AI response was truncated after retry", ex);
                }
                throw new AiProcessingException("Failed to generate vocabulary content after retry: " + ex.getMessage(), ex);
            }
        }

        try {
            if (draft == null || draft.getItems() == null || draft.getItems().isEmpty()) {
                throw new AiProcessingException("AI returned no vocabulary items.");
            }

            List<AdminVocabularyAiDraft.ItemDraft> validItems = new ArrayList<>();
            int totalOriginal = draft.getItems().size();
            for (AdminVocabularyAiDraft.ItemDraft item : draft.getItems()) {
                if (item != null && item.getJapanese() != null && !item.getJapanese().isBlank()
                        && item.getMeaning() != null && !item.getMeaning().isBlank()) {
                    validItems.add(item);
                }
            }

            if (validItems.isEmpty()) {
                throw new AiProcessingException("Zero valid vocabulary items were generated by AI.");
            }

            draft.setItems(validItems);
            String warning = null;
            if (validItems.size() < totalOriginal) {
                warning = String.format("Filtered out %d incomplete vocabulary items out of %d.", 
                    (totalOriginal - validItems.size()), totalOriginal);
            }

            return AdminAiContentGenerateResponse.builder()
                    .skillType("VOCABULARY")
                    .level(level)
                    .vocabularyDraft(draft)
                    .warning(warning)
                    .build();
        } catch (AiProcessingException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process vocabulary AI draft: {}", e.getMessage());
            throw new AiProcessingException("Failed to generate vocabulary content: " + e.getMessage(), e);
        }
    }

    private AdminAiContentGenerateResponse generateGrammarContent(
            String level, 
            AdminAiContentGenerateRequest request,
            String documentText,
            String lessonContext) {
        
        String systemPrompt = "You are an AI assistant for Japanese language learning content creation. " +
                "Always respond with raw valid JSON.";
        
        String userPrompt = AiPromptBuilder.buildAdminGrammarGenerationPrompt(
                level,
                request.getLessonTitle(),
                request.getLessonNumber(),
                request.getLessonDescription(),
                request.getGrammarTopic() != null ? request.getGrammarTopic() : request.getTopic(),
                request.getItemCount(), 
                request.getCustomInstructions(),
                documentText,
                lessonContext);

        String rawJson = null;
        try {
            rawJson = aiCoreService.chat(systemPrompt, userPrompt, null, AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION);
        } catch (Exception e) {
            log.error("First Grammar AI call failed: {}", e.getMessage());
        }

        AdminGrammarAiDraft draft = null;
        try {
            if (rawJson == null) throw new IllegalArgumentException("First AI call returned null/failed");
            String normalized = normalizeAiJson(rawJson);
            draft = objectMapper.readValue(normalized, AdminGrammarAiDraft.class);
        } catch (Exception e) {
            log.warn("First Grammar parse attempt failed. Raw response: {}", rawJson);
            log.warn("Parse error: {}. Retrying AI call...", e.getMessage());

            String retryPrompt = userPrompt + "\n\nCRITICAL RETRY INSTRUCTION:\n" +
                    "Return ONLY valid JSON.\n" +
                    "Use double quotes for every JSON field name and string value.\n" +
                    "Do not use markdown.\n" +
                    "Do not use backticks.\n" +
                    "Do not prefix keys with '='.\n" +
                    "Do not include multiple consecutive commas.\n" +
                    "Do not include explanations.";

            String retryRawJson = null;
            try {
                retryRawJson = aiCoreService.chat(systemPrompt, retryPrompt, null, AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION);
                String retryNormalized = normalizeAiJson(retryRawJson);
                draft = objectMapper.readValue(retryNormalized, AdminGrammarAiDraft.class);
            } catch (Exception ex) {
                log.error("Retry Grammar parse attempt also failed. Raw response: {}", retryRawJson);
                throw new AiProcessingException("Failed to generate grammar content after retry: " + ex.getMessage(), ex);
            }
        }

        try {
            if (draft == null || draft.getItems() == null || draft.getItems().isEmpty()) {
                throw new AiProcessingException("AI returned no grammar items.");
            }

            List<AdminGrammarAiDraft.ItemDraft> validItems = new ArrayList<>();
            int totalOriginal = draft.getItems().size();
            for (AdminGrammarAiDraft.ItemDraft item : draft.getItems()) {
                if (item != null && item.getGrammarPoint() != null && !item.getGrammarPoint().isBlank()
                        && item.getMeaningVietnamese() != null && !item.getMeaningVietnamese().isBlank()) {
                    validItems.add(item);
                }
            }

            if (validItems.isEmpty()) {
                throw new AiProcessingException("Zero valid grammar points were generated by AI.");
            }

            draft.setItems(validItems);
            String warning = null;
            if (validItems.size() < totalOriginal) {
                warning = String.format("Filtered out %d incomplete grammar points out of %d.", 
                    (totalOriginal - validItems.size()), totalOriginal);
            }

            return AdminAiContentGenerateResponse.builder()
                    .skillType("GRAMMAR")
                    .level(level)
                    .grammarDraft(draft)
                    .warning(warning)
                    .build();
        } catch (AiProcessingException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process grammar AI draft: {}", e.getMessage());
            throw new AiProcessingException("Failed to generate grammar content: " + e.getMessage(), e);
        }
    }

    private AdminAiContentGenerateResponse generateReadingContent(
            String level, 
            AdminAiContentGenerateRequest request,
            String documentText,
            String lessonContext) {
        
        String systemPrompt = "You are an AI assistant for Japanese language learning content creation. " +
                "Always respond with raw valid JSON.";
        
        String userPrompt = AiPromptBuilder.buildAdminReadingGenerationPrompt(
                level,
                request.getLessonTitle(),
                request.getLessonNumber(),
                request.getLessonDescription(),
                request.getTopic(), 
                request.getPassageCount(), 
                request.getQuestionsPerPassage(),
                request.getDifficulty(), 
                request.getPassageLength(), 
                request.getCustomInstructions(),
                documentText,
                lessonContext);

        String rawJson = null;
        try {
            rawJson = aiCoreService.chat(systemPrompt, userPrompt, null, AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION);
        } catch (Exception e) {
            log.error("First Reading AI call failed: {}", e.getMessage());
        }

        AdminReadingAiDraft draft = null;
        try {
            if (rawJson == null) throw new IllegalArgumentException("First AI call returned null/failed");
            String normalized = normalizeAiJson(rawJson);
            draft = objectMapper.readValue(normalized, AdminReadingAiDraft.class);
        } catch (Exception e) {
            log.warn("First Reading parse attempt failed. Raw response: {}", rawJson);
            log.warn("Parse error: {}. Retrying AI call...", e.getMessage());

            String retryPrompt = userPrompt + "\n\nCRITICAL RETRY INSTRUCTION:\n" +
                    "Return ONLY valid JSON.\n" +
                    "Use double quotes for every JSON field name and string value.\n" +
                    "Do not use markdown.\n" +
                    "Do not use backticks.\n" +
                    "Do not prefix keys with '='.\n" +
                    "Do not include multiple consecutive commas.\n" +
                    "Do not include explanations.";

            String retryRawJson = null;
            try {
                retryRawJson = aiCoreService.chat(systemPrompt, retryPrompt, null, AiTaskType.ADMIN_CONTENT_LIBRARY_GENERATION);
                String retryNormalized = normalizeAiJson(retryRawJson);
                draft = objectMapper.readValue(retryNormalized, AdminReadingAiDraft.class);
            } catch (Exception ex) {
                log.error("Retry Reading parse attempt also failed. Raw response: {}", retryRawJson);
                throw new AiProcessingException("Failed to generate reading content after retry: " + ex.getMessage(), ex);
            }
        }

        try {
            if (draft == null || draft.getPassages() == null || draft.getPassages().isEmpty()) {
                throw new AiProcessingException("AI returned no reading passages.");
            }

            List<AdminReadingAiDraft.PassageDraft> validPassages = new ArrayList<>();
            int originalPassagesCount = draft.getPassages().size();
            int originalQuestionsCount = 0;
            int validQuestionsCount = 0;

            for (AdminReadingAiDraft.PassageDraft passage : draft.getPassages()) {
                if (passage != null && passage.getContent() != null && !passage.getContent().isBlank()) {
                    if (passage.getQuestions() != null) {
                        originalQuestionsCount += passage.getQuestions().size();
                        List<AdminReadingAiDraft.QuestionDraft> validQuestions = new ArrayList<>();
                        for (AdminReadingAiDraft.QuestionDraft q : passage.getQuestions()) {
                            if (q != null && q.getQuestionText() != null && !q.getQuestionText().isBlank()
                                    && q.getOptions() != null && !q.getOptions().isEmpty()) {
                                validQuestions.add(q);
                                validQuestionsCount++;
                            }
                        }
                        passage.setQuestions(validQuestions);
                    }
                    validPassages.add(passage);
                }
            }

            if (validPassages.isEmpty()) {
                throw new AiProcessingException("Zero valid reading passages were generated by AI.");
            }

            draft.setPassages(validPassages);
            String warning = null;
            if (validPassages.size() < originalPassagesCount || validQuestionsCount < originalQuestionsCount) {
                warning = "Some incomplete reading passages or questions were filtered out.";
            }

            return AdminAiContentGenerateResponse.builder()
                    .skillType("READING")
                    .level(level)
                    .readingDraft(draft)
                    .warning(warning)
                    .build();
        } catch (AiProcessingException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process reading AI draft: {}", e.getMessage());
            throw new AiProcessingException("Failed to generate reading content: " + e.getMessage(), e);
        }
    }
}
