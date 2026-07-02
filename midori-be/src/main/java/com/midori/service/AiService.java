package com.midori.service;

import com.midori.dto.ai.AiConversationResponse;
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

    ChatResponse chat(UUID userId, UUID conversationId, String message);

    GenerateQuestionsResponse generateQuestions(String topic, String level, Integer count, String type);

    void deleteConversation(UUID conversationId, UUID userId);
}
