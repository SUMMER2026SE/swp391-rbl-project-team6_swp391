package com.midori.service;

import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.entity.AiConversation;

import java.util.List;
import java.util.UUID;

public interface AiService {

    List<AiConversationResponse> getUserConversations(UUID userId);

    AiConversation getConversation(UUID conversationId, UUID userId);

    ConversationMessagesResponse getConversationMessages(UUID conversationId, UUID userId);

    /**
     * Chat with the AI Sensei.
     *
     * <p>If {@code materialId} is non-null, the material is loaded from
     * {@code AiMaterialService} and the client-supplied
     * {@link ChatRequest.MaterialInfo#getContent() client content} is
     * <strong>ignored</strong>. The caller (controller) is responsible for
     * rejecting partial references (id-only or type-only) before invoking
     * this method.
     *
     * @param materialType validated material type (may be null when no material is referenced)
     * @param materialId   validated material UUID (may be null when no material is referenced)
     * @param clientMaterial legacy / display-only MaterialInfo; ignored when materialId is non-null
     */
    ChatResponse chat(UUID userId, UUID conversationId, String message,
                      String materialType, UUID materialId,
                      ChatRequest.MaterialInfo clientMaterial);

    /**
     * Generate quiz questions.
     *
     * <p>When {@code materialId} is non-null, the material is loaded from
     * {@code AiMaterialService} and the client-supplied
     * {@code materialContent} is <strong>ignored</strong>.
     */
    GenerateQuestionsResponse generateQuestions(UUID userId, String topic, String level,
                                                Integer count, String type,
                                                String materialType, UUID materialId,
                                                String materialContent,
                                                String materialTitle);

    void deleteConversation(UUID conversationId, UUID userId);

    AiConversationResponse updateConversationTitle(UUID conversationId, UUID userId, String title);

    ConversationMessagesResponse updateUserMessage(UUID conversationId, UUID messageId,
                                                  UUID userId, String content,
                                                  ChatRequest.MaterialInfo selectedMaterial);
}
