package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exam_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "source_grammar_id")
    private UUID sourceGrammarId;

    @Column(name = "source_vocabulary_id")
    private UUID sourceVocabularyId;

    @Column(name = "source_teacher_question_id")
    private UUID sourceTeacherQuestionId;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @ElementCollection
    @CollectionTable(name = "exam_question_options", joinColumns = @JoinColumn(name = "exam_question_id"))
    @Column(name = "option_text", columnDefinition = "TEXT")
    @OrderColumn(name = "option_index")
    @Builder.Default
    private List<String> options = new ArrayList<>();

    @Column(name = "correct_answer_index", nullable = false)
    private Integer correctAnswerIndex;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", length = 20)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Column(name = "lesson_id")
    private String lessonId;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "points")
    @Builder.Default
    private Integer points = 1;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
