package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "grammars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grammar {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "pattern", columnDefinition = "TEXT")
    private String pattern;

    @Column(name = "meaning", columnDefinition = "TEXT")
    private String meaning;

    @Column(name = "structure", columnDefinition = "TEXT")
    private String structure;

    @Column(name = "usage", columnDefinition = "TEXT")
    private String usage;

    @Column(name = "examples", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> examples = new java.util.ArrayList<>();

    @Column(name = "example_meanings", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> exampleMeanings = new java.util.ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private GrammarLevel level;

    @Column(name = "lesson_number")
    private Integer lessonNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GrammarStatus status = GrammarStatus.DRAFT;

    @Column(name = "reject_reason", length = 1000)
    private String rejectReason;

    // Pending update fields - lưu nội dung mới khi teacher edit bài APPROVED
    @Column(name = "has_pending_update")
    @Builder.Default
    private Boolean hasPendingUpdate = false;

    @Column(name = "pending_title", length = 255)
    private String pendingTitle;

    @Column(name = "pending_pattern", columnDefinition = "TEXT")
    private String pendingPattern;

    @Column(name = "pending_meaning", columnDefinition = "TEXT")
    private String pendingMeaning;

    @Column(name = "pending_structure", columnDefinition = "TEXT")
    private String pendingStructure;

    @Column(name = "pending_usage", columnDefinition = "TEXT")
    private String pendingUsage;

    @Column(name = "pending_examples", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> pendingExamples = new java.util.ArrayList<>();

    @Column(name = "pending_example_meanings", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> pendingExampleMeanings = new java.util.ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "pending_level", length = 10)
    private GrammarLevel pendingLevel;

    @Column(name = "pending_update_reject_reason", length = 1000)
    private String pendingUpdateRejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
