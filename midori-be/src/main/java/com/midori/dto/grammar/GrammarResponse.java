package com.midori.dto.grammar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrammarResponse {

    private UUID id;
    private String title;
    private String pattern;
    private String meaning;
    private String structure;
    private String usage;
    private List<String> examples;
    private List<String> exampleMeanings;
    private String level;
    private Integer lessonNumber;
    private UUID lessonId;
    private String status;
    private String rejectReason;
    private UUID createdBy;
    private String teacherName;
    private Boolean ownedByMe;
    private Instant createdAt;
    private Instant updatedAt;

    // Pending update fields
    private Boolean hasPendingUpdate;
    private String pendingTitle;
    private String pendingPattern;
    private String pendingMeaning;
    private String pendingStructure;
    private String pendingUsage;
    private List<String> pendingExamples;
    private List<String> pendingExampleMeanings;
    private String pendingLevel;
    private String pendingUpdateRejectReason;
}
