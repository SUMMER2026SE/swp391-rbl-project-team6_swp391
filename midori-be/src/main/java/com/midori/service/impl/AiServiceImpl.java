package com.midori.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.prompt.AiPromptBuilder;
import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
import com.midori.dto.ai.ExplainResponse;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.dto.ai.GeneratedQuestionDto;
import com.midori.entity.AiConversation;
import com.midori.entity.AiMessage;
import com.midori.entity.User;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.AiConversationRepository;
import com.midori.repository.AiMessageRepository;
import com.midori.repository.UserRepository;
import com.midori.service.AiService;
import com.midori.dto.ai.AiMessageResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

/**
 * AI Service implementation using AiCoreService for centralized AI operations.
 * 
 * This service handles:
 * - Chat conversations with AI Sensei
 * - Question generation from material content
 * - Local fallback when AI is unavailable
 * 
 * All AI operations go through AiCoreService, which handles
 * provider selection, fallback, and key rotation.
 */
@Slf4j
@Service
public class AiServiceImpl implements AiService {

    private static final Pattern THINK_TAG_PATTERN = Pattern.compile(
            "<think>|</think>|<think>.*?</think>|<think>.*?</think>",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern HTML_ENTITY_PATTERN = Pattern.compile("&(?:amp|lt|gt|quot|apos|#39|#x27);");

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiCoreService aiCoreService;
    private final ObjectMapper objectMapper;
    private final boolean fallbackEnabled;

    private volatile String lastModelUsed;

    @Autowired
    public AiServiceImpl(
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AiCoreService aiCoreService,
            ObjectMapper objectMapper,
            @Value("${ai.fallback-enabled:false}") boolean fallbackEnabled) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.aiCoreService = aiCoreService;
        this.objectMapper = objectMapper;
        this.fallbackEnabled = fallbackEnabled;
        log.info("[AiService] AI Service initialized with AiCoreService, fallbackEnabled: {}", fallbackEnabled);
    }

    /**
     * Strip XML-style and plain think tags from AI response content before persisting.
     */
    private String sanitizeAiContent(String content) {
        if (content == null) return null;
        String cleaned = THINK_TAG_PATTERN.matcher(content).replaceAll("").trim();
        return decodeHtmlEntities(cleaned);
    }

    /**
     * Decode the most common HTML entities. Some LLM providers HTML-escape
     * parts of their text output (e.g. 聞く), which then leaks into
     * the chat UI as the literal string "&quot;聞く&quot;".
     *
     * <p>This is applied to both the material content (before being inserted
     * into the prompt) and the LLM response (before being persisted and
     * returned to the client) so the user always sees the original characters.
     */
    private String decodeHtmlEntities(String value) {
        if (value == null || value.isEmpty()) return value;
        if (!HTML_ENTITY_PATTERN.matcher(value).find()) {
            return value;
        }
        return value
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&#39;", "'")
                .replace("&#x27;", "'")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }

    /**
     * Determine whether a request has an actually usable selected material
     * (non-null reference and non-blank content). A title-only entry is NOT
     * enough to answer material-based questions.
     */
    private boolean hasUsableMaterial(ChatRequest.MaterialInfo material) {
        return material != null
                && material.getContent() != null
                && !material.getContent().isBlank();
    }

    /**
     * Build effective system prompt with material content if available.
     *
     * <p>The material content is HTML-entity-decoded before being inserted into
     * the prompt. This prevents the LLM from seeing and re-emitting escaped
     * forms like "&quot;聞く&quot;" as if they were literal text.
     */
    private String buildSystemPrompt(ChatRequest.MaterialInfo material) {
        if (!hasUsableMaterial(material)) {
            return AiPromptBuilder.getChatSystemPrompt();
        }

        // Decode HTML entities in the material content so the model sees the
        // real Japanese characters (e.g. 聞く instead of &quot;聞く&quot;).
        String decodedContent = decodeHtmlEntities(material.getContent());

        return AiPromptBuilder.buildChatSystemPromptWithMaterial(
                material.getTitle(),
                material.getType(),
                material.getLevel(),
                decodedContent
        );
    }

    @Override
    public List<AiConversationResponse> getUserConversations(UUID userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(this::toConversationResponse)
                .toList();
    }

