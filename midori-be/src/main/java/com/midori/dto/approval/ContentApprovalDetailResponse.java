package com.midori.dto.approval;

import com.midori.dto.flashcard.FlashcardCardResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentApprovalDetailResponse {

    private String contentType;
    private UUID contentId;
    private GrammarDetailContent grammar;
    private FlashcardDetailContent flashcard;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrammarDetailContent {
        private UUID id;
        private String title;
        private String pattern;
        private String meaning;
        private String structure;
        private String usage;
        private java.util.List<String> examples;
        private java.util.List<String> exampleMeanings;
        private String level;
        private String status;
        private String rejectReason;
        private UUID createdBy;
        private String teacherName;
        private Long cardCount;
        private java.time.Instant createdAt;
        private java.time.Instant updatedAt;

        // Pending update fields (when hasPendingUpdate = true)
        private Boolean hasPendingUpdate;
        private String pendingTitle;
        private String pendingPattern;
        private String pendingMeaning;
        private String pendingStructure;
        private String pendingUsage;
        private java.util.List<String> pendingExamples;
        private java.util.List<String> pendingExampleMeanings;
        private String pendingLevel;
        private String pendingUpdateRejectReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FlashcardDetailContent {
        private UUID id;
        private String title;
        private String description;
        private String level;
        private String status;
        private String rejectReason;
        private UUID teacherId;
        private String teacherName;
        private Long cardCount;
        private List<FlashcardCardResponse> cards;
        private java.time.Instant createdAt;
        private java.time.Instant updatedAt;
    }
}
