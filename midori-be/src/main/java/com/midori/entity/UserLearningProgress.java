package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_learning_progress",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_content_type_content_id",
                        columnNames = {"user_id", "content_type", "content_id"}
                )
        },
        indexes = {
                @Index(name = "idx_progress_user_id", columnList = "user_id"),
                @Index(name = "idx_progress_content_type", columnList = "content_type"),
                @Index(name = "idx_progress_content_id", columnList = "content_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    @Column(name = "content_id", nullable = false, length = 500)
    private String contentId;

    @Column(name = "learned", nullable = false)
    @Builder.Default
    private Boolean learned = false;

    @Column(name = "mastered", nullable = false)
    @Builder.Default
    private Boolean mastered = false;

    @Column(name = "favorite", nullable = false)
    @Builder.Default
    private Boolean favorite = false;

    @Column(name = "completed", nullable = false)
    @Builder.Default
    private Boolean completed = false;

    @Column(name = "progress_percent", nullable = false)
    @Builder.Default
    private Integer progressPercent = 0;

    @Column(name = "last_studied_at")
    private Instant lastStudiedAt;

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
