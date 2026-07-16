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
@Table(name = "manual_homeworks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualHomework {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 10)
    private String level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private HomeworkType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private HomeworkStatus status = HomeworkStatus.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private Integer duration = 0; // in minutes

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(name = "question_count", nullable = false)
    @Builder.Default
    private Integer questionCount = 0;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @OneToMany(mappedBy = "manualHomework", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionOrder ASC")
    @Builder.Default
    private List<ManualHomeworkQuestion> questions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
