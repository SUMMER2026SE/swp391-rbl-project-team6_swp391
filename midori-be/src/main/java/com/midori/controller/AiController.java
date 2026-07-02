package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
import com.midori.dto.ai.GenerateQuestionsRequest;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.security.CustomUserDetails;
import com.midori.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ChatResponse response = aiService.chat(userDetails.getId(), request.getConversationId(), request.getMessage());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationResponse>>> getConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<AiConversationResponse> conversations = aiService.getUserConversations(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ConversationMessagesResponse>> getConversationMessages(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ConversationMessagesResponse response = aiService.getConversationMessages(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        aiService.deleteConversation(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }

    @PostMapping("/generate-questions")
    public ResponseEntity<ApiResponse<GenerateQuestionsResponse>> generateQuestions(
            @Valid @RequestBody GenerateQuestionsRequest request) {
        GenerateQuestionsResponse response = aiService.generateQuestions(
                request.getTopic(),
                request.getLevel(),
                request.getCount(),
                request.getType());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
