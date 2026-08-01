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
@Table(name = "exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private GrammarLevel level;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "time_limit", nullable = false)
    private Integer timeLimit;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_mode", nullable = false, length = 20)
    @Builder.Default
    private ExamMode examMode = ExamMode.SAME_FOR_ALL;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_reuse", nullable = false, length = 20)
    @Builder.Default
    private QuestionReuse questionReuse = QuestionReuse.ALLOW_REUSE;

    @Column(name = "randomize_answers", nullable = false)
    @Builder.Default
    private Boolean randomizeAnswers = false;

    @Column(name = "lesson_ids", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> lessonIds = new ArrayList<>();

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "difficulty_easy")
    @Builder.Default
    private Integer difficultyEasy = 0;

    @Column(name = "difficulty_medium")
    @Builder.Default
    private Integer difficultyMedium = 0;

    @Column(name = "difficulty_hard")
    @Builder.Default
    private Integer difficultyHard = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_class_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private ClassEntity assignedClass;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExamQuestion> questions = new ArrayList<>();

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentExam> studentExams = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExamStatus status = ExamStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
