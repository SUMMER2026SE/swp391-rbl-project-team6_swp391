package com.midori.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class ConversationMessagesResponse {

    private UUID conversationId;
    private List<AiMessageResponse> messages;
}
