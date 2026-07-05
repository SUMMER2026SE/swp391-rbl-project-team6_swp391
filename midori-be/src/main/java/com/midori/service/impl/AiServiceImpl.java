package com.midori.service.impl;

import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.AiMessageResponse;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.dto.ai.GeneratedQuestionDto;
import com.midori.entity.AiConversation;
import com.midori.entity.AiMessage;
import com.midori.entity.User;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.AiConversationRepository;
import com.midori.repository.AiMessageRepository;
import com.midori.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

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
    public ChatResponse chat(UUID userId, UUID conversationId, String message) {
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

        AiMessage userMessage = AiMessage.builder()
                .conversation(conversation)
                .role("USER")
                .content(message)
                .build();
        messageRepository.save(userMessage);

        String reply = generateMockReply(message);

        AiMessage aiMessage = AiMessage.builder()
                .conversation(conversation)
                .role("ASSISTANT")
                .content(reply)
                .build();
        messageRepository.save(aiMessage);

        return ChatResponse.builder()
                .conversationId(conversation.getId())
                .reply(reply)
                .createdAt(aiMessage.getCreatedAt())
                .build();
    }

    @Override
    public GenerateQuestionsResponse generateQuestions(String topic, String level, Integer count, String type) {
        List<GeneratedQuestionDto> questions = new ArrayList<>();
        int actualCount = Math.max(1, Math.min(count != null ? count : 1, 20));

        for (int i = 0; i < actualCount; i++) {
            GeneratedQuestionDto dto = GeneratedQuestionDto.builder()
                    .questionText("Mock question " + (i + 1) + " about " + topic + " (level=" + level + ")")
                    .options(List.of("A", "B", "C", "D"))
                    .correctAnswerIndex(0)
                    .explanation("This is a mock explanation for question " + (i + 1) + ".")
                    .difficulty(level)
                    .build();
            questions.add(dto);
        }

        return GenerateQuestionsResponse.builder()
                .questions(questions)
                .build();
    }

    @Override
    public void deleteConversation(UUID conversationId, UUID userId) {
        AiConversation conversation = getConversation(conversationId, userId);
        conversationRepository.delete(conversation);
    }

    @Override
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
    public ConversationMessagesResponse updateUserMessage(UUID conversationId, UUID messageId, UUID userId, String content) {
        // Verify conversation ownership
        getConversation(conversationId, userId);

        // Find the USER message
        AiMessage targetMessage = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        // Verify message belongs to this conversation
        if (!targetMessage.getConversation().getId().equals(conversationId)) {
            throw new ResourceNotFoundException("Message not found in this conversation");
        }

        // Only allow editing USER messages
        if (!"USER".equals(targetMessage.getRole())) {
            throw new IllegalArgumentException("Only USER messages can be edited");
        }

        // Check this is the latest USER message in the conversation
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

        // Validate and trim content
        String trimmedContent = content != null ? content.trim() : "";
        if (trimmedContent.isEmpty()) {
            throw new IllegalArgumentException("Content must not be blank after trimming");
        }

        // Update the USER message content
        targetMessage.setContent(trimmedContent);
        messageRepository.save(targetMessage);

        // Find and delete the ASSISTANT reply that follows this USER message
        int userIndex = allMessages.indexOf(targetMessage);
        AiMessage assistantToDelete = null;
        if (userIndex >= 0 && userIndex + 1 < allMessages.size()) {
            AiMessage nextMsg = allMessages.get(userIndex + 1);
            if ("ASSISTANT".equals(nextMsg.getRole())) {
                assistantToDelete = nextMsg;
            }
        }

        // Generate new AI reply
        String newReply = generateMockReply(trimmedContent);

        AiMessage newAssistantMessage = AiMessage.builder()
                .conversation(targetMessage.getConversation())
                .role("ASSISTANT")
                .content(newReply)
                .build();

        // Delete old assistant if exists
        if (assistantToDelete != null) {
            messageRepository.delete(assistantToDelete);
        }

        // Save new assistant message
        messageRepository.save(newAssistantMessage);

        // Update conversation timestamp
        AiConversation conversation = targetMessage.getConversation();
        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        // Return fresh message list
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

    private String generateMockReply(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "I received your message, but it seems empty. Could you please rephrase?";
        }

        String lower = message.toLowerCase();
        if (lower.contains("hello") || lower.contains("hi") || lower.contains("xin chào")) {
            return "Hello! I am AI Sensei. How can I help you with your Japanese studies today?";
        }
        if (lower.contains("kanji") || lower.contains("chữ hán")) {
            return "Kanji practice is a great step. Could you share the kanji or the topic you want to practice?";
        }
        if (lower.contains("grammar") || lower.contains("ngữ pháp")) {
            return "Grammar can be tricky. Tell me the grammar point or level you want to review, and I will help.";
        }
        if (lower.contains("exam") || lower.contains("thi") || lower.contains(" đề")) {
            return "I can help you brainstorm questions, but I cannot create an exam directly in this phase. Please use exam generation instead.";
        }
        if (lower.contains("thank")) {
            return "You are welcome! Keep studying and let me know if you need more help.";
        }

        return "Thanks for your message. As an AI Sensei mock, I can answer this later once a real LLM provider is connected.";
    }
}
