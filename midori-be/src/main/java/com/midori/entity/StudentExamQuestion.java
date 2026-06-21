package com.midori.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "student_exam_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_exam_id", nullable = false)
    private StudentExam studentExam;

    @Column(name = "original_question_id")
    private UUID originalQuestionId;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @ElementCollection
    @CollectionTable(name = "student_exam_question_options", joinColumns = @JoinColumn(name = "student_exam_question_id"))
    @Column(name = "option_text", columnDefinition = "TEXT")
    @OrderColumn(name = "option_index")
    private java.util.List<String> options;

    @Column(name = "correct_answer_index", nullable = false)
    private Integer correctAnswerIndex;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "points")
    private Integer points;

    @Column(name = "selected_answer_index")
    private Integer selectedAnswerIndex;

    @Column(name = "is_correct")
    private Boolean isCorrect;
}
