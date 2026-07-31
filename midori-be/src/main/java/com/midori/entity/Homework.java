package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "homework", indexes = {
    @Index(name = "idx_homework_class_id", columnList = "class_id")
})
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

    @OneToMany(mappedBy = "homework", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionOrder ASC")
    @Builder.Default
    private java.util.List<HomeworkQuestion> homeworkQuestions = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "homework", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private java.util.List<HomeworkSubmission> submissions = new java.util.ArrayList<>();

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM homework_questions hq WHERE hq.homework_id = id)")
    private Integer totalQuestionsCache;

    public java.util.List<TeacherQuestion> getQuestions() {
        if (homeworkQuestions == null) {
            return new java.util.ArrayList<>();
        }
        return homeworkQuestions.stream()
                .sorted(java.util.Comparator.comparing(HomeworkQuestion::getQuestionOrder))
                .map(HomeworkQuestion::getQuestion)
                .collect(java.util.stream.Collectors.toList());
    }

    public void setQuestions(java.util.List<TeacherQuestion> questions) {
        if (this.homeworkQuestions == null) {
            this.homeworkQuestions = new java.util.ArrayList<>();
        } else {
            this.homeworkQuestions.clear();
        }
        if (questions == null) {
            return;
        }
        for (int i = 0; i < questions.size(); i++) {
            TeacherQuestion q = questions.get(i);
            HomeworkQuestionId hqId = new HomeworkQuestionId(this.id, q.getId());
            this.homeworkQuestions.add(HomeworkQuestion.builder()
                    .id(hqId)
                    .homework(this)
                    .question(q)
                    .questionOrder(i + 1)
                    .build());
        }
    }


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