    @Override
    public AiConversation getConversation(UUID conversationId, UUID userId) {
        AiConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conversation.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Conversation not found");
        }
        return conversation;
    }

    @Override
    public ConversationMessagesResponse getConversationMessages(UUID conversationId, UUID userId) {
        AiConversation conversation = getConversation(conversationId, userId);
        List<AiMessageResponse> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::toMessageResponse)
                .toList();

        return ConversationMessagesResponse.builder()
                .conversationId(conversationId)
                .messages(messages)
                .build();
    }

    @Override
    @Transactional
    public ChatResponse chat(UUID userId, UUID conversationId, String message, ChatRequest.MaterialInfo selectedMaterial) {
        AiConversation conversation;

        if (conversationId != null) {
            conversation = getConversation(conversationId, userId);
        } else {
            conversation = AiConversation.builder()
                    .user(User.builder().id(userId).build())
                    .title(message.length() > 60 ? message.substring(0, 60) + "..." : message)
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        // Save USER message
        AiMessage userMessage = AiMessage.builder()
                .conversation(conversation)
                .role("USER")
                .content(message)
                .build();
        messageRepository.save(userMessage);

        // Guard: if the user clearly asks about a selected material
        // ("tài liệu này", "bài học này", "material này", ...)
        // but the request did not include an actual material payload,
        // do not let the LLM fabricate content. Reply with a fixed fallback
        // and persist it as the assistant turn.
        if (!hasUsableMaterial(selectedMaterial)
                && AiPromptBuilder.refersToSelectedMaterial(message)) {
            String reply = AiPromptBuilder.noMaterialSelectedFallback();
            AiMessage aiMessage = AiMessage.builder()
                    .conversation(conversation)
                    .role("ASSISTANT")
                    .content(reply)
                    .build();
            aiMessage = messageRepository.save(aiMessage);

            if (conversation.getTitle() == null || conversation.getTitle().isEmpty()) {
                String newTitle = message.length() > 60 ? message.substring(0, 60) + "..." : message;
                conversation.setTitle(newTitle);
                conversationRepository.save(conversation);
            }

            log.info("[AiService] No material selected but user asked about a material. Returning fixed fallback.");

            return ChatResponse.builder()
                    .conversationId(conversation.getId())
                    .reply(reply)
                    .createdAt(aiMessage.getCreatedAt())
                    .modelUsed(null)
                    .build();
        }

        String effectivePrompt = buildSystemPrompt(selectedMaterial);

        // Get conversation history for context
        List<String[]> history = getConversationHistory(conversation.getId());

        // Call AI through AiCoreService
        String reply;
        String modelUsed = null;
        try {
            reply = aiCoreService.chat(effectivePrompt, message, history);
            // Get model info from the provider
            try {
                modelUsed = aiCoreService.getCurrentProvider().getLastModelUsed();
            } catch (Exception ignored) {}
        } catch (IllegalStateException e) {
            log.warn("[AiService] AI provider not configured: {}", e.getMessage());
            reply = "Xin lỗi, AI Sensei chưa được cấu hình. Vui lòng liên hệ quản trị viên để cấu hình API.";
        } catch (Exception e) {
            log.error("[AiService] Error calling AI: {}", e.getMessage());
            String errorDetail = e.getMessage();
            if (errorDetail.contains("429")) {
                reply = "Xin lỗi, AI Sensei đang quá tải. Vui lòng thử lại sau khoảng 1 phút.";
            } else if (errorDetail.contains("401") || errorDetail.contains("403")) {
                reply = "Xin lỗi, API key của AI Sensei không hợp lệ. Vui lòng liên hệ quản trị viên.";
            } else if (errorDetail.contains("400")) {
                reply = "Xin lỗi, yêu cầu không hợp lệ. Vui lòng thử lại.";
            } else if (errorDetail.contains("empty") || errorDetail.contains("quota")) {
                reply = "Xin lỗi, đã hết quota API. Vui lòng thử lại sau hoặc liên hệ quản trị viên.";
            } else {
                reply = "Xin lỗi, đã xảy ra lỗi khi gọi AI. Vui lòng thử lại sau.";
            }
        }

        // Guard: ensure reply is never null, blank, or literal "null"
        if (reply == null || reply.trim().isEmpty() || "null".equalsIgnoreCase(reply.trim())) {
            log.warn("[AiService] AI returned null/blank response, using fallback message");
            reply = "Xin lỗi, AI Sensei chưa tạo được câu trả lời. Vui lòng thử lại.";
        }

        // Strip think/internal tags before persisting
        reply = sanitizeAiContent(reply);

        // Save ASSISTANT response
        AiMessage aiMessage = AiMessage.builder()
                .conversation(conversation)
                .role("ASSISTANT")
                .content(reply)
                .build();
        aiMessage = messageRepository.save(aiMessage);

        // Update conversation title if this is the first message
        if (conversation.getTitle() == null || conversation.getTitle().isEmpty()) {
            String newTitle = message.length() > 60 ? message.substring(0, 60) + "..." : message;
            conversation.setTitle(newTitle);
            conversationRepository.save(conversation);
        }

        return ChatResponse.builder()
                .conversationId(conversation.getId())
                .reply(reply)
                .createdAt(aiMessage.getCreatedAt())
                .modelUsed(modelUsed)
                .build();
    }

    @Override
    public ExplainResponse explain(String sentence, String word) {
        String systemPrompt = AiPromptBuilder.buildExplanationPrompt(sentence, word);

        String rawResponse;
        try {
            rawResponse = aiCoreService.chat(systemPrompt, sentence, List.of());
        } catch (IllegalStateException e) {
            log.warn("[AiService] AI provider not configured for explain: {}", e.getMessage());
            return ExplainResponse.builder()
                    .grammarExplanation("Xin lỗi, AI Sensei chưa được cấu hình. Vui lòng liên hệ quản trị viên.")
                    .wordUsage("Xin lỗi, AI Sensei chưa được cấu hình. Vui lòng liên hệ quản trị viên.")
                    .nuance("Xin lỗi, AI Sensei chưa được cấu hình. Vui lòng liên hệ quản trị viên.")
                    .context("Xin lỗi, AI Sensei chưa được cấu hình. Vui lòng liên hệ quản trị viên.")
                    .build();
        } catch (Exception e) {
            log.error("[AiService] Error calling AI for explain: {}", e.getMessage());
            String fallback = "Xin lỗi, đã xảy ra lỗi khi gọi AI. Vui lòng thử lại sau.";
            return ExplainResponse.builder()
                    .grammarExplanation(fallback)
                    .wordUsage(fallback)
                    .nuance(fallback)
                    .context(fallback)
                    .build();
        }

        ExplainResponse response = ExplainResponse.fromRawResponse(rawResponse);

        try {
            lastModelUsed = aiCoreService.getCurrentProvider().getLastModelUsed();
        } catch (Exception ignored) {
            // model info is optional for this endpoint
        }

        return response;
    }

    @Override
    public GenerateQuestionsResponse generateQuestions(String topic, String level, Integer count, String type, String materialContent) {
        int actualCount = Math.max(1, Math.min(count != null ? count : 5, 20));
        String difficulty = level != null ? level : "MEDIUM";
        String questionType = type != null ? type : "MULTIPLE_CHOICE";
        if (!"MULTIPLE_CHOICE".equalsIgnoreCase(questionType)
                && !"TRUE_FALSE".equalsIgnoreCase(questionType)
                && !"FILL_BLANK".equalsIgnoreCase(questionType)
                && !"MIXED".equalsIgnoreCase(questionType)) {
            questionType = "MULTIPLE_CHOICE";
        }
        questionType = questionType.toUpperCase();

        List<GeneratedQuestionDto> questions = new ArrayList<>();
        String errorMessage = null;
        boolean usedFallback = false;
        String source = "AI";

        // Try AI provider through AiCoreService
        try {
            String jsonResponse = aiCoreService.generateQuestions(topic, materialContent, actualCount, questionType, difficulty);
            List<GeneratedQuestionDto> parsed = parseQuestionsFromJson(jsonResponse, difficulty);
            if (!"MIXED".equalsIgnoreCase(questionType)) {
                parsed = enforceSingleQuestionType(parsed, questionType);
            }
            if (parsed.isEmpty()) {
                throw new IllegalStateException("No valid questions after type enforcement");
            }
            questions = parsed;
            log.info("[AiService] Successfully generated {} questions from AI provider", questions.size());
        } catch (IllegalStateException e) {
            log.warn("[AiService] AI provider not configured: {}", e.getMessage());
            errorMessage = "AI provider chưa được cấu hình. Vui lòng liên hệ quản trị viên.";
        } catch (Exception e) {
            log.error("[AiService] Error generating questions from AI: {}", e.getMessage());
            String errorDetail = e.getMessage();
            if (errorDetail.contains("429")) {
                errorMessage = "Xin lỗi, AI Sensei đang quá tải. Vui lòng thử lại sau khoảng 1 phút.";
            } else if (errorDetail.contains("401") || errorDetail.contains("403")) {
                errorMessage = "API key AI không hợp lệ. Vui lòng liên hệ quản trị viên.";
            } else if (errorDetail.contains("400")) {
                errorMessage = "Yêu cầu không hợp lệ. Vui lòng thử lại.";
            } else if (errorDetail.contains("quota") || errorDetail.contains("empty")) {
                errorMessage = "Xin lỗi, đã hết quota API. Vui lòng thử lại sau.";
            } else {
                errorMessage = "Xin lỗi, đã xảy ra lỗi khi tạo quiz. Vui lòng thử lại sau.";
            }
        }

        // In strict mode (fallbackEnabled=false), return error instead of generating local fallback
        if (questions.isEmpty()) {
            if (!fallbackEnabled) {
                log.warn("[AiService] AI quiz generation failed in strict mode (fallbackEnabled=false). errorMessage={}", errorMessage);
                return GenerateQuestionsResponse.builder()
                        .materialTitle(topic)
                        .questions(List.of())
                        .errorMessage(errorMessage != null ? errorMessage
                                : "Xin lỗi, đã xảy ra lỗi khi tạo quiz. Vui lòng thử lại sau.")
                        .isFallback(false)
                        .source("AI")
                        .build();
            }

            // Legacy fallback mode (fallbackEnabled=true): generate questions from material content
            log.warn("[AiService] AI quiz generation failed, using local fallback (fallbackEnabled=true)");
            if (materialContent == null || materialContent.isBlank()) {
                log.warn("[AiService] Local fallback skipped: materialContent empty");
                errorMessage = "Tài liệu chưa đủ dữ liệu để tạo quiz.";
            } else {
                questions = generateLocalQuestions(topic, materialContent, actualCount, questionType, difficulty);
                if (!questions.isEmpty()) {
                    usedFallback = true;
                    source = "LOCAL_FALLBACK";
                    errorMessage = null;
                    log.info("[AiService] Local fallback generated {} questions", questions.size());
                } else {
                    errorMessage = "Tài liệu chưa đủ dữ liệu để tạo quiz.";
                }
            }
        }

        return GenerateQuestionsResponse.builder()
                .materialTitle(topic)
                .questions(questions)
                .errorMessage(errorMessage)
                .isFallback(usedFallback)
                .source(source)
                .build();
    }

    private List<GeneratedQuestionDto> generateLocalQuestions(String topic, String materialContent, int count, String type, String difficulty) {
        List<GeneratedQuestionDto> questions = new ArrayList<>();
        String normalizedType = (type != null ? type : "MULTIPLE_CHOICE").toUpperCase();

        try {
            List<String[]> vocabItems = parseVocabFromContent(materialContent);
            List<String[]> grammarItems = parseGrammarFromContent(materialContent);

            if ("MIXED".equals(normalizedType)) {
                questions = buildMixedLocalQuestions(topic, materialContent, count, difficulty, vocabItems, grammarItems);
                return questions;
            }

            int target = Math.min(count, 20);
            if (!vocabItems.isEmpty()) {
                List<Object[]> vocabPool = new ArrayList<>();
                for (String[] v : vocabItems) vocabPool.add(v);
                List<String[]> shuffled = new ArrayList<>(vocabItems);
                Collections.shuffle(shuffled);
                for (int i = 0; i < target; i++) {
                    String[] v = shuffled.get(i % shuffled.size());
                    questions.addAll(generateVocabQuestions(v, vocabPool, i, normalizedType, difficulty));
                }
            }
            if (questions.size() < target && !grammarItems.isEmpty()) {
                List<Object[]> grammarPool = new ArrayList<>();
                for (String[] g : grammarItems) grammarPool.add(g);
                List<String[]> shuffled = new ArrayList<>(grammarItems);
                Collections.shuffle(shuffled);
                int need = target - questions.size();
                for (int i = 0; i < need; i++) {
                    String[] g = shuffled.get(i % grammarItems.size());
                    questions.addAll(generateGrammarQuestions(g, grammarPool, i, normalizedType, difficulty));
                }
            }

            if (questions.isEmpty()) {
                for (int i = 0; i < target; i++) {
                    questions.add(buildGenericLocalQuestion(topic, i, normalizedType, difficulty));
                }
            }
        } catch (Exception e) {
            log.error("[AiService] Error generating local questions: {}", e.getMessage());
        }

        return questions.stream().limit(Math.min(count, 20)).toList();
    }

    private List<GeneratedQuestionDto> buildMixedLocalQuestions(String topic, String materialContent, int count, String difficulty,
                                                               List<String[]> vocabItems, List<String[]> grammarItems) {
        List<GeneratedQuestionDto> questions = new ArrayList<>();
        String[] cycle = {"MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"};
        List<Object[]> pool = new ArrayList<>();
        for (String[] v : vocabItems) pool.add(new Object[]{"VOCAB", v});
        for (String[] g : grammarItems) pool.add(new Object[]{"GRAMMAR", g});
        Collections.shuffle(pool);

        if (pool.isEmpty()) {
            for (int i = 0; i < Math.min(count, 5); i++) {
                questions.add(buildGenericLocalQuestion(topic, i, cycle[i % cycle.length], difficulty));
            }
            return questions;
        }

        for (int i = 0; i < Math.min(count, 20); i++) {
            String qType = cycle[i % cycle.length];
            Object[] item = pool.get(i % pool.size());
            String itemType = (String) item[0];
            if ("VOCAB".equals(itemType)) {
                String[] v = (String[]) item[1];
                questions.addAll(generateVocabQuestions(v, pool, i, qType, difficulty));
            } else {
                String[] g = (String[]) item[1];
                questions.addAll(generateGrammarQuestions(g, pool, i, qType, difficulty));
            }
            if (questions.size() >= count) break;
        }

        return questions;
    }

    private GeneratedQuestionDto buildGenericLocalQuestion(String topic, int index, String type, String difficulty) {
        String qId = "fallback_generic_q_" + index;
        if ("TRUE_FALSE".equals(type)) {
            return GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("TRUE_FALSE")
                    .questionText("Bạn đã học nội dung '" + topic + "' chưa?")
                    .options(List.of("Đúng", "Sai"))
                    .correctAnswer("Đúng")
                    .explanation("Câu này chỉ nhắc lại chủ đề để bạn xác nhận tiến độ học.")
                    .difficulty(difficulty)
                    .build();
        }
        if ("FILL_BLANK".equals(type)) {
            return GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("FILL_BLANK")
                    .questionText("Điền từ/cụm từ gợi ý cho chủ đề: " + topic)
                    .options(List.of())
                    .correctAnswer("Tiếp tục học")
                    .explanation("Câu này khuyến khích bạn tiếp tục ôn tập chủ đề.")
                    .difficulty(difficulty)
                    .build();
        }
        return GeneratedQuestionDto.builder()
                .id(qId)
                .type("MULTIPLE_CHOICE")
                .questionText("Bạn có nắm được ý chính của chủ đề '" + topic + "' không?")
                .options(List.of("Nắm rất rõ", "Nắm một phần", "Cần ôn tập thêm", "Chưa nắm"))
                .correctAnswer("Nắm rất rõ")
                .explanation("Hãy tiếp tục học để củng cố kiến thức về chủ đề này.")
                .difficulty(difficulty)
                .build();
    }

    private List<GeneratedQuestionDto> generateVocabQuestions(String[] vocab, List<Object[]> allItems, int idx, String type, String difficulty) {
        List<GeneratedQuestionDto> result = new ArrayList<>();
        String japanese = vocab[0];
        String reading = vocab.length > 1 ? vocab[1] : "";
        String meaning = vocab.length > 2 ? vocab[2] : (vocab.length > 1 ? vocab[1] : "");

        if (meaning.isBlank()) return result;

        List<String> otherMeanings = new ArrayList<>();
        for (Object[] item : allItems) {
            if ("VOCAB".equals(item[0])) {
                String[] v = (String[]) item[1];
                if (!v[0].equals(japanese) && v.length > 2 && !v[2].isBlank()) {
                    otherMeanings.add(v[2]);
                }
            }
        }
        Collections.shuffle(otherMeanings);

        String qId = "fallback_v_q_" + idx;

        if ("TRUE_FALSE".equals(type)) {
            boolean isTrue = Math.random() > 0.5;
            String statement;
            String correct;
            if (isTrue) {
                statement = "「" + japanese + "」" + (reading.isEmpty() ? "" : " (" + reading + ")") + " nghĩa là " + meaning + ".";
                correct = "Đúng";
            } else {
                String wrongMeaning = otherMeanings.isEmpty() ? "không rõ" : otherMeanings.get(0);
                statement = "「" + japanese + "」" + (reading.isEmpty() ? "" : " (" + reading + ")") + " nghĩa là " + wrongMeaning + ".";
                correct = "Sai";
            }
            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("TRUE_FALSE")
                    .questionText(statement)
                    .options(List.of("Đúng", "Sai"))
                    .correctAnswer(correct)
                    .explanation(japanese + " (" + reading + ") nghĩa là " + meaning + ".")
                    .difficulty(difficulty)
                    .build());
        } else if ("FILL_BLANK".equals(type)) {
            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("FILL_BLANK")
                    .questionText("Điền nghĩa tiếng Việt của từ: 「" + japanese + "」" + (reading.isEmpty() ? "" : " (" + reading + ")") + ".")
                    .options(List.of())
                    .correctAnswer(meaning)
                    .explanation(japanese + " (" + reading + ") có nghĩa là " + meaning + ".")
                    .difficulty(difficulty)
                    .build());
        } else {
            List<String> options = new ArrayList<>();
            options.add(meaning);
            for (String om : otherMeanings) {
                if (options.size() >= 4) break;
                if (!options.contains(om)) options.add(om);
            }
            while (options.size() < 4) options.add("Không rõ");
            Collections.shuffle(options);

            String correct = options.get(0);
            String questionText;
            int rand = (int) (Math.random() * 3);
            if (rand == 0) {
                questionText = "「" + japanese + "」" + (reading.isEmpty() ? "" : " (" + reading + ")") + " có nghĩa là gì?";
            } else if (rand == 1) {
                questionText = "Từ nào có nghĩa là '" + meaning + "'?";
            } else {
                questionText = "Cách đọc đúng của 「" + japanese + "」 là gì?";
            }
            String readingQuestionTemplate = "Cách đọc đúng của 「" + japanese + "」 là gì?";
            if (readingQuestionTemplate.equals(questionText)) {
                List<String> readingOptions = new ArrayList<>();
                readingOptions.add(reading);
                for (String om : otherMeanings) {
                    if (readingOptions.size() >= 4) break;
                    if (!readingOptions.contains(om)) readingOptions.add(om);
                }
                while (readingOptions.size() < 4) readingOptions.add("?");
                Collections.shuffle(readingOptions);
                options.clear();
                options.addAll(readingOptions);
                correct = reading;
            }
            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("MULTIPLE_CHOICE")
                    .questionText(questionText)
                    .options(options)
                    .correctAnswer(correct)
                    .correctAnswerIndex(options.indexOf(correct))
                    .explanation(japanese + " (" + reading + ") có nghĩa là " + meaning + ".")
                    .difficulty(difficulty)
                    .build());
        }

        return result;
    }

    private List<GeneratedQuestionDto> generateGrammarQuestions(String[] grammar, List<Object[]> allItems, int idx, String type, String difficulty) {
        List<GeneratedQuestionDto> result = new ArrayList<>();
        String pattern = grammar.length > 0 ? grammar[0] : "";
        String meaning = grammar.length > 1 ? grammar[1] : "";
        String formation = grammar.length > 2 ? grammar[2] : "";

        if (pattern.isBlank()) return result;

        String qId = "fallback_g_q_" + idx;

        if ("TRUE_FALSE".equals(type)) {
            boolean isTrue = Math.random() > 0.5;
            String statement, correct;
            if (isTrue) {
                statement = "Mẫu 「" + pattern + "」 dùng để diễn đạt: " + meaning + ".";
                correct = "Đúng";
            } else {
                statement = "Mẫu 「" + pattern + "」 dùng để: ăn uống.";
                correct = "Sai";
            }
            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("TRUE_FALSE")
                    .questionText(statement)
                    .options(List.of("Đúng", "Sai"))
                    .correctAnswer(correct)
                    .explanation("「" + pattern + "」 dùng để diễn đạt: " + meaning + ".")
                    .difficulty(difficulty)
                    .build());
        } else if ("FILL_BLANK".equals(type)) {
            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("FILL_BLANK")
                    .questionText("Hoàn thành câu dùng mẫu 「" + pattern + "」: ______")
                    .options(List.of())
                    .correctAnswer(meaning)
                    .explanation("「" + pattern + "」 dùng để diễn đạt: " + meaning + ".")
                    .difficulty(difficulty)
                    .build());
        } else {
            List<String> options = new ArrayList<>();
            options.add(meaning);
            options.add("Diễn đạt sự chủ động");
            options.add("Diễn đạt sự bị động");
            options.add("Diễn đạt sự khiếu nại");
            Collections.shuffle(options);

            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("MULTIPLE_CHOICE")
                    .questionText("Mẫu 「" + pattern + "」" + (formation.isBlank() ? "" : " (" + formation + ")") + " dùng để làm gì?")
                    .options(options)
                    .correctAnswer(meaning)
                    .correctAnswerIndex(options.indexOf(meaning) >= 0 ? options.indexOf(meaning) : 0)
                    .explanation("「" + pattern + "」 dùng để: " + meaning + ".")
                    .difficulty(difficulty)
                    .build());
        }

        return result;
    }

    private List<String[]> parseGrammarFromContent(String content) {
        List<String[]> items = new ArrayList<>();
        if (content == null || content.isBlank()) {
            return items;
        }

        try {
            String[] lines = content.split("\n");
            for (String line : lines) {
                if (line.contains("|") && line.contains("nghĩa")) {
                    String[] parts = line.split("\\|");
                    String pattern = parts[0].trim();
                    String meaning = "";
                    String formation = "";
                    for (int i = 1; i < parts.length; i++) {
                        String p = parts[i].trim();
                        if (p.toLowerCase().startsWith("nghĩa")) meaning = p.replaceFirst("(?i)nghĩa[:\\s]*", "");
                        if (p.toLowerCase().startsWith("cấu trúc") || p.toLowerCase().startsWith("formation"))
                            formation = p.replaceFirst("(?i)(cấu trúc|formation)[:\\s]*", "");
                    }
                    if (!pattern.isEmpty()) {
                        items.add(new String[]{pattern, meaning, formation});
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[AiService] Error parsing grammar from content: {}", e.getMessage());
        }

        return items;
    }

    private List<String[]> parseVocabFromContent(String content) {
        List<String[]> items = new ArrayList<>();
        if (content == null || content.isBlank()) {
            return items;
        }

        try {
            String[] lines = content.split("\n");
            for (String line : lines) {
                if (line.isBlank()) continue;

                String trimmed = line.trim();
                if (trimmed.startsWith("-")) {
                    trimmed = trimmed.substring(1).trim();
                }

                if (trimmed.contains("|")) {
                    String[] parts = trimmed.split("\\|");
                    if (parts.length >= 3) {
                        String japanese = parts[0].trim();
                        String reading = parts[1].trim();
                        String meaning = parts[2].trim();
                        if (!japanese.isEmpty() && !meaning.isEmpty()) {
                            items.add(new String[]{japanese, reading, meaning});
                        }
                    }
                    continue;
                }

                if (trimmed.contains("=")) {
                    String[] parts = trimmed.split("=", 2);
                    String left = parts[0].trim();
                    String meaning = parts[1].trim();
                    if (meaning.isBlank()) continue;

                    String reading = "";
                    if (left.contains("(") && left.contains(")")) {
                        int start = left.lastIndexOf("(");
                        int end = left.lastIndexOf(")");
                        if (start >= 0 && end > start) {
                            reading = left.substring(start + 1, end).trim();
                            left = left.substring(0, start).trim();
                        }
                    }
                    String japanese = left.trim();
                    if (!japanese.isEmpty()) {
                        items.add(new String[]{japanese, reading, meaning});
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[AiService] Error parsing vocab from content: {}", e.getMessage());
        }

        return items;
    }

    @Override
    @Transactional
    public void deleteConversation(UUID conversationId, UUID userId) {
        AiConversation conversation = getConversation(conversationId, userId);
        conversationRepository.delete(conversation);
    }

    @Override
    @Transactional
    public AiConversationResponse updateConversationTitle(UUID conversationId, UUID userId, String title) {
        AiConversation conversation = getConversation(conversationId, userId);

        String trimmedTitle = title != null ? title.trim() : "";
        if (trimmedTitle.isEmpty()) {
            throw new IllegalArgumentException("Title must not be blank after trimming");
        }

        conversation.setTitle(trimmedTitle);
        conversation.setUpdatedAt(Instant.now());
        AiConversation saved = conversationRepository.save(conversation);

        return toConversationResponse(saved);
    }

    @Override
    @Transactional
    public ConversationMessagesResponse updateUserMessage(UUID conversationId, UUID messageId, UUID userId, String content, ChatRequest.MaterialInfo selectedMaterial) {
        getConversation(conversationId, userId);

        AiMessage targetMessage = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!targetMessage.getConversation().getId().equals(conversationId)) {
            throw new ResourceNotFoundException("Message not found in this conversation");
        }

        if (!"USER".equals(targetMessage.getRole())) {
            throw new IllegalArgumentException("Only USER messages can be edited");
        }

        List<AiMessage> allMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        AiMessage lastUserMessage = null;
        for (int i = allMessages.size() - 1; i >= 0; i--) {
            if ("USER".equals(allMessages.get(i).getRole())) {
                lastUserMessage = allMessages.get(i);
                break;
            }
        }
        if (lastUserMessage == null || !lastUserMessage.getId().equals(messageId)) {
            throw new IllegalArgumentException("Only the most recent USER message can be edited");
        }

        String trimmedContent = content != null ? content.trim() : "";
        if (trimmedContent.isEmpty()) {
            throw new IllegalArgumentException("Content must not be blank after trimming");
        }

        targetMessage.setContent(trimmedContent);
        messageRepository.save(targetMessage);

        AiMessage assistantToDelete = null;
        int userIndex = allMessages.indexOf(targetMessage);
        if (userIndex >= 0 && userIndex + 1 < allMessages.size()) {
            AiMessage nextMsg = allMessages.get(userIndex + 1);
            if ("ASSISTANT".equals(nextMsg.getRole())) {
                assistantToDelete = nextMsg;
            }
        }

        List<String[]> history = getConversationHistoryExcluding(conversationId, assistantToDelete != null ? assistantToDelete.getId() : null);

        String effectivePrompt = buildSystemPrompt(selectedMaterial);
        String newReply;

        // Same no-material guard as chat(): if the edited message refers to a
        // material but no material is attached, do not let the LLM invent one.
        if (!hasUsableMaterial(selectedMaterial)
                && AiPromptBuilder.refersToSelectedMaterial(trimmedContent)) {
            newReply = AiPromptBuilder.noMaterialSelectedFallback();
            log.info("[AiService] No material selected on edit-and-regenerate. Returning fixed fallback.");
        } else {
            try {
                newReply = aiCoreService.chat(effectivePrompt, trimmedContent, history);
            } catch (IllegalStateException e) {
                newReply = "Xin lỗi, AI Sensei chưa được cấu hình. Vui lòng liên hệ quản trị viên.";
            } catch (Exception e) {
                log.error("Error regenerating response: {}", e.getMessage());
                newReply = "Xin lỗi, đã xảy ra lỗi khi gọi AI. Vui lòng thử lại sau.";
            }

            if (newReply == null || newReply.trim().isEmpty() || "null".equalsIgnoreCase(newReply.trim())) {
                log.warn("[AiService] LLM returned null/blank response on regenerate");
                newReply = "Xin lỗi, AI Sensei chưa tạo được câu trả lời. Vui lòng thử lại.";
            }
        }

        newReply = sanitizeAiContent(newReply);

        AiMessage newAssistantMessage = AiMessage.builder()
                .conversation(targetMessage.getConversation())
                .role("ASSISTANT")
                .content(newReply)
                .build();

        if (assistantToDelete != null) {
            messageRepository.delete(assistantToDelete);
        }

        messageRepository.save(newAssistantMessage);

        AiConversation conversation = targetMessage.getConversation();
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        List<AiMessageResponse> updatedMessages = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::toMessageResponse)
                .toList();

        return ConversationMessagesResponse.builder()
                .conversationId(conversationId)
                .messages(updatedMessages)
                .build();
    }

    private List<String[]> getConversationHistory(UUID conversationId) {
        List<AiMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        List<String[]> history = new ArrayList<>();
        for (AiMessage msg : messages) {
            history.add(new String[]{msg.getRole(), msg.getContent()});
        }
        return history;
    }

    private List<String[]> getConversationHistoryExcluding(UUID conversationId, UUID excludeMessageId) {
        List<AiMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        List<String[]> history = new ArrayList<>();
        for (AiMessage msg : messages) {
            if (excludeMessageId != null && msg.getId().equals(excludeMessageId)) {
                continue;
            }
            history.add(new String[]{msg.getRole(), msg.getContent()});
        }
        return history;
    }

    private List<GeneratedQuestionDto> enforceSingleQuestionType(List<GeneratedQuestionDto> questions, String expectedType) {
        if (questions == null || questions.isEmpty()) {
            return questions;
        }
        List<GeneratedQuestionDto> valid = new ArrayList<>();
        for (GeneratedQuestionDto q : questions) {
            String type = q.getType();
            if (type == null) {
                type = "MULTIPLE_CHOICE";
            }
            type = type.toUpperCase();
            if (!expectedType.equals(type)) {
                continue;
            }
            String questionText = q.getQuestionText();
            if (questionText == null || questionText.isBlank()) {
                continue;
            }

            String correctAnswer = q.getCorrectAnswer();
            if ((correctAnswer == null || correctAnswer.isBlank()) && q.getOptions() != null && q.getCorrectAnswerIndex() != null
                    && q.getCorrectAnswerIndex() >= 0 && q.getCorrectAnswerIndex() < q.getOptions().size()) {
                correctAnswer = q.getOptions().get(q.getCorrectAnswerIndex());
            }
            if (correctAnswer == null || correctAnswer.isBlank()) {
                continue;
            }

            valid.add(GeneratedQuestionDto.builder()
                    .id(q.getId())
                    .type(expectedType)
                    .questionText(questionText)
                    .options(q.getOptions())
                    .correctAnswerIndex(q.getCorrectAnswerIndex())
                    .correctAnswer(correctAnswer)
                    .explanation(q.getExplanation())
                    .difficulty(q.getDifficulty())
                    .build());
        }
        return valid;
    }

    private List<GeneratedQuestionDto> parseQuestionsFromJson(String jsonResponse, String difficulty) {
        List<GeneratedQuestionDto> questions = new ArrayList<>();
        try {
            String cleanedJson = jsonResponse.trim();
            if (cleanedJson.startsWith("```json")) {
                cleanedJson = cleanedJson.substring(7);
            }
            if (cleanedJson.startsWith("```")) {
                cleanedJson = cleanedJson.substring(3);
            }
            if (cleanedJson.endsWith("```")) {
                cleanedJson = cleanedJson.substring(0, cleanedJson.length() - 3);
            }
            cleanedJson = cleanedJson.trim();

            JsonNode root = objectMapper.readTree(cleanedJson);
            JsonNode questionsNode = root.path("questions");
            if (questionsNode.isArray()) {
                int qIndex = 0;
                for (JsonNode qNode : questionsNode) {
                    String qId = qNode.has("id") && !qNode.path("id").isMissingNode()
                            ? qNode.path("id").asText() : "q_" + qIndex;
                    qIndex++;
                    List<String> options = new ArrayList<>();
                    JsonNode optionsNode = qNode.path("options");
                    if (optionsNode.isArray()) {
                        for (JsonNode opt : optionsNode) {
                            options.add(opt.asText());
                        }
                    }

                    int correctIndex = 0;
                    String correctAnswer = "";

                    if (qNode.has("correctAnswer") && !qNode.path("correctAnswer").isMissingNode()) {
                        correctAnswer = qNode.path("correctAnswer").asText();
                        for (int i = 0; i < options.size(); i++) {
                            if (options.get(i).equals(correctAnswer)) {
                                correctIndex = i;
                                break;
                            }
                        }
                    }

                    if (correctAnswer.isEmpty() && qNode.has("correctAnswerIndex") && !qNode.path("correctAnswerIndex").isMissingNode()) {
                        correctIndex = qNode.path("correctAnswerIndex").asInt(0);
                        if (correctIndex >= 0 && correctIndex < options.size()) {
                            correctAnswer = options.get(correctIndex);
                        }
                    }

                    String questionText = qNode.has("question") && !qNode.path("question").isMissingNode()
                            ? qNode.path("question").asText("").trim()
                            : "";
                    if (questionText.isEmpty() && qNode.has("questionText") && !qNode.path("questionText").isMissingNode()) {
                        questionText = qNode.path("questionText").asText("").trim();
                    }
                    if (questionText.isBlank()) {
                        log.warn("[AiService] Skipping question with missing text");
                        continue;
                    }

                    String type = qNode.path("type").asText("MULTIPLE_CHOICE").toUpperCase();
                    if (!"MULTIPLE_CHOICE".equals(type) && !"TRUE_FALSE".equals(type) && !"FILL_BLANK".equals(type)) {
                        type = "MULTIPLE_CHOICE";
                    }

                    GeneratedQuestionDto dto = GeneratedQuestionDto.builder()
                            .id(qId)
                            .type(type)
                            .questionText(questionText)
                            .options(options)
                            .correctAnswerIndex(correctIndex)
                            .correctAnswer(correctAnswer)
                            .explanation(qNode.path("explanation").asText())
                            .difficulty(difficulty)
                            .build();
                    questions.add(dto);
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse questions JSON: {}. Response was: {}", e.getMessage(), jsonResponse);
        }
        return questions;
    }

    private AiConversationResponse toConversationResponse(AiConversation conversation) {
        return AiConversationResponse.builder()
                .id(conversation.getId())
                .title(conversation.getTitle())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private AiMessageResponse toMessageResponse(AiMessage message) {
        return AiMessageResponse.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}