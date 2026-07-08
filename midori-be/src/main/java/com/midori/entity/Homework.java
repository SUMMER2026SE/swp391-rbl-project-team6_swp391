package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "homework")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Homework {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity assignedClass;

    @Column(name = "lesson_id", length = 50)
    private String lessonId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @Column(name = "max_score", nullable = false)
    private Integer maxScore;

    @Builder.Default
    private Integer attempts = 1;

    @Column(name = "time_limit")
    @Builder.Default
    private Integer timeLimit = 0; // in minutes, 0 means unlimited

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private HomeworkStatus status = HomeworkStatus.DRAFT;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "homework_questions",
        joinColumns = @JoinColumn(name = "homework_id"),
        inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    @Builder.Default
    private java.util.List<TeacherQuestion> questions = new java.util.ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum HomeworkStatus {
        DRAFT,
        ASSIGNED,
        CLOSED
    }
}
