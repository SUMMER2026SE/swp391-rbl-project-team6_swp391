package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
import com.midori.dto.ai.ExplainRequest;
import com.midori.dto.ai.ExplainResponse;
import com.midori.dto.ai.GenerateQuestionsRequest;
import com.midori.dto.ai.GenerateQuestionsResponse;
import com.midori.dto.ai.UpdateAiMessageRequest;
import com.midori.dto.ai.UpdateConversationTitleRequest;
import com.midori.security.CustomUserDetails;
import com.midori.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ChatResponse response = aiService.chat(
                userDetails.getId(),
                request.getConversationId(),
                request.getMessage(),
                request.getSelectedMaterial());
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
        String normalizedType = request.getNormalizedType();
        log.info("[AiController] generate-questions request: questionType={}, questionCount={}, materialTitle={}",
                normalizedType, request.getCount(), request.getMaterialTitle());
        GenerateQuestionsResponse response = aiService.generateQuestions(
                request.getMaterialTitle() != null ? request.getMaterialTitle() : request.getTopic(),
                request.getLevel(),
                request.getCount(),
                normalizedType,
                request.getMaterialContent());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/explain")
    public ResponseEntity<ApiResponse<ExplainResponse>> explain(@Valid @RequestBody ExplainRequest request) {
        ExplainResponse response = aiService.explain(request.getSentence(), request.getWord());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/conversations/{id}/title")
    public ResponseEntity<ApiResponse<AiConversationResponse>> updateConversationTitle(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConversationTitleRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AiConversationResponse response = aiService.updateConversationTitle(id, userDetails.getId(), request.getTitle());
        return ResponseEntity.ok(ApiResponse.success("Conversation title updated successfully", response));
    }

    @PatchMapping("/conversations/{id}/messages/{messageId}")
    public ResponseEntity<ApiResponse<ConversationMessagesResponse>> updateUserMessage(
            @PathVariable UUID id,
            @PathVariable UUID messageId,
            @Valid @RequestBody UpdateAiMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ConversationMessagesResponse response = aiService.updateUserMessage(id, messageId, userDetails.getId(), request.getContent(), request.getSelectedMaterial());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}