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
@Table(name = "teacher_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(name = "topic_id", length = 100)
    private String topicId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Column(name = "jp_prompt")
    private String jpPrompt;

    @Column(name = "question_type", nullable = false, length = 50)
    private String questionType;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String difficulty = "MEDIUM";

    @Column(name = "correct_answer_index", nullable = false)
    private Integer correctAnswerIndex;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    private String tags;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Builder.Default
    private Integer points = 1;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "teacher_question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text")
    @OrderColumn(name = "option_order")
    @Builder.Default
    private List<String> options = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
