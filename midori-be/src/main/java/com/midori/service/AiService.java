package com.midori.service;

import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
import com.midori.dto.ai.ExplainResponse;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.entity.AiConversation;

import java.util.List;
import java.util.UUID;

public interface AiService {

    List<AiConversationResponse> getUserConversations(UUID userId);

    AiConversation getConversation(UUID conversationId, UUID userId);

    ConversationMessagesResponse getConversationMessages(UUID conversationId, UUID userId);

    ChatResponse chat(UUID userId, UUID conversationId, String message, ChatRequest.MaterialInfo selectedMaterial);

    GenerateQuestionsResponse generateQuestions(String topic, String level, Integer count, String type, String materialContent);

    ExplainResponse explain(String sentence, String word);

    void deleteConversation(UUID conversationId, UUID userId);

    AiConversationResponse updateConversationTitle(UUID conversationId, UUID userId, String title);

    ConversationMessagesResponse updateUserMessage(UUID conversationId, UUID messageId, UUID userId, String content, ChatRequest.MaterialInfo selectedMaterial);
}