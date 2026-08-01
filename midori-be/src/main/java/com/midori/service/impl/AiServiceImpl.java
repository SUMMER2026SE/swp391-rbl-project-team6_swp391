package com.midori.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.midori.ai.core.AiCoreService;
import com.midori.ai.prompt.AiPromptBuilder;
import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.AiMaterialDetailResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
import com.midori.dto.ai.ExplainResponse;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.dto.ai.GeneratedQuestionDto;
import com.midori.entity.AiConversation;
import com.midori.entity.AiMessage;
import com.midori.entity.User;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.AiConversationRepository;
import com.midori.repository.AiMessageRepository;
import com.midori.repository.UserRepository;
import com.midori.service.AiService;
import com.midori.service.AiMaterialService;
import com.midori.service.AiRateLimitService;
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

    /**
     * Blank markers recognised when normalising an AI-generated question
     * that the provider labelled MULTIPLE_CHOICE (or left untyped) but
     * whose body contains a placeholder. Mirrors the frontend helper
     * {@code quizNormalize.hasBlankMarker} so the same markers are
     * detected on both sides of the wire.
     */
    private static final Pattern BLANK_MARKER_PATTERN = Pattern.compile(
            "_{3,}|\\[BLANK\\]|\\{\\{\\s*blank\\s*\\}\\}",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Vietnamese diacritic letters used as a heuristic signal for
     * Vietnamese-language content. The presence of ANY of these in a
     * non-trivial word strongly suggests the text is Vietnamese rather
     * than Japanese.
     */
    private static final Pattern VIETNAMESE_DIACRITIC_PATTERN = Pattern.compile(
            "[ăâđêôơưĂÂĐÊÔƠƯáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ]"
    );

    /**
     * Common Vietnamese stopwords / particles used by
     * {@link #isMostlyVietnamese(String)} as a positive Vietnamese signal
     * when no diacritics are present (e.g. after the model strips them).
     * Each stopword is listed both with and without diacritics so the
     * pattern matches Vietnamese content regardless of input encoding.
     */
    private static final Pattern VIETNAMESE_STOPWORD_PATTERN = Pattern.compile(
            "(?iu)\\b("
                    + "cau|câu|nao|nào|co|có|nghia|nghĩa|la|là|gi|gì|dung|đúng|sai|"
                    + "khi|nao|nào|cua|của|trong|voi|với|cho|ban|bạn|toi|tôi|minh|mình|"
                    + "hoc|học|tieng|tiếng|nhat|nhật|tu|từ|nao|nào|dap|đáp|an|án|"
                    + "phat|phát|am|âm|cach|cách|doc|đọc|chinh|chính|xac|xác|dich|dịch|"
                    + "sang|theo|bai|bài|doan|đoạn|van|văn|cau|câu|hoi|hỏi|cau|câu|"
                    + "tra|trả|loi|lời|nguoi|người|viet|việt|nam|nào|dau|đâu|mot|một|"
                    + "bat|đầu|bai|bài|ngon|ngôn|ngu|ngữ|chinh|chính|"
                    + "cach|cách|dung|dùng|nhu|như|the|dùng|moi|mới|"
                    + "cung|cũng|hay|nua|nữa|den|đến|nay|này|nay|này"
                    + ")\\b"
    );

    private static final int MAX_CONVERSATION_HISTORY_MESSAGES = 20;

    /**
     * Maximum regeneration rounds for Vietnamese-content enforcement.
     * After this many attempts any remaining bad questions are dropped
     * from the response rather than blocking the whole quiz.
     */
    private static final int MAX_VIETNAMESE_REGENERATION_ATTEMPTS = 2;

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiCoreService aiCoreService;
    private final AiRateLimitService rateLimitService;
    private final AiMaterialService aiMaterialService;
    private final ObjectMapper objectMapper;
    private final boolean fallbackEnabled;

    private volatile String lastModelUsed;

    @Autowired
    public AiServiceImpl(
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AiCoreService aiCoreService,
            AiRateLimitService rateLimitService,
            AiMaterialService aiMaterialService,
            ObjectMapper objectMapper,
            @Value("${ai.fallback-enabled:false}") boolean fallbackEnabled) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.aiCoreService = aiCoreService;
        this.rateLimitService = rateLimitService;
        this.aiMaterialService = aiMaterialService;
        this.objectMapper = objectMapper;
        this.fallbackEnabled = fallbackEnabled;
        log.info("[AiService] AI Service initialized with AiCoreService, AiMaterialService, fallbackEnabled: {}", fallbackEnabled);
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
     * (trusted resolved material OR legacy free-text content). When
     * {@code materialId} is provided the trust boundary is enforced by
     * {@link #resolveTrustedMaterial}.
     */
    private boolean hasUsableMaterial(MaterialResolution resolution) {
        return resolution != null && resolution.usable();
    }

    /**
     * Resolved, trusted material payload used to construct the LLM prompt.
     *
     * <p>The fields in {@link ChatRequest.MaterialInfo} that are populated
     * here come from {@code AiMaterialService.getMaterialDetail} — never
     * from the client request body. If the client supplies a database
     * reference (id+type) that cannot be resolved, the {@code error}
     * field is set and {@code usable()} returns false so that the caller
     * fails closed instead of falling back to client content.
     */
    private static final class MaterialResolution {
        final String type;
        final String title;
        final String level;
        final String content;
        final BadRequestException error;
        final ResourceNotFoundException notFound;

        private MaterialResolution(Builder b) {
            this.type = b.type;
            this.title = b.title;
            this.level = b.level;
            this.content = b.content;
            this.error = b.error;
            this.notFound = b.notFound;
        }

        static MaterialResolution ok(String type, String title, String level, String content) {
            return new Builder()
                    .type(type).title(title).level(level).content(content)
                    .build();
        }

        static MaterialResolution badRequest(BadRequestException error) {
            return new Builder().error(error).build();
        }

        static MaterialResolution notFound(ResourceNotFoundException notFound) {
            return new Builder().notFound(notFound).build();
        }

        boolean usable() {
            return content != null && !content.isBlank();
        }

        ChatRequest.MaterialInfo toMaterialInfo() {
            ChatRequest.MaterialInfo info = new ChatRequest.MaterialInfo();
            info.setType(type);
            info.setTitle(title);
            info.setLevel(level);
            info.setContent(content);
            return info;
        }

        private static final class Builder {
            String type;
            String title;
            String level;
            String content;
            BadRequestException error;
            ResourceNotFoundException notFound;

            Builder type(String v) { this.type = v; return this; }
            Builder title(String v) { this.title = v; return this; }
            Builder level(String v) { this.level = v; return this; }
            Builder content(String v) { this.content = v; return this; }
            Builder error(BadRequestException v) { this.error = v; return this; }
            Builder notFound(ResourceNotFoundException v) { this.notFound = v; return this; }

            MaterialResolution build() {
                return new MaterialResolution(this);
            }
        }
    }

    /**
     * Resolve the material that the LLM prompt should be grounded on.
     *
     * <p><strong>Trust boundary:</strong>
     * <ul>
     *   <li>If {@code materialId} is non-null, the material is loaded from
     *       {@code AiMaterialService.getMaterialDetail(materialType, materialId)}.
     *       The client-supplied title / content / level are IGNORED.</li>
     *   <li>If the type is invalid, returns a {@link BadRequestException}
     *       — the caller MUST fail closed (HTTP 400), never fall back.</li>
     *   <li>If the material is unknown / inactive / unpublished, returns a
     *       {@link ResourceNotFoundException} — the caller MUST fail closed
     *       (HTTP 404), never fall back.</li>
     *   <li>If both {@code materialId} and {@code materialType} are null/blank,
     *       no material is resolved. The legacy {@code clientMaterial}
     *       (if any) is returned without its body so that free-text chat
     *       continues to work — but {@link #hasUsableMaterial} will return
     *       false and the prompt will not include material context.</li>
     * </ul>
     */
    private MaterialResolution resolveTrustedMaterial(String materialType,
                                                      UUID materialId,
                                                      ChatRequest.MaterialInfo clientMaterial) {
        if (materialId == null) {
            // Free-text path: do not load anything from the DB. We
            // intentionally return a blank MaterialInfo so that
            // hasUsableMaterial(...) returns false and the chat falls back
            // to normal Japanese tutoring. The legacy client-supplied
            // content (if any) is NOT forwarded.
            return MaterialResolution.ok(null, null, null, "");
        }

        // materialId provided — type must also be provided. The controller
        // already rejects partial references via @AssertTrue; this is a
        // defence-in-depth check.
        if (materialType == null || materialType.isBlank()) {
            return MaterialResolution.badRequest(new BadRequestException(
                    "materialType is required when materialId is present"));
        }

        try {
            AiMaterialDetailResponse detail = aiMaterialService.getMaterialDetail(materialType, materialId);
            return MaterialResolution.ok(detail.getType(), detail.getTitle(),
                    detail.getLevel(), detail.getContent());
        } catch (BadRequestException e) {
            return MaterialResolution.badRequest(e);
        } catch (ResourceNotFoundException e) {
            return MaterialResolution.notFound(e);
        }
    }

    /**
     * Build effective system prompt with material content if available.
     *
     * <p>The material content is HTML-entity-decoded before being inserted into
     * the prompt. This prevents the LLM from seeing and re-emitting escaped
     * forms like "&quot;聞く&quot;" as if they were literal text.
     */
    private String buildSystemPrompt(MaterialResolution resolution) {
        if (!hasUsableMaterial(resolution)) {
            return AiPromptBuilder.getChatSystemPrompt();
        }

        // Decode HTML entities in the material content so the model sees the
        // real Japanese characters (e.g. 聞く instead of &quot;聞く&quot;).
        String decodedContent = decodeHtmlEntities(resolution.content);

        return AiPromptBuilder.buildChatSystemPromptWithMaterial(
                resolution.title,
                resolution.type,
                resolution.level,
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
    public ChatResponse chat(UUID userId, UUID conversationId, String message,
                             String materialType, UUID materialId,
                             ChatRequest.MaterialInfo clientMaterial) {
        rateLimitService.checkAndIncrementChat(userId);

        // Resolve the trusted material BEFORE any DB work. If the resolution
        // surfaces a BadRequestException or ResourceNotFoundException, fail
        // closed — never substitute the client-supplied title / content.
        MaterialResolution resolution = resolveTrustedMaterial(materialType, materialId, clientMaterial);
        if (resolution.error != null) {
            throw resolution.error;
        }
        if (resolution.notFound != null) {
            throw resolution.notFound;
        }

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
        if (!hasUsableMaterial(resolution)
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

        String effectivePrompt = buildSystemPrompt(resolution);

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
    public GenerateQuestionsResponse generateQuestions(UUID userId, String topic, String level,
                                                      Integer count, String type,
                                                      String materialType, UUID materialId,
                                                      String materialContent,
                                                      String materialTitle) {
        rateLimitService.checkAndIncrementQuizGeneration(userId);

        // Trust boundary: when the client supplies a database reference,
        // resolve the material through AiMaterialService and IGNORE any
        // client-supplied title / content. Bad references fail closed.
        String trustedTitle = (materialTitle != null && !materialTitle.isBlank())
                ? materialTitle : (topic != null ? topic : "");
        String trustedContent = null;
        if (materialId != null) {
            if (materialType == null || materialType.isBlank()) {
                throw new BadRequestException(
                        "materialType is required when materialId is present");
            }
            AiMaterialDetailResponse detail = aiMaterialService.getMaterialDetail(materialType, materialId);
            trustedTitle = detail.getTitle();
            trustedContent = detail.getContent();
        } else if (materialContent != null && !materialContent.isBlank()) {
            // Legacy / manual topic-based path: client content is the
            // authoritative source because there is no lesson reference.
            trustedContent = materialContent;
        }

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

        log.info("[AiService] Quiz generation requested by userId={}: topic={}, count={}, type={}, trustedMaterial={}",
                userId, trustedTitle, actualCount, questionType,
                materialId != null ? materialType + ":" + materialId : "none");

        // Try AI provider through AiCoreService
        try {
            String jsonResponse = aiCoreService.generateQuestions(trustedTitle, trustedContent, actualCount, questionType, difficulty);
            List<GeneratedQuestionDto> parsed = parseQuestionsFromJson(jsonResponse, difficulty);
            if (!"MIXED".equalsIgnoreCase(questionType)) {
                parsed = enforceSingleQuestionType(parsed, questionType);
            }
            // Enforce Japanese-first content policy: questions whose question /
            // options / correctAnswer are mostly Vietnamese are regenerated.
            // If regeneration still fails, those questions are dropped so the
            // renderer never displays Vietnamese content for a Japanese quiz.
            parsed = enforceJapaneseContent(parsed, trustedTitle, trustedContent, questionType, difficulty);
            if (parsed.isEmpty()) {
                throw new IllegalStateException("No valid questions after Japanese policy enforcement");
            }
            questions = parsed;
            log.info("[AiService] Successfully generated {} questions from AI provider for userId={}", questions.size(), userId);
        } catch (IllegalStateException e) {
            log.warn("[AiService] AI provider not configured: {}", e.getMessage());
            errorMessage = "AI provider chưa được cấu hình. Vui lòng liên hệ quản trị viên.";
        } catch (Exception e) {
            log.error("[AiService] Error generating questions from AI for userId={}: {}", userId, e.getMessage());
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
                log.warn("[AiService] AI quiz generation failed in strict mode (fallbackEnabled=false) for userId={}. errorMessage={}",
                        userId, errorMessage);
                return GenerateQuestionsResponse.builder()
                        .materialTitle(trustedTitle)
                        .questions(List.of())
                        .errorMessage(errorMessage != null ? errorMessage
                                : "Xin lỗi, đã xảy ra lỗi khi tạo quiz. Vui lòng thử lại sau.")
                        .isFallback(false)
                        .source("AI")
                        .build();
            }

            // Legacy fallback mode (fallbackEnabled=true): generate questions from material content
            log.warn("[AiService] WARNING: Local fallback used for userId={} due to AI provider failure (fallbackEnabled=true). "
                    + "This fallback generates generic questions and should be monitored.",
                    userId);
            if (trustedContent == null || trustedContent.isBlank()) {
                log.warn("[AiService] Local fallback skipped for userId={}: materialContent empty", userId);
                errorMessage = "Tài liệu chưa đủ dữ liệu để tạo quiz.";
            } else {
                questions = generateLocalQuestions(trustedTitle, trustedContent, actualCount, questionType, difficulty);
                if (!questions.isEmpty()) {
                    usedFallback = true;
                    source = "LOCAL_FALLBACK";
                    errorMessage = null;
                    log.info("[AiService] Local fallback generated {} questions for userId={}", questions.size(), userId);
                } else {
                    errorMessage = "Tài liệu chưa đủ dữ liệu để tạo quiz.";
                }
            }
        }

        return GenerateQuestionsResponse.builder()
                .materialTitle(trustedTitle)
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
                    .questionText("Chủ đề học tập hiện tại là '" + topic + "'.")
                    .options(List.of("True", "False"))
                    .correctAnswer("True")
                    .explanation("Câu này xác nhận chủ đề học tập hiện tại là '" + topic + "'.")
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
                correct = "True";
            } else {
                String wrongMeaning = otherMeanings.isEmpty() ? "không rõ" : otherMeanings.get(0);
                statement = "「" + japanese + "」" + (reading.isEmpty() ? "" : " (" + reading + ")") + " nghĩa là " + wrongMeaning + ".";
                correct = "False";
            }
            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("TRUE_FALSE")
                    .questionText(statement)
                    .options(List.of("True", "False"))
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
                correct = "True";
            } else {
                statement = "Mẫu 「" + pattern + "」 dùng để: ăn uống.";
                correct = "False";
            }
            result.add(GeneratedQuestionDto.builder()
                    .id(qId)
                    .type("TRUE_FALSE")
                    .questionText(statement)
                    .options(List.of("True", "False"))
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

        // Apply the same trust boundary as chat(): when the MaterialInfo
        // carries a database reference, resolve through AiMaterialService.
        String matType = selectedMaterial != null ? selectedMaterial.getType() : null;
        UUID matId = selectedMaterial != null ? selectedMaterial.getId() : null;
        MaterialResolution resolution = resolveTrustedMaterial(matType, matId, selectedMaterial);
        if (resolution.error != null) {
            throw resolution.error;
        }
        if (resolution.notFound != null) {
            throw resolution.notFound;
        }

        String effectivePrompt = buildSystemPrompt(resolution);
        String newReply;

        // Same no-material guard as chat(): if the edited message refers to a
        // material but no material is attached, do not let the LLM invent one.
        if (!hasUsableMaterial(resolution)
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
        List<AiMessage> messages = messageRepository.findLatestMessagesByConversationId(
                conversationId, MAX_CONVERSATION_HISTORY_MESSAGES);
        // Reverse to get chronological order (oldest first) for AI context
        List<AiMessage> chronological = new ArrayList<>(messages);
        Collections.reverse(chronological);
        List<String[]> history = new ArrayList<>();
        for (AiMessage msg : chronological) {
            history.add(new String[]{msg.getRole(), msg.getContent()});
        }
        return history;
    }

    private List<String[]> getConversationHistoryExcluding(UUID conversationId, UUID excludeMessageId) {
        List<AiMessage> messages;
        if (excludeMessageId != null) {
            messages = messageRepository.findLatestMessagesExcluding(
                    conversationId, excludeMessageId, MAX_CONVERSATION_HISTORY_MESSAGES);
        } else {
            messages = messageRepository.findLatestMessagesByConversationId(
                    conversationId, MAX_CONVERSATION_HISTORY_MESSAGES);
        }
        // Reverse to get chronological order (oldest first) for AI context
        List<AiMessage> chronological = new ArrayList<>(messages);
        Collections.reverse(chronological);
        List<String[]> history = new ArrayList<>();
        for (AiMessage msg : chronological) {
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
                    // Drop null / blank options so structural checks can rely on
                    // non-empty strings only.
                    List<String> cleanOptions = new ArrayList<>();
                    for (String opt : options) {
                        if (opt != null && !opt.isBlank()) {
                            cleanOptions.add(opt.trim());
                        }
                    }

                    int correctIndex = -1;
                    String correctAnswer = "";

                    if (qNode.has("correctAnswer") && !qNode.path("correctAnswer").isMissingNode()) {
                        String ca = qNode.path("correctAnswer").asText("");
                        if (ca != null) {
                            correctAnswer = ca.trim();
                        }
                        for (int i = 0; i < cleanOptions.size(); i++) {
                            if (cleanOptions.get(i).equals(correctAnswer)) {
                                correctIndex = i;
                                break;
                            }
                        }
                    }

                    if (correctAnswer.isEmpty() && qNode.has("correctAnswerIndex") && !qNode.path("correctAnswerIndex").isMissingNode()) {
                        correctIndex = qNode.path("correctAnswerIndex").asInt(-1);
                        if (correctIndex >= 0 && correctIndex < cleanOptions.size()) {
                            correctAnswer = cleanOptions.get(correctIndex);
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

                    // Structural normalisation. The provider may emit a wrong
                    // type label (or omit it entirely) for individual MIXED
                    // questions. We must never ship a MULTIPLE_CHOICE question
                    // with zero options to the frontend because the MC renderer
                    // would have nothing to draw.
                    String rawType = qNode.has("type") && !qNode.path("type").isMissingNode()
                            ? qNode.path("type").asText("")
                            : "";
                    String resolvedType = resolveQuestionType(rawType, questionText, cleanOptions, correctAnswer);

                    if (resolvedType == null) {
                        log.warn("[AiService] Skipping unrecoverable MIXED question id={} (rawType='{}', options={}, hasMarker={})",
                                qId, rawType, cleanOptions.size(), hasBlankMarker(questionText));
                        continue;
                    }

                    // For FILL_BLANK we want no options at all so the renderer
                    // never accidentally shows option buttons on a fill-blank
                    // question. For TRUE_FALSE we force the canonical pair.
                    List<String> finalOptions = cleanOptions;
                    if ("TRUE_FALSE".equals(resolvedType)) {
                        finalOptions = List.of("True", "False");
                    } else if ("FILL_BLANK".equals(resolvedType)) {
                        finalOptions = List.of();
                    }

                    int finalCorrectIndex = correctIndex;
                    if ("TRUE_FALSE".equals(resolvedType)) {
                        for (int i = 0; i < finalOptions.size(); i++) {
                            if (finalOptions.get(i).equalsIgnoreCase(correctAnswer)) {
                                finalCorrectIndex = i;
                                break;
                            }
                        }
                        if (finalCorrectIndex < 0 && (correctAnswer.equalsIgnoreCase("Đúng") || correctAnswer.equalsIgnoreCase("True") || correctAnswer.equalsIgnoreCase("T"))) {
                            finalCorrectIndex = 0;
                        } else if (finalCorrectIndex < 0) {
                            finalCorrectIndex = 1;
                        }
                        correctAnswer = finalOptions.get(finalCorrectIndex);
                    }

                    GeneratedQuestionDto dto = GeneratedQuestionDto.builder()
                            .id(qId)
                            .type(resolvedType)
                            .questionText(questionText)
                            .options(finalOptions)
                            .correctAnswerIndex(finalCorrectIndex)
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

    /**
     * Detect a blank marker in the question text. Mirrors the frontend
     * {@code quizNormalize.hasBlankMarker} so the same markers are
     * recognised on both sides of the wire.
     */
    private static boolean hasBlankMarker(String questionText) {
        if (questionText == null || questionText.isBlank()) {
            return false;
        }
        return BLANK_MARKER_PATTERN.matcher(questionText).find();
    }

    /**
     * Heuristic Vietnamese detection used to enforce MIDORI's Japanese-first
     * output policy on AI-generated quiz content.
     *
     * <p>A string is considered "mostly Vietnamese" when EITHER:
     * <ul>
     *   <li>it contains at least one Vietnamese diacritic character, OR</li>
     *   <li>it contains two or more distinct Vietnamese stopwords.</li>
     * </ul>
     *
     * <p>Short snippets (less than 2 alphabetic tokens) and strings that
     * contain Japanese-script characters (hiragana/katakana/kanji) are
     * never flagged, so legitimate Japanese content with the occasional
     * Vietnamese particle in {@code explanation} is not penalised here.
     */
    static boolean isMostlyVietnamese(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        // If the text already contains Japanese script, it cannot be
        // "mostly Vietnamese" regardless of any stray particles.
        if (text.codePoints().anyMatch(cp ->
                (cp >= 0x3040 && cp <= 0x309F)   // hiragana
                        || (cp >= 0x30A0 && cp <= 0x30FF)   // katakana
                        || (cp >= 0x4E00 && cp <= 0x9FFF))) { // CJK unified (kanji)
            return false;
        }
        boolean hasDiacritic = VIETNAMESE_DIACRITIC_PATTERN.matcher(text).find();
        if (hasDiacritic) {
            return true;
        }
        java.util.regex.Matcher m = VIETNAMESE_STOPWORD_PATTERN.matcher(text);
        int distinct = 0;
        java.util.HashSet<String> seen = new java.util.HashSet<>();
        while (m.find()) {
            String w = m.group(1).toLowerCase();
            if (seen.add(w)) {
                distinct++;
                if (distinct >= 2) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Inspect a single AI-generated question and return the list of fields
     * that violate MIDORI's Japanese-first content policy.
     *
     * <p>Vietnamese is allowed in:
     * <ul>
     *   <li>the {@code explanation} field (always);</li>
     *   <li>{@code TRUE_FALSE} canonical options/correctAnswer
     *       ({@code ["Đúng", "Sai"]}).</li>
     * </ul>
     *
     * <p>Every other text field MUST be Japanese. The list is sorted by
     * field name so callers can build deterministic error messages.
     */
    static List<String> japanesePolicyViolations(GeneratedQuestionDto q) {
        List<String> violations = new ArrayList<>();
        if (q == null) return violations;
        String type = q.getType() == null ? "" : q.getType().toUpperCase();

        if (isMostlyVietnamese(q.getQuestionText())) {
            violations.add("question");
        }

        boolean isTrueFalseCanonical = "TRUE_FALSE".equals(type)
                && q.getOptions() != null
                && q.getOptions().size() == 2
                && (("Đúng".equalsIgnoreCase(q.getOptions().get(0)) && "Sai".equalsIgnoreCase(q.getOptions().get(1)))
                    || ("True".equalsIgnoreCase(q.getOptions().get(0)) && "False".equalsIgnoreCase(q.getOptions().get(1))));

        if (!isTrueFalseCanonical && q.getOptions() != null) {
            for (String opt : q.getOptions()) {
                if (isMostlyVietnamese(opt)) {
                    violations.add("options");
                    break;
                }
            }
        }

        if (!isTrueFalseCanonical) {
            String ca = q.getCorrectAnswer();
            if (ca != null && !ca.isBlank() && isMostlyVietnamese(ca)) {
                violations.add("correctAnswer");
            }
        }

        return violations;
    }

    /**
     * Build a tight regeneration prompt that asks the LLM to fix only the
     * questions whose content violated the Japanese-first policy. The
     * returned prompt is intentionally short and explicit so even the
     * free-tier models we route through OpenRouter can follow it.
     */
    private String buildVietnameseRegenerationPrompt(
            String materialTitle,
            String materialContent,
            String questionType,
            String difficulty,
            List<GeneratedQuestionDto> badQuestions) {

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are AI Sensei of MIDORI, a Japanese-language tutor on a Japanese learning platform.\n\n");
        prompt.append("The previous quiz attempt had these BAD questions (questions, options, or correctAnswer in Vietnamese).\n");
        prompt.append("REGENERATE EACH of the questions below in JAPANESE.\n\n");

        prompt.append("RULES — MANDATORY:\n");
        prompt.append("1. The `question` text MUST be Japanese.\n");
        prompt.append("2. The `options` MUST be Japanese (the only exception is TRUE_FALSE which uses ['Đúng','Sai']).\n");
        prompt.append("3. The `correctAnswer` MUST be Japanese (the only exception is TRUE_FALSE: 'Đúng' or 'Sai').\n");
        prompt.append("4. The `explanation` MAY be Vietnamese to help the learner.\n");
        prompt.append("5. Output ONLY a single raw JSON object — NO ```json fences, NO markdown, NO prose.\n");
        prompt.append("6. The JSON must contain EXACTLY the same number of questions as below, in the SAME order, with the SAME ids.\n");
        prompt.append("7. Vocabulary and grammar MUST match the lesson level.\n\n");

        prompt.append("MATERIAL TITLE: ").append(materialTitle == null ? "" : materialTitle).append("\n");
        prompt.append("DIFFICULTY: ").append(difficulty).append("\n");
        prompt.append("QUESTION TYPE: ").append(questionType).append("\n");
        if (materialContent != null && !materialContent.isBlank()) {
            prompt.append("MATERIAL CONTENT (use as context):\n")
                    .append(materialContent.length() > 2000
                            ? materialContent.substring(0, 2000) + "..."
                            : materialContent)
                    .append("\n");
        }

        prompt.append("\nQUESTIONS TO FIX (these are the bad ones — keep id, type, category, difficulty; rewrite the rest):\n");
        prompt.append("[\n");
        for (int i = 0; i < badQuestions.size(); i++) {
            GeneratedQuestionDto bq = badQuestions.get(i);
            prompt.append("  {");
            prompt.append("\"id\":\"").append(safe(bq.getId())).append("\",");
            prompt.append("\"type\":\"").append(safe(bq.getType())).append("\",");
            prompt.append("\"category\":\"").append(safe(bq.getExplanation() != null ? "?" : "?")).append("\",");
            prompt.append("\"question\":\"").append(safe(bq.getQuestionText())).append("\",");
            prompt.append("\"options\":").append(optionsAsJson(bq.getOptions())).append(",");
            prompt.append("\"correctAnswer\":\"").append(safe(bq.getCorrectAnswer())).append("\",");
            prompt.append("\"explanation\":\"").append(safe(bq.getExplanation())).append("\"");
            prompt.append("}");
            if (i < badQuestions.size() - 1) {
                prompt.append(",");
            }
            prompt.append("\n");
        }
        prompt.append("]\n\n");

        prompt.append("OUTPUT JSON SHAPE (Japanese content, same ids):\n");
        prompt.append("{\n");
        prompt.append("  \"questions\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"id\": \"q_0\",\n");
        prompt.append("      \"type\": \"").append(questionType).append("\",\n");
        prompt.append("      \"question\": \"次のうち、正しい文はどれですか。\",\n");
        prompt.append("      \"options\": [\"わたしはリンです。\", \"わたしは学生があります。\", \"わたしは日本です。\", \"わたしは食べます。\"],\n");
        prompt.append("      \"correctAnswer\": \"わたしはリンです。\",\n");
        prompt.append("      \"explanation\": \"「わたしは～です」は自己紹介で使う基本文型です。\",\n");
        prompt.append("      \"category\": \"Vocabulary\",\n");
        prompt.append("      \"difficulty\": \"").append(difficulty).append("\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n");
        return prompt.toString();
    }

    private static String safe(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String optionsAsJson(List<String> options) {
        if (options == null || options.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < options.size(); i++) {
            sb.append("\"").append(safe(options.get(i))).append("\"");
            if (i < options.size() - 1) sb.append(", ");
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Try to regenerate the questions that violated the Japanese-first
     * content policy. Returns the list of successfully fixed questions
     * keyed by their original {@code id}. Failed regenerations are
     * absent from the map — callers drop those entries from the final
     * response rather than shipping Vietnamese content.
     *
     * <p>Up to {@link #MAX_VIETNAMESE_REGENERATION_ATTEMPTS} calls are
     * made per batch. Any error (provider failure, malformed JSON, or
     * questions that are still Vietnamese after regeneration) leaves the
     * corresponding id out of the map.
     */
    private Map<String, GeneratedQuestionDto> regenerateVietnameseQuestions(
            String materialTitle,
            String materialContent,
            String questionType,
            String difficulty,
            List<GeneratedQuestionDto> badQuestions) {

        Map<String, GeneratedQuestionDto> fixed = new HashMap<>();
        if (badQuestions == null || badQuestions.isEmpty()) {
            return fixed;
        }

        for (int attempt = 1; attempt <= MAX_VIETNAMESE_REGENERATION_ATTEMPTS; attempt++) {
            try {
                String prompt = buildVietnameseRegenerationPrompt(
                        materialTitle, materialContent, questionType, difficulty, badQuestions);

                String raw;
                try {
                    raw = aiCoreService.generateQuestions(
                            materialTitle, materialContent, badQuestions.size(),
                            questionType, difficulty);
                } catch (Exception ex) {
                    log.warn("[AiService] Regeneration attempt {} provider error: {}",
                            attempt, ex.getMessage());
                    continue;
                }

                List<GeneratedQuestionDto> parsed = parseQuestionsFromJson(raw, difficulty);
                if (!"MIXED".equalsIgnoreCase(questionType)) {
                    parsed = enforceSingleQuestionType(parsed, questionType);
                }

                Map<String, GeneratedQuestionDto> byId = new HashMap<>();
                for (GeneratedQuestionDto q : parsed) {
                    if (q.getId() != null) byId.put(q.getId(), q);
                }

                // Only keep regenerations that are clean.
                for (GeneratedQuestionDto original : badQuestions) {
                    GeneratedQuestionDto candidate = byId.get(original.getId());
                    if (candidate == null) continue;
                    if (japanesePolicyViolations(candidate).isEmpty()) {
                        fixed.put(original.getId(), candidate);
                    }
                }

                if (fixed.size() == badQuestions.size()) {
                    log.info("[AiService] Regeneration attempt {} fixed all {}/{} Vietnamese-only questions",
                            attempt, fixed.size(), badQuestions.size());
                    return fixed;
                }
                log.info("[AiService] Regeneration attempt {} fixed {}/{} Vietnamese-only questions; retrying",
                        attempt, fixed.size(), badQuestions.size());
            } catch (Exception ex) {
                log.warn("[AiService] Regeneration attempt {} failed: {}", attempt, ex.getMessage());
            }
        }
        return fixed;
    }

    /**
     * Apply the Japanese-first content policy to a freshly parsed batch
     * of AI-generated questions. For any question whose {@code question},
     * {@code options}, or {@code correctAnswer} is mostly Vietnamese, the
     * service asks the AI to regenerate that question. If regeneration
     * still fails (or still produces Vietnamese), the question is dropped
     * so the renderer never shows garbage.
     */
    private List<GeneratedQuestionDto> enforceJapaneseContent(
            List<GeneratedQuestionDto> parsed,
            String materialTitle,
            String materialContent,
            String questionType,
            String difficulty) {
        if (parsed == null || parsed.isEmpty()) return parsed;

        List<GeneratedQuestionDto> bad = new ArrayList<>();
        List<Integer> badIndexes = new ArrayList<>();
        for (int i = 0; i < parsed.size(); i++) {
            GeneratedQuestionDto q = parsed.get(i);
            if (!japanesePolicyViolations(q).isEmpty()) {
                bad.add(q);
                badIndexes.add(i);
            }
        }
        if (bad.isEmpty()) {
            return parsed;
        }
        log.info("[AiService] Detected {} Vietnamese-only questions out of {}; regenerating",
                bad.size(), parsed.size());

        Map<String, GeneratedQuestionDto> regenerated = regenerateVietnameseQuestions(
                materialTitle, materialContent, questionType, difficulty, bad);

        List<GeneratedQuestionDto> result = new ArrayList<>(parsed.size());
        for (int i = 0; i < parsed.size(); i++) {
            GeneratedQuestionDto q = parsed.get(i);
            if (badIndexes.contains(i)) {
                GeneratedQuestionDto fix = regenerated.get(q.getId());
                if (fix != null) {
                    result.add(fix);
                } else {
                    log.warn("[AiService] Dropping question id={} (could not regenerate in Japanese)",
                            q.getId());
                }
            } else {
                result.add(q);
            }
        }
        return result;
    }

    /**
     * Decide the canonical per-question type for a single entry inside a
     * MIXED quiz using the whole question object, never the type string
     * alone. The contract is:
     *
     * <ul>
     *   <li><strong>MULTIPLE_CHOICE</strong> requires at least two
     *       non-empty options and a {@code correctAnswer} that matches one
     *       of them (case-sensitive equality).</li>
     *   <li><strong>TRUE_FALSE</strong> requires the canonical
     *       [Đúng, Sai] option pair; the {@code correctAnswer} must be
     *       either "Đúng" / "Sai" (case-insensitive) or "True"/"False".</li>
     *   <li><strong>FILL_BLANK</strong> requires either a recognised blank
     *       marker (____, [BLANK], {{blank}}) or a Vietnamese instruction
     *       like "Điền", "điền từ", "điền nghĩa", or the question itself
     *       has zero options. It never needs options.</li>
     * </ul>
     *
     * <p>If the type label is unknown or absent AND the question cannot
     * be safely inferred (no marker, no instruction, but the provider
     * also failed to supply options), the question is rejected. Returning
     * {@code null} tells the caller to skip the entry instead of guessing.
     *
     * <p>NEVER coerce an unknown / missing type into MULTIPLE_CHOICE when
     * there are no options — that would yield a question the frontend
     * cannot render.
     */
    private static String resolveQuestionType(String rawType,
                                              String questionText,
                                              List<String> options,
                                              String correctAnswer) {
        String upperType = rawType == null ? "" : rawType.trim().toUpperCase();
        boolean hasMarker = hasBlankMarker(questionText);
        boolean hasFillInstruction = questionText != null
                && (questionText.contains("Điền")
                || questionText.toLowerCase().contains("điền")
                || questionText.toLowerCase().contains("fill in")
                || questionText.toLowerCase().contains("hoàn thành"));
        boolean hasOptions = options != null && !options.isEmpty();
        boolean looksTrueFalse = hasOptions && options.size() == 2
                && ("Đúng".equalsIgnoreCase(options.get(0)) || "True".equalsIgnoreCase(options.get(0))
                || "T".equalsIgnoreCase(options.get(0)))
                && ("Sai".equalsIgnoreCase(options.get(1)) || "False".equalsIgnoreCase(options.get(1))
                || "F".equalsIgnoreCase(options.get(1)));

        switch (upperType) {
            case "MULTIPLE_CHOICE":
                if (hasOptions && options.size() >= 2) {
                    if (correctAnswer != null && !correctAnswer.isBlank()) {
                        for (String opt : options) {
                            if (opt != null && opt.equals(correctAnswer)) {
                                return "MULTIPLE_CHOICE";
                            }
                        }
                    }
                    // Has options but correctAnswer is not on the list — fall
                    // through to FILL_BLANK if the question has a marker, else
                    // reject.
                    if (hasMarker || hasFillInstruction) {
                        return "FILL_BLANK";
                    }
                    // No valid correctAnswer and no marker — drop the question
                    // rather than ship a broken MC.
                    return null;
                }
                // MC label but no usable options → promote to FILL_BLANK when
                // the question actually has a blank, otherwise reject.
                if (hasMarker || hasFillInstruction) {
                    return "FILL_BLANK";
                }
                return null;

            case "TRUE_FALSE":
                if (looksTrueFalse) {
                    return "TRUE_FALSE";
                }
                if (correctAnswer != null
                        && (correctAnswer.equalsIgnoreCase("Đúng")
                        || correctAnswer.equalsIgnoreCase("Sai")
                        || correctAnswer.equalsIgnoreCase("True")
                        || correctAnswer.equalsIgnoreCase("False"))) {
                    return "TRUE_FALSE";
                }
                // Label says TRUE_FALSE but no valid boolean structure — drop.
                return null;

            case "FILL_BLANK":
                // FILL_BLANK never needs options. Keep the label even when
                // the provider supplied some (defensive — ignore them).
                return "FILL_BLANK";

            case "":
                // Type missing entirely. Infer from content.
                if (looksTrueFalse) {
                    return "TRUE_FALSE";
                }
                if (hasMarker || hasFillInstruction) {
                    return "FILL_BLANK";
                }
                if (hasOptions && options.size() >= 2) {
                    return "MULTIPLE_CHOICE";
                }
                // Cannot infer safely.
                return null;

            default:
                // Unknown alias. Same inference rules as the empty case but
                // we never silently coerce to MULTIPLE_CHOICE.
                if (looksTrueFalse) {
                    return "TRUE_FALSE";
                }
                if (hasMarker || hasFillInstruction) {
                    return "FILL_BLANK";
                }
                if (hasOptions && options.size() >= 2) {
                    return "MULTIPLE_CHOICE";
                }
                return null;
        }
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