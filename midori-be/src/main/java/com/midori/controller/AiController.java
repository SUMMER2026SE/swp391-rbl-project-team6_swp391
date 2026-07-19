package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.ai.AiConversationResponse;
import com.midori.dto.ai.ChatRequest;
import com.midori.dto.ai.ChatResponse;
import com.midori.dto.ai.ConversationMessagesResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.midori.exception.UnauthorizedException;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;

    /**
     * Extracts the authenticated user ID from the security principal.
     * If the principal is null (should not happen with proper security config),
     * throws UnauthorizedException to return HTTP 401.
     */
    private UUID requireUserId(CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return userDetails.getId();
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireUserId(userDetails);
        ChatResponse response = aiService.chat(
                userId,
                request.getConversationId(),
                request.getMessage(),
                request.getSelectedMaterial());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationResponse>>> getConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireUserId(userDetails);
        List<AiConversationResponse> conversations = aiService.getUserConversations(userId);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ConversationMessagesResponse>> getConversationMessages(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireUserId(userDetails);
        ConversationMessagesResponse response = aiService.getConversationMessages(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireUserId(userDetails);
        aiService.deleteConversation(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }

    /**
     * Generate quiz questions for the authenticated user.
     * Access restricted to STUDENT and ADMIN roles.
     */
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @PostMapping("/generate-questions")
    public ResponseEntity<ApiResponse<GenerateQuestionsResponse>> generateQuestions(
            @Valid @RequestBody GenerateQuestionsRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireUserId(userDetails);
        log.info("[AiController] generate-questions request from userId={}: questionType={}, questionCount={}, materialTitle={}",
                userId, request.getNormalizedType(), request.getCount(), request.getMaterialTitle());
        GenerateQuestionsResponse response = aiService.generateQuestions(
                userId,
                request.getMaterialTitle() != null ? request.getMaterialTitle() : request.getTopic(),
                request.getLevel(),
                request.getCount(),
                request.getNormalizedType(),
                request.getMaterialContent());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/conversations/{id}/title")
    public ResponseEntity<ApiResponse<AiConversationResponse>> updateConversationTitle(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConversationTitleRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireUserId(userDetails);
        AiConversationResponse response = aiService.updateConversationTitle(id, userId, request.getTitle());
        return ResponseEntity.ok(ApiResponse.success("Conversation title updated successfully", response));
    }

    @PatchMapping("/conversations/{id}/messages/{messageId}")
    public ResponseEntity<ApiResponse<ConversationMessagesResponse>> updateUserMessage(
            @PathVariable UUID id,
            @PathVariable UUID messageId,
            @Valid @RequestBody UpdateAiMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireUserId(userDetails);
        ConversationMessagesResponse response = aiService.updateUserMessage(id, messageId, userId, request.getContent(), request.getSelectedMaterial());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
